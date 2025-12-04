# KIND Local Development Setup

Complete setup for local Kubernetes development with KIND and local registry.

---

## KIND Cluster with Local Registry

### Setup Script (kind-with-registry.sh)

```bash
#!/bin/bash
set -o errexit

# Configuration
CLUSTER_NAME="${KIND_CLUSTER_NAME:-dev-cluster}"
REGISTRY_NAME="kind-registry"
REGISTRY_PORT="${KIND_REGISTRY_PORT:-5001}"
K8S_VERSION="${K8S_VERSION:-v1.32.2}"

# Create registry container unless it already exists
if [ "$(docker inspect -f '{{.State.Running}}' "${REGISTRY_NAME}" 2>/dev/null || true)" != 'true' ]; then
  docker run \
    -d --restart=always -p "127.0.0.1:${REGISTRY_PORT}:5000" \
    --network bridge --name "${REGISTRY_NAME}" \
    registry:2
fi

# Create KIND cluster with containerd registry config
cat <<EOF | kind create cluster --name "${CLUSTER_NAME}" --image kindest/node:${K8S_VERSION} --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
- role: worker
- role: worker
containerdConfigPatches:
- |-
  [plugins."io.containerd.grpc.v1.cri".registry]
    config_path = "/etc/containerd/certs.d"
EOF

# Connect the registry to the cluster network if not already connected
if [ "$(docker inspect -f='{{json .NetworkSettings.Networks.kind}}' "${REGISTRY_NAME}")" = 'null' ]; then
  docker network connect "kind" "${REGISTRY_NAME}"
fi

# Create registry config for containerd
REGISTRY_DIR="/etc/containerd/certs.d/localhost:${REGISTRY_PORT}"
for node in $(kind get nodes --name "${CLUSTER_NAME}"); do
  docker exec "${node}" mkdir -p "${REGISTRY_DIR}"
  cat <<EOF | docker exec -i "${node}" cp /dev/stdin "${REGISTRY_DIR}/hosts.toml"
[host."http://${REGISTRY_NAME}:5000"]
EOF
done

# Document the local registry
# https://github.com/kubernetes/enhancements/tree/master/keps/sig-cluster-lifecycle/generic/1755-communicating-a-local-registry
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: local-registry-hosting
  namespace: kube-public
data:
  localRegistryHosting.v1: |
    host: "localhost:${REGISTRY_PORT}"
    help: "https://kind.sigs.k8s.io/docs/user/local-registry/"
EOF

echo "KIND cluster '${CLUSTER_NAME}' created with local registry at localhost:${REGISTRY_PORT}"
```

---

## KIND Cluster Configuration (kind-config.yaml)

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: dev-cluster
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  # HTTP
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  # HTTPS
  - containerPort: 443
    hostPort: 443
    protocol: TCP
  # NodePort range for services
  - containerPort: 30000
    hostPort: 30000
  - containerPort: 30001
    hostPort: 30001
- role: worker
  kubeadmConfigPatches:
  - |
    kind: JoinConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "workload=apps"
- role: worker
  kubeadmConfigPatches:
  - |
    kind: JoinConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "workload=apps"
containerdConfigPatches:
- |-
  [plugins."io.containerd.grpc.v1.cri".registry]
    config_path = "/etc/containerd/certs.d"
networking:
  # Use Calico for network policies (optional)
  disableDefaultCNI: false
  podSubnet: "10.244.0.0/16"
  serviceSubnet: "10.96.0.0/12"
```

---

## Install NGINX Ingress Controller

```bash
# Install NGINX Ingress for KIND
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for ingress to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s
```

---

## Install ArgoCD (Local)

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=available --timeout=600s deployment/argocd-server -n argocd

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Port-forward ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

---

## Install Argo Rollouts

```bash
# Create namespace
kubectl create namespace argo-rollouts

# Install Argo Rollouts
kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml

# Install kubectl plugin
brew install argoproj/tap/kubectl-argo-rollouts
# Or: curl -LO https://github.com/argoproj/argo-rollouts/releases/latest/download/kubectl-argo-rollouts-linux-amd64
```

---

## Build and Push to Local Registry

```bash
# Build image
docker build -t localhost:5001/my-app:v1.0.0 .

# Push to local registry
docker push localhost:5001/my-app:v1.0.0

# Alternative: Load directly into KIND (no registry)
kind load docker-image my-app:v1.0.0 --name dev-cluster
```

---

## Verify Setup

```bash
# Check cluster nodes
kubectl get nodes

# Check registry connectivity
curl -s http://localhost:5001/v2/_catalog

# Check ArgoCD
kubectl get pods -n argocd

# Check Argo Rollouts
kubectl get pods -n argo-rollouts
```

---

## Cleanup

```bash
# Delete cluster
kind delete cluster --name dev-cluster

# Remove registry
docker rm -f kind-registry
```

---

## Troubleshooting

### Registry Connection Issues
```bash
# Verify registry is running
docker ps | grep kind-registry

# Check containerd config on nodes
docker exec dev-cluster-control-plane cat /etc/containerd/certs.d/localhost:5001/hosts.toml
```

### Image Pull Errors
```bash
# Ensure image exists in registry
curl http://localhost:5001/v2/my-app/tags/list

# Check pod events
kubectl describe pod <pod-name>
```

### KIND Node NotReady
```bash
# Increase Docker resources (8GB+ RAM recommended)
# Restart Docker daemon
# Delete and recreate cluster
kind delete cluster --name dev-cluster
```
