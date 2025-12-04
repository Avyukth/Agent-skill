# Multi-Cloud Pulumi Deployment

Pulumi Go programs for EKS, GKE, and AKS with unified patterns.

---

## Project Structure for Multi-Cloud

```
infra/
├── go.mod
├── go.sum
├── Pulumi.yaml
├── main.go
├── pkg/
│   ├── config/
│   │   └── settings.go      # Unified config
│   ├── cluster/
│   │   ├── interface.go     # Cluster interface
│   │   ├── eks.go           # AWS EKS
│   │   ├── gke.go           # GCP GKE
│   │   └── aks.go           # Azure AKS
│   └── addons/
│       ├── argocd.go
│       ├── ingress.go
│       └── monitoring.go
└── stacks/
    ├── Pulumi.aws-dev.yaml
    ├── Pulumi.aws-prod.yaml
    ├── Pulumi.gcp-dev.yaml
    ├── Pulumi.gcp-prod.yaml
    ├── Pulumi.azure-dev.yaml
    └── Pulumi.azure-prod.yaml
```

---

## Cluster Interface

```go
// pkg/cluster/interface.go
package cluster

import "github.com/pulumi/pulumi/sdk/v3/go/pulumi"

// ClusterResult represents the output of cluster creation
type ClusterResult struct {
    Name       pulumi.StringOutput
    Endpoint   pulumi.StringOutput
    Kubeconfig pulumi.StringOutput
    OIDCIssuer pulumi.StringOutput // For workload identity
}

// ClusterConfig represents common cluster configuration
type ClusterConfig struct {
    Name        string
    Environment string
    Region      string
    NodeCount   int
    NodeSize    string
    K8sVersion  string
}
```

---

## Azure AKS Implementation

