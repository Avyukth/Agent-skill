# Pulumi Go Templates

Complete Pulumi Go programs for Kubernetes infrastructure provisioning.

---

## Project Structure

```
infra/
├── go.mod
├── go.sum
├── Pulumi.yaml
├── Pulumi.dev.yaml
├── Pulumi.staging.yaml
├── Pulumi.prod.yaml
├── main.go
├── pkg/
│   ├── cluster/
│   │   ├── eks.go
│   │   ├── gke.go
│   │   └── aks.go
│   ├── networking/
│   │   └── vpc.go
│   └── addons/
│       ├── argocd.go
│       └── ingress.go
└── config/
    └── settings.go
```

---

## Pulumi.yaml

```yaml
name: cloud-infra
runtime: go
description: Kubernetes infrastructure with Pulumi Go

config:
  cloud:
    description: Cloud provider (aws, gcp, azure)
    default: aws
  environment:
    description: Environment name
    default: dev
  clusterName:
    description: Kubernetes cluster name
    default: my-cluster
```

---

## main.go

```go
package main

import (
	"fmt"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		cfg := config.New(ctx, "")
		cloud := cfg.Require("cloud")
		env := cfg.Require("environment")
		clusterName := cfg.Get("clusterName")
		if clusterName == "" {
			clusterName = fmt.Sprintf("%s-%s", env, "cluster")
		}

		var kubeconfig pulumi.StringOutput
		var clusterEndpoint pulumi.StringOutput

		switch cloud {
		case "aws":
			result, err := createEKSCluster(ctx, clusterName, env)
			if err != nil {
				return err
			}
			kubeconfig = result.Kubeconfig
			clusterEndpoint = result.Endpoint
		case "gcp":
			result, err := createGKECluster(ctx, clusterName, env)
			if err != nil {
				return err
			}
			kubeconfig = result.Kubeconfig
			clusterEndpoint = result.Endpoint
		case "azure":
			result, err := createAKSCluster(ctx, clusterName, env)
			if err != nil {
				return err
			}
			kubeconfig = result.Kubeconfig
			clusterEndpoint = result.Endpoint
		default:
			return fmt.Errorf("unsupported cloud provider: %s", cloud)
		}

		// Install cluster addons
		if err := installAddons(ctx, kubeconfig, env); err != nil {
			return err
		}

		// Export outputs
		ctx.Export("kubeconfig", kubeconfig)
		ctx.Export("clusterEndpoint", clusterEndpoint)
		ctx.Export("clusterName", pulumi.String(clusterName))

		return nil
	})
}
```

---

## pkg/cluster/eks.go

