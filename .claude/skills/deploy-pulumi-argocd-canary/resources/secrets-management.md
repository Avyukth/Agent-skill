# Secrets Management

Secure secrets handling with External Secrets Operator and cloud provider integration.

---

## External Secrets Operator Setup

### Install via Helm

```bash
# Add Helm repo
helm repo add external-secrets https://charts.external-secrets.io

# Install ESO
helm install external-secrets external-secrets/external-secrets \
  --namespace external-secrets \
  --create-namespace \
  --set installCRDs=true
```

---

## AWS Secrets Manager Integration

### SecretStore with IRSA

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: aws-secrets-manager
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
            namespace: external-secrets
```

### IAM Policy for ESO

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:my-app/*"
    }
  ]
}
```

### ExternalSecret Example

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
  namespace: my-app-prod
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: db-credentials
    creationPolicy: Owner
    template:
      type: Opaque
      data:
        DATABASE_URL: "postgresql://{{ .username }}:{{ .password }}@{{ .host }}:5432/{{ .database }}"
  data:
    - secretKey: username
      remoteRef:
        key: my-app/prod/database
        property: username
    - secretKey: password
      remoteRef:
        key: my-app/prod/database
        property: password
    - secretKey: host
      remoteRef:
        key: my-app/prod/database
        property: host
    - secretKey: database
      remoteRef:
        key: my-app/prod/database
        property: database
```

---

## GCP Secret Manager Integration

### SecretStore with Workload Identity

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: gcp-secret-manager
spec:
  provider:
    gcpsm:
      projectID: my-gcp-project
      auth:
        workloadIdentity:
          clusterLocation: us-central1
          clusterName: my-cluster
          clusterProjectID: my-gcp-project
          serviceAccountRef:
            name: external-secrets-sa
            namespace: external-secrets
```

### GCP IAM Binding

```bash
# Create GSA
gcloud iam service-accounts create external-secrets-sa \
  --project=my-gcp-project

# Grant access to secrets
gcloud projects add-iam-policy-binding my-gcp-project \
  --member="serviceAccount:external-secrets-sa@my-gcp-project.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Bind KSA to GSA
gcloud iam service-accounts add-iam-policy-binding external-secrets-sa@my-gcp-project.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="serviceAccount:my-gcp-project.svc.id.goog[external-secrets/external-secrets-sa]"
```

### ExternalSecret Example

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: api-keys
  namespace: my-app-prod
spec:
  refreshInterval: 30m
  secretStoreRef:
    name: gcp-secret-manager
    kind: ClusterSecretStore
  target:
    name: api-keys
    creationPolicy: Owner
  data:
    - secretKey: STRIPE_API_KEY
      remoteRef:
        key: stripe-api-key
        version: latest
    - secretKey: SENDGRID_API_KEY
      remoteRef:
        key: sendgrid-api-key
        version: latest
```

---

## Azure Key Vault Integration

### SecretStore with Azure AD Workload Identity

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: azure-key-vault
spec:
  provider:
    azurekv:
      tenantId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      vaultUrl: "https://my-vault.vault.azure.net"
      authType: WorkloadIdentity
      serviceAccountRef:
        name: external-secrets-sa
        namespace: external-secrets
```

---

## Pulumi Secrets Management

### Pulumi Passphrase Backend

```bash
# Set passphrase for local encryption
export PULUMI_CONFIG_PASSPHRASE="your-secure-passphrase"

# Or use file
export PULUMI_CONFIG_PASSPHRASE_FILE=/path/to/passphrase

# Initialize with passphrase
pulumi stack init dev --secrets-provider=passphrase
```

### Pulumi with AWS KMS

```bash
# Use AWS KMS for encryption
pulumi stack init prod --secrets-provider="awskms://alias/pulumi-secrets?region=us-east-1"
```

### Pulumi with GCP KMS

```bash
# Use GCP KMS for encryption
pulumi stack init prod --secrets-provider="gcpkms://projects/my-project/locations/global/keyRings/pulumi/cryptoKeys/secrets"
```

### Setting Secrets in Pulumi

```bash
# Set secret (encrypted in state)
pulumi config set --secret database-password "super-secret"

# Set secret from file
pulumi config set --secret tls-key --file ./key.pem
```

### Accessing Secrets in Go

```go
package main

import (
    "github.com/pulumi/pulumi/sdk/v3/go/pulumi"
    "github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

func main() {
    pulumi.Run(func(ctx *pulumi.Context) error {
        cfg := config.New(ctx, "")

        // Get secret (automatically decrypted)
        dbPassword := cfg.RequireSecret("database-password")

        // Use in resource (stays encrypted in state)
        _, err := k8s.NewSecret(ctx, "db-secret", &k8s.SecretArgs{
            StringData: pulumi.StringMap{
                "password": dbPassword,
            },
        })

        return err
    })
}
```

---

## Sealed Secrets (Alternative)

### Install Sealed Secrets Controller

```bash
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm install sealed-secrets sealed-secrets/sealed-secrets \
  --namespace kube-system
```

### Create Sealed Secret

```bash
# Fetch public key
kubeseal --fetch-cert \
  --controller-name=sealed-secrets \
  --controller-namespace=kube-system \
  > pub-sealed-secrets.pem

# Create sealed secret from literal
kubectl create secret generic my-secret \
  --from-literal=password=supersecret \
  --dry-run=client -o yaml | \
kubeseal --format yaml \
  --cert pub-sealed-secrets.pem \
  > my-sealed-secret.yaml

# Apply sealed secret (safe to commit to Git)
kubectl apply -f my-sealed-secret.yaml
```

---

## Best Practices

| Practice | Description |
|----------|-------------|
| Rotate regularly | Use short refresh intervals (1h or less) |
| Least privilege | Only grant access to required secrets |
| Audit logging | Enable audit logs on secret access |
| Version secrets | Use versioned secrets for rollback |
| No secrets in Git | Never commit plaintext secrets |
| Use OIDC/Workload Identity | Avoid long-lived credentials |
| Encrypt at rest | Use cloud KMS for Pulumi state |
| Namespace isolation | Use namespace-scoped SecretStores where possible |