```go
// pkg/cluster/aks.go
package cluster

import (
    "fmt"

    "github.com/pulumi/pulumi-azure-native-sdk/containerservice/v2"
    "github.com/pulumi/pulumi-azure-native-sdk/resources/v2"
    "github.com/pulumi/pulumi-azure-native-sdk/network/v2"
    "github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func CreateAKSCluster(ctx *pulumi.Context, cfg ClusterConfig) (*ClusterResult, error) {
    // Create Resource Group
    rg, err := resources.NewResourceGroup(ctx, fmt.Sprintf("%s-rg", cfg.Name), &resources.ResourceGroupArgs{
        Location: pulumi.String(cfg.Region),
        Tags: pulumi.StringMap{
            "environment": pulumi.String(cfg.Environment),
        },
    })
    if err != nil {
        return nil, err
    }

    // Create Virtual Network
    vnet, err := network.NewVirtualNetwork(ctx, fmt.Sprintf("%s-vnet", cfg.Name), &network.VirtualNetworkArgs{
        ResourceGroupName: rg.Name,
        Location:          rg.Location,
        AddressSpace: &network.AddressSpaceArgs{
            AddressPrefixes: pulumi.StringArray{
                pulumi.String("10.0.0.0/8"),
            },
        },
    })
    if err != nil {
        return nil, err
    }

    // Create Subnet for AKS
    subnet, err := network.NewSubnet(ctx, fmt.Sprintf("%s-subnet", cfg.Name), &network.SubnetArgs{
        ResourceGroupName:  rg.Name,
        VirtualNetworkName: vnet.Name,
        AddressPrefix:      pulumi.String("10.240.0.0/16"),
    })
    if err != nil {
        return nil, err
    }

    // Create AKS Cluster
    cluster, err := containerservice.NewManagedCluster(ctx, cfg.Name, &containerservice.ManagedClusterArgs{
        ResourceGroupName: rg.Name,
        Location:          rg.Location,
        DnsPrefix:         pulumi.String(cfg.Name),
        KubernetesVersion: pulumi.String(cfg.K8sVersion),

        // Enable managed identity
        Identity: &containerservice.ManagedClusterIdentityArgs{
            Type: containerservice.ResourceIdentityTypeSystemAssigned,
        },

        // Agent pool configuration
        AgentPoolProfiles: containerservice.ManagedClusterAgentPoolProfileArray{
            &containerservice.ManagedClusterAgentPoolProfileArgs{
                Name:         pulumi.String("default"),
                Mode:         containerservice.AgentPoolModeSystem,
                Count:        pulumi.Int(cfg.NodeCount),
                VmSize:       pulumi.String(cfg.NodeSize),
                OsType:       containerservice.OSTypeLinux,
                VnetSubnetID: subnet.ID(),
                EnableAutoScaling: pulumi.Bool(true),
                MinCount:     pulumi.Int(1),
                MaxCount:     pulumi.Int(cfg.NodeCount * 2),
            },
        },

        // Network configuration
        NetworkProfile: &containerservice.ContainerServiceNetworkProfileArgs{
            NetworkPlugin:    containerservice.NetworkPluginAzure,
            NetworkPolicy:    containerservice.NetworkPolicyCalico,
            ServiceCidr:      pulumi.String("10.96.0.0/12"),
            DnsServiceIP:     pulumi.String("10.96.0.10"),
            LoadBalancerSku:  containerservice.LoadBalancerSkuStandard,
        },

        // Enable OIDC issuer for workload identity
        OidcIssuerProfile: &containerservice.ManagedClusterOIDCIssuerProfileArgs{
            Enabled: pulumi.Bool(true),
        },

        // Security profile
        SecurityProfile: &containerservice.ManagedClusterSecurityProfileArgs{
            WorkloadIdentity: &containerservice.ManagedClusterSecurityProfileWorkloadIdentityArgs{
                Enabled: pulumi.Bool(true),
            },
        },

        // Add-ons
        AddonProfiles: containerservice.ManagedClusterAddonProfileMap{
            "azureKeyvaultSecretsProvider": &containerservice.ManagedClusterAddonProfileArgs{
                Enabled: pulumi.Bool(true),
            },
        },

        Tags: pulumi.StringMap{
            "environment": pulumi.String(cfg.Environment),
        },
    })
    if err != nil {
        return nil, err
    }

    // Get kubeconfig
    creds := containerservice.ListManagedClusterUserCredentialsOutput(ctx,
        containerservice.ListManagedClusterUserCredentialsOutputArgs{
            ResourceGroupName: rg.Name,
            ResourceName:      cluster.Name,
        },
    )

    kubeconfig := creds.Kubeconfigs().Index(pulumi.Int(0)).Value().ApplyT(func(encoded string) string {
        decoded, _ := base64.StdEncoding.DecodeString(encoded)
        return string(decoded)
    }).(pulumi.StringOutput)

    return &ClusterResult{
        Name:       cluster.Name,
        Endpoint:   cluster.Fqdn,
        Kubeconfig: kubeconfig,
        OIDCIssuer: cluster.OidcIssuerProfile.IssuerURL(),
    }, nil
}
```

---

## Unified Main Entry Point