```go
package main

import (
	"encoding/json"
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/eks"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

type EKSClusterResult struct {
	Kubeconfig pulumi.StringOutput
	Endpoint   pulumi.StringOutput
	ClusterArn pulumi.StringOutput
}

func createEKSCluster(ctx *pulumi.Context, name, env string) (*EKSClusterResult, error) {
	// Create VPC
	vpc, err := ec2.NewVpc(ctx, fmt.Sprintf("%s-vpc", name), &ec2.VpcArgs{
		CidrBlock:          pulumi.String("10.0.0.0/16"),
		EnableDnsHostnames: pulumi.Bool(true),
		EnableDnsSupport:   pulumi.Bool(true),
		Tags: pulumi.StringMap{
			"Name":        pulumi.Sprintf("%s-vpc", name),
			"Environment": pulumi.String(env),
		},
	})
	if err != nil {
		return nil, err
	}

	// Create Internet Gateway
	igw, err := ec2.NewInternetGateway(ctx, fmt.Sprintf("%s-igw", name), &ec2.InternetGatewayArgs{
		VpcId: vpc.ID(),
		Tags: pulumi.StringMap{
			"Name": pulumi.Sprintf("%s-igw", name),
		},
	})
	if err != nil {
		return nil, err
	}

	// Create subnets in 2 AZs
	azs := []string{"a", "b"}
	var publicSubnetIds pulumi.StringArray
	var privateSubnetIds pulumi.StringArray

	for i, az := range azs {
		// Public subnet
		publicSubnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("%s-public-%s", name, az), &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.Sprintf("10.0.%d.0/24", i*10),
			AvailabilityZone:    pulumi.Sprintf("us-east-1%s", az),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":                   pulumi.Sprintf("%s-public-%s", name, az),
				"kubernetes.io/role/elb": pulumi.String("1"),
			},
		})
		if err != nil {
			return nil, err
		}
		publicSubnetIds = append(publicSubnetIds, publicSubnet.ID())

		// Private subnet
		privateSubnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("%s-private-%s", name, az), &ec2.SubnetArgs{
			VpcId:            vpc.ID(),
			CidrBlock:        pulumi.Sprintf("10.0.%d.0/24", i*10+100),
			AvailabilityZone: pulumi.Sprintf("us-east-1%s", az),
			Tags: pulumi.StringMap{
				"Name":                            pulumi.Sprintf("%s-private-%s", name, az),
				"kubernetes.io/role/internal-elb": pulumi.String("1"),
			},
		})
		if err != nil {
			return nil, err
		}
		privateSubnetIds = append(privateSubnetIds, privateSubnet.ID())
	}

	// Route table for public subnets
	publicRT, err := ec2.NewRouteTable(ctx, fmt.Sprintf("%s-public-rt", name), &ec2.RouteTableArgs{
		VpcId: vpc.ID(),
		Routes: ec2.RouteTableRouteArray{
			&ec2.RouteTableRouteArgs{
				CidrBlock: pulumi.String("0.0.0.0/0"),
				GatewayId: igw.ID(),
			},
		},
	})
	if err != nil {
		return nil, err
	}

	// Associate public subnets with route table
	for i, subnetId := range publicSubnetIds {
		_, err := ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("%s-public-rta-%d", name, i), &ec2.RouteTableAssociationArgs{
			SubnetId:     subnetId,
			RouteTableId: publicRT.ID(),
		})
		if err != nil {
			return nil, err
		}
	}

	// EKS Cluster IAM Role
	clusterRole, err := iam.NewRole(ctx, fmt.Sprintf("%s-cluster-role", name), &iam.RoleArgs{
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [{
				"Effect": "Allow",
				"Principal": {"Service": "eks.amazonaws.com"},
				"Action": "sts:AssumeRole"
			}]
		}`),
	})
	if err != nil {
		return nil, err
	}

	// Attach required policies
	_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("%s-cluster-policy", name), &iam.RolePolicyAttachmentArgs{
		Role:      clusterRole.Name,
		PolicyArn: pulumi.String("arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"),
	})
	if err != nil {
		return nil, err
	}

	// Create EKS Cluster
	cluster, err := eks.NewCluster(ctx, name, &eks.ClusterArgs{
		RoleArn: clusterRole.Arn,
		VpcConfig: &eks.ClusterVpcConfigArgs{
			SubnetIds:            privateSubnetIds,
			EndpointPublicAccess: pulumi.Bool(true),
		},
		Version: pulumi.String("1.32"),
		EnabledClusterLogTypes: pulumi.StringArray{
			pulumi.String("api"),
			pulumi.String("audit"),
			pulumi.String("authenticator"),
		},
		Tags: pulumi.StringMap{
			"Environment": pulumi.String(env),
		},
	})
	if err != nil {
		return nil, err
	}

	// Node Group IAM Role
	nodeRole, err := iam.NewRole(ctx, fmt.Sprintf("%s-node-role", name), &iam.RoleArgs{
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [{
				"Effect": "Allow",
				"Principal": {"Service": "ec2.amazonaws.com"},
				"Action": "sts:AssumeRole"
			}]
		}`),
	})
	if err != nil {
		return nil, err
	}

	// Attach node policies
	nodePolicies := []string{
		"arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
		"arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
		"arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
	}
	for i, policy := range nodePolicies {
		_, err = iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("%s-node-policy-%d", name, i), &iam.RolePolicyAttachmentArgs{
			Role:      nodeRole.Name,
			PolicyArn: pulumi.String(policy),
		})
		if err != nil {
			return nil, err
		}
	}

	// Create Node Group
	_, err = eks.NewNodeGroup(ctx, fmt.Sprintf("%s-nodes", name), &eks.NodeGroupArgs{
		ClusterName:   cluster.Name,
		NodeRoleArn:   nodeRole.Arn,
		SubnetIds:     privateSubnetIds,
		InstanceTypes: pulumi.StringArray{pulumi.String("t3.medium")},
		ScalingConfig: &eks.NodeGroupScalingConfigArgs{
			DesiredSize: pulumi.Int(2),
			MinSize:     pulumi.Int(1),
			MaxSize:     pulumi.Int(4),
		},
		Labels: pulumi.StringMap{
			"environment": pulumi.String(env),
		},
	})
	if err != nil {
		return nil, err
	}

	// Generate kubeconfig
	kubeconfig := pulumi.All(cluster.Name, cluster.Endpoint, cluster.CertificateAuthority).ApplyT(
		func(args []interface{}) (string, error) {
			clusterName := args[0].(string)
			endpoint := args[1].(string)
			ca := args[2].(eks.ClusterCertificateAuthority)

			config := map[string]interface{}{
				"apiVersion": "v1",
				"kind":       "Config",
				"clusters": []map[string]interface{}{
					{
						"name": clusterName,
						"cluster": map[string]interface{}{
							"server":                     endpoint,
							"certificate-authority-data": *ca.Data,
						},
					},
				},
				"contexts": []map[string]interface{}{
					{
						"name": clusterName,
						"context": map[string]interface{}{
							"cluster": clusterName,
							"user":    clusterName,
						},
					},
				},
				"current-context": clusterName,
				"users": []map[string]interface{}{
					{
						"name": clusterName,
						"user": map[string]interface{}{
							"exec": map[string]interface{}{
								"apiVersion": "client.authentication.k8s.io/v1beta1",
								"command":    "aws",
								"args": []string{
									"eks", "get-token", "--cluster-name", clusterName,
								},
							},
						},
					},
				},
			}
			configJSON, err := json.Marshal(config)
			return string(configJSON), err
		},
	).(pulumi.StringOutput)

	return &EKSClusterResult{
		Kubeconfig: kubeconfig,
		Endpoint:   cluster.Endpoint,
		ClusterArn: cluster.Arn,
	}, nil
}
```

---

## pkg/cluster/gke.go

```go
package main

import (
	"fmt"

	"github.com/pulumi/pulumi-gcp/sdk/v8/go/gcp/container"
	"github.com/pulumi/pulumi-gcp/sdk/v8/go/gcp/compute"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

type GKEClusterResult struct {
	Kubeconfig pulumi.StringOutput
	Endpoint   pulumi.StringOutput
}

func createGKECluster(ctx *pulumi.Context, name, env string) (*GKEClusterResult, error) {
	// Create VPC
	network, err := compute.NewNetwork(ctx, fmt.Sprintf("%s-network", name), &compute.NetworkArgs{
		AutoCreateSubnetworks: pulumi.Bool(false),
	})
	if err != nil {
		return nil, err
	}

	// Create Subnet with secondary ranges for pods and services
	subnet, err := compute.NewSubnetwork(ctx, fmt.Sprintf("%s-subnet", name), &compute.SubnetworkArgs{
		Network:     network.ID(),
		IpCidrRange: pulumi.String("10.2.0.0/16"),
		Region:      pulumi.String("us-central1"),
		SecondaryIpRanges: compute.SubnetworkSecondaryIpRangeArray{
			&compute.SubnetworkSecondaryIpRangeArgs{
				RangeName:   pulumi.String("pods"),
				IpCidrRange: pulumi.String("10.4.0.0/14"),
			},
			&compute.SubnetworkSecondaryIpRangeArgs{
				RangeName:   pulumi.String("services"),
				IpCidrRange: pulumi.String("10.8.0.0/20"),
			},
		},
	})
	if err != nil {
		return nil, err
	}

	// Create GKE Cluster
	cluster, err := container.NewCluster(ctx, name, &container.ClusterArgs{
		Location:              pulumi.String("us-central1"),
		InitialNodeCount:      pulumi.Int(1),
		RemoveDefaultNodePool: pulumi.Bool(true),
		Network:               network.Name,
		Subnetwork:            subnet.Name,
		IpAllocationPolicy: &container.ClusterIpAllocationPolicyArgs{
			ClusterSecondaryRangeName:  pulumi.String("pods"),
			ServicesSecondaryRangeName: pulumi.String("services"),
		},
		WorkloadIdentityConfig: &container.ClusterWorkloadIdentityConfigArgs{
			WorkloadPool: pulumi.String(fmt.Sprintf("%s.svc.id.goog", ctx.Project())),
		},
		ReleaseChannel: &container.ClusterReleaseChannelArgs{
			Channel: pulumi.String("STABLE"),
		},
		AddonsConfig: &container.ClusterAddonsConfigArgs{
			HttpLoadBalancing: &container.ClusterAddonsConfigHttpLoadBalancingArgs{
				Disabled: pulumi.Bool(false),
			},
			HorizontalPodAutoscaling: &container.ClusterAddonsConfigHorizontalPodAutoscalingArgs{
				Disabled: pulumi.Bool(false),
			},
		},
		ResourceLabels: pulumi.StringMap{
			"environment": pulumi.String(env),
		},
	})
	if err != nil {
		return nil, err
	}

	// Create Node Pool
	_, err = container.NewNodePool(ctx, fmt.Sprintf("%s-nodes", name), &container.NodePoolArgs{
		Cluster:  cluster.Name,
		Location: pulumi.String("us-central1"),
		NodeConfig: &container.NodePoolNodeConfigArgs{
			MachineType: pulumi.String("e2-medium"),
			OauthScopes: pulumi.StringArray{
				pulumi.String("https://www.googleapis.com/auth/cloud-platform"),
			},
			Labels: pulumi.StringMap{
				"environment": pulumi.String(env),
			},
			WorkloadMetadataConfig: &container.NodePoolNodeConfigWorkloadMetadataConfigArgs{
				Mode: pulumi.String("GKE_METADATA"),
			},
		},
		InitialNodeCount: pulumi.Int(2),
		Autoscaling: &container.NodePoolAutoscalingArgs{
			MinNodeCount: pulumi.Int(1),
			MaxNodeCount: pulumi.Int(4),
		},
		Management: &container.NodePoolManagementArgs{
			AutoRepair:  pulumi.Bool(true),
			AutoUpgrade: pulumi.Bool(true),
		},
	})
	if err != nil {
		return nil, err
	}

	// Generate kubeconfig
	kubeconfig := pulumi.All(cluster.Name, cluster.Endpoint, cluster.MasterAuth).ApplyT(
		func(args []interface{}) string {
			clusterName := args[0].(string)
			endpoint := args[1].(string)
			masterAuth := args[2].(container.ClusterMasterAuth)

			return fmt.Sprintf(`apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: %s
    server: https://%s
  name: %s
contexts:
- context:
    cluster: %s
    user: %s
  name: %s
current-context: %s
users:
- name: %s
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: gke-gcloud-auth-plugin
      installHint: Install gke-gcloud-auth-plugin
`, *masterAuth.ClusterCaCertificate, endpoint, clusterName, clusterName, clusterName, clusterName, clusterName, clusterName)
		},
	).(pulumi.StringOutput)

	return &GKEClusterResult{
		Kubeconfig: kubeconfig,
		Endpoint:   cluster.Endpoint,
	}, nil
}
```

---

## Install Addons Function

```go
func installAddons(ctx *pulumi.Context, kubeconfig pulumi.StringOutput, env string) error {
	// Create Kubernetes provider
	k8sProvider, err := kubernetes.NewProvider(ctx, "k8s-provider", &kubernetes.ProviderArgs{
		Kubeconfig: kubeconfig,
	})
	if err != nil {
		return err
	}

	// Install NGINX Ingress Controller via Helm
	_, err = helm.NewRelease(ctx, "ingress-nginx", &helm.ReleaseArgs{
		Chart:     pulumi.String("ingress-nginx"),
		Version:   pulumi.String("4.11.0"),
		Namespace: pulumi.String("ingress-nginx"),
		CreateNamespace: pulumi.Bool(true),
		RepositoryOpts: &helm.RepositoryOptsArgs{
			Repo: pulumi.String("https://kubernetes.github.io/ingress-nginx"),
		},
		Values: pulumi.Map{
			"controller": pulumi.Map{
				"replicaCount": pulumi.Int(2),
				"metrics": pulumi.Map{
					"enabled": pulumi.Bool(true),
				},
			},
		},
	}, pulumi.Provider(k8sProvider))
	if err != nil {
		return err
	}

	// Install ArgoCD via Helm
	_, err = helm.NewRelease(ctx, "argocd", &helm.ReleaseArgs{
		Chart:     pulumi.String("argo-cd"),
		Version:   pulumi.String("7.7.0"),
		Namespace: pulumi.String("argocd"),
		CreateNamespace: pulumi.Bool(true),
		RepositoryOpts: &helm.RepositoryOptsArgs{
			Repo: pulumi.String("https://argoproj.github.io/argo-helm"),
		},
		Values: pulumi.Map{
			"server": pulumi.Map{
				"service": pulumi.Map{
					"type": pulumi.String("LoadBalancer"),
				},
			},
		},
	}, pulumi.Provider(k8sProvider))
	if err != nil {
		return err
	}

	// Install Argo Rollouts via Helm
	_, err = helm.NewRelease(ctx, "argo-rollouts", &helm.ReleaseArgs{
		Chart:     pulumi.String("argo-rollouts"),
		Version:   pulumi.String("2.38.0"),
		Namespace: pulumi.String("argo-rollouts"),
		CreateNamespace: pulumi.Bool(true),
		RepositoryOpts: &helm.RepositoryOptsArgs{
			Repo: pulumi.String("https://argoproj.github.io/argo-helm"),
		},
		Values: pulumi.Map{
			"dashboard": pulumi.Map{
				"enabled": pulumi.Bool(true),
			},
		},
	}, pulumi.Provider(k8sProvider))

	return err
}
```

---

## Running Pulumi

```bash
# Initialize project
cd infra
pulumi stack init dev

# Configure stack
pulumi config set cloud aws
pulumi config set environment dev
pulumi config set aws:region us-east-1

# Preview changes
pulumi preview

# Deploy
pulumi up --yes

# Get outputs
pulumi stack output kubeconfig --show-secrets > kubeconfig.yaml
export KUBECONFIG=./kubeconfig.yaml

# Destroy when done
pulumi destroy --yes
```