```go
// main.go
package main

import (
    "fmt"

    "github.com/pulumi/pulumi/sdk/v3/go/pulumi"
    "github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"

    "myproject/infra/pkg/cluster"
    "myproject/infra/pkg/addons"
)

func main() {
    pulumi.Run(func(ctx *pulumi.Context) error {
        cfg := config.New(ctx, "")

        // Read configuration
        cloudProvider := cfg.Require("cloud")
        environment := cfg.Require("environment")
        region := cfg.Require("region")

        clusterCfg := cluster.ClusterConfig{
            Name:        fmt.Sprintf("%s-%s", environment, "cluster"),
            Environment: environment,
            Region:      region,
            NodeCount:   cfg.GetInt("nodeCount"),
            NodeSize:    cfg.Get("nodeSize"),
            K8sVersion:  cfg.Get("k8sVersion"),
        }

        // Set defaults
        if clusterCfg.NodeCount == 0 {
            clusterCfg.NodeCount = 2
        }
        if clusterCfg.K8sVersion == "" {
            clusterCfg.K8sVersion = "1.32"
        }

        // Create cluster based on cloud provider
        var result *cluster.ClusterResult
        var err error

        switch cloudProvider {
        case "aws":
            if clusterCfg.NodeSize == "" {
                clusterCfg.NodeSize = "t3.medium"
            }
            result, err = cluster.CreateEKSCluster(ctx, clusterCfg)
        case "gcp":
            if clusterCfg.NodeSize == "" {
                clusterCfg.NodeSize = "e2-medium"
            }
            result, err = cluster.CreateGKECluster(ctx, clusterCfg)
        case "azure":
            if clusterCfg.NodeSize == "" {
                clusterCfg.NodeSize = "Standard_D2s_v3"
            }
            result, err = cluster.CreateAKSCluster(ctx, clusterCfg)
        default:
            return fmt.Errorf("unsupported cloud provider: %s", cloudProvider)
        }

        if err != nil {
            return err
        }

        // Install common addons
        if err := addons.InstallIngress(ctx, result.Kubeconfig); err != nil {
            return err
        }

        if err := addons.InstallArgoCD(ctx, result.Kubeconfig); err != nil {
            return err
        }

        if err := addons.InstallArgoRollouts(ctx, result.Kubeconfig); err != nil {
            return err
        }

        // Export outputs
        ctx.Export("clusterName", result.Name)
        ctx.Export("clusterEndpoint", result.Endpoint)
        ctx.Export("kubeconfig", pulumi.ToSecret(result.Kubeconfig))
        ctx.Export("oidcIssuer", result.OIDCIssuer)

        return nil
    })
}
```

---

## Stack Configuration Files

### Pulumi.aws-prod.yaml

```yaml
config:
  cloud: aws
  environment: prod
  region: us-east-1
  nodeCount: 3
  nodeSize: t3.large
  k8sVersion: "1.32"
  aws:region: us-east-1
```

### Pulumi.gcp-prod.yaml

```yaml
config:
  cloud: gcp
  environment: prod
  region: us-central1
  nodeCount: 3
  nodeSize: e2-standard-2
  k8sVersion: "1.32"
  gcp:project: my-gcp-project
  gcp:region: us-central1
```

### Pulumi.azure-prod.yaml

```yaml
config:
  cloud: azure
  environment: prod
  region: eastus
  nodeCount: 3
  nodeSize: Standard_D2s_v3
  k8sVersion: "1.32"
  azure-native:location: eastus
```

---

## Crossguard Policies

```go
// policy/main.go
package main

import (
    "github.com/pulumi/pulumi-policy-sdk/sdk/go/pulumi-policy"
)

func main() {
    policy.NewPolicyPack("kubernetes-best-practices", []policy.Policy{
        // Require resource limits
        {
            Name:             "require-resource-limits",
            Description:      "Containers must have resource limits",
            EnforcementLevel: policy.Mandatory,
            ResourceValidation: func(args policy.ResourceValidationArgs, reportViolation func(string)) {
                if args.Type == "kubernetes:apps/v1:Deployment" {
                    // Check for resource limits
                }
            },
        },
        // Require non-root
        {
            Name:             "require-non-root",
            Description:      "Containers must run as non-root",
            EnforcementLevel: policy.Mandatory,
            // ... implementation
        },
    })
}
```

---

## Multi-Cloud Deployment Commands

```bash
# Deploy to AWS
pulumi stack select aws-prod
pulumi up --yes

# Deploy to GCP
pulumi stack select gcp-prod
pulumi up --yes

# Deploy to Azure
pulumi stack select azure-prod
pulumi up --yes

# Preview all stacks
for stack in aws-prod gcp-prod azure-prod; do
  echo "=== $stack ==="
  pulumi stack select $stack
  pulumi preview
done
```
