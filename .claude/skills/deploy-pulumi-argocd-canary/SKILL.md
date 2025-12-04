---
name: deploy-pulumi-argocd-canary
description: Production-ready Kubernetes deployment skill using Pulumi (Go), ArgoCD, Kustomize, and Argo Rollouts for zero-downtime canary releases. Covers local development with KIND, cloud deployment to EKS/GKE/AKS, progressive delivery with automated rollback, and GitOps workflows. Supports Go, Node.js, Python, and Rust applications with optimized Dockerfiles.
---

# Cloud-Native Deployment with Pulumi + ArgoCD + Canary Releases

## Purpose

Enable fully automated, production-grade Kubernetes deployments with:
- **Local Development**: KIND cluster with local registry
- **Infrastructure as Code**: Pulumi written in Go (not TypeScript)
- **GitOps**: ArgoCD v2.13+ with ApplicationSet
- **Progressive Delivery**: Argo Rollouts with canary strategy + automated rollback
- **Multi-Cloud**: EKS, GKE, AKS support via Pulumi

## When to Use This Skill

Automatically activates when:
- Setting up Kubernetes deployment pipelines
- Configuring Pulumi for infrastructure provisioning
- Implementing ArgoCD GitOps workflows
- Creating canary or blue-green deployments
- Writing Dockerfiles for Go/Node/Python/Rust
- Setting up local Kubernetes with KIND
- Configuring Kustomize overlays

---

## Quick Start Checklist

### Local Development Setup
- [ ] KIND cluster with local registry (localhost:5001)
- [ ] Pulumi local stack targeting KIND
- [ ] ArgoCD installed via Helm (app-of-apps pattern)
- [ ] Kustomize base + dev overlay

### Production Deployment
- [ ] Pulumi Go program for EKS/GKE/AKS
- [ ] Kustomize overlays (dev/staging/prod)
- [ ] ArgoCD Application + ApplicationSet
- [ ] Argo Rollouts with AnalysisTemplate
- [ ] GitHub Actions CI/CD pipeline

---

## December 2025 Base Images

| Language | Builder Image | Runtime Image |
|----------|---------------|---------------|
| Go | `golang:1.24-alpine3.21` | `gcr.io/distroless/static-debian12` |
| Node.js | `node:22-alpine3.21` | `gcr.io/distroless/nodejs22-debian12` |
| Python | `python:3.13-slim-bookworm` | `gcr.io/distroless/python3-debian12` |
| Rust | `rust:1.83-slim-bookworm` | `gcr.io/distroless/cc-debian12` |

**Security Requirements**:
- Multi-stage builds with distroless/scratch final stage
- Non-root USER directive (UID 65532 for distroless)
- `--provenance=true --sbom=true` for attestation

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Developer Workflow                        │
├─────────────────────────────────────────────────────────────────┤
│  Local Dev (KIND)          │  Cloud Prod (EKS/GKE/AKS)          │
│  ─────────────────         │  ──────────────────────            │
│  localhost:5001 registry   │  ECR/GCR/ACR registry              │
│  Pulumi local stack        │  Pulumi cloud stack                │
│  ArgoCD (Helm install)     │  ArgoCD (GitOps managed)           │
│  Kustomize dev overlay     │  Kustomize prod overlay            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Canary Deployment Flow                        │
├─────────────────────────────────────────────────────────────────┤
│  1. Git Push → GitHub Actions builds image                       │
│  2. Image pushed to registry with SHA tag                        │
│  3. GitOps repo updated with new image tag                       │
│  4. ArgoCD detects drift, triggers sync                          │
│  5. Argo Rollouts executes canary strategy:                      │
│     10% → (5m) → 30% → (5m) → 70% → (5m) → 100%                 │
│  6. AnalysisTemplate queries Prometheus:                         │
│     - Error rate < 2%                                            │
│     - P99 latency < 800ms                                        │
│  7. Auto-rollback if analysis fails                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tool Versions (December 2025)

| Tool | Version | Installation |
|------|---------|--------------|
| Go | 1.24+ | `go install golang.org/dl/go1.24@latest` |
| Pulumi CLI | 3.150+ | `curl -fsSL https://get.pulumi.com \| sh` |
| KIND | 0.27+ | `go install sigs.k8s.io/kind@v0.27.0` |
| kubectl | 1.32+ | Official Kubernetes release |
| Helm | 3.16+ | `brew install helm` |
| ArgoCD CLI | 2.14+ | GitHub releases |
| Kustomize | 5.5+ | Built into kubectl |

---

## Canary Strategy Configuration

```yaml
# Default canary progression
steps:
  - setWeight: 10
  - pause: { duration: 5m }
  - setWeight: 30
  - pause: { duration: 5m }
  - setWeight: 70
  - pause: { duration: 5m }
  - setWeight: 100

# Automatic rollback conditions
analysis:
  successCondition: |
    result[0] < 0.02  # Error rate < 2%
  successCondition: |
    result[0] < 800   # P99 latency < 800ms
  failureLimit: 3
```

**Rollback Triggers**:
- Error rate > 2% (3 consecutive failures)
- P99 latency > 800ms (3 consecutive failures)
- Pod crash loops detected
- Custom Prometheus queries via AnalysisTemplate

---

## Resource Files (Progressive Disclosure)

| Need to... | Read this |
|------------|-----------|
| Set up KIND with local registry | [kind-local-setup.md](resources/kind-local-setup.md) |
| Write Pulumi Go programs | [pulumi-go-templates.md](resources/pulumi-go-templates.md) |
| Configure Kustomize overlays | [kustomize-overlays.md](resources/kustomize-overlays.md) |
| Deploy ArgoCD + Rollouts | [argocd-rollouts.md](resources/argocd-rollouts.md) |
| Create optimized Dockerfiles | [dockerfile-templates.md](resources/dockerfile-templates.md) |
| Set up GitHub Actions | [github-actions-workflow.md](resources/github-actions-workflow.md) |
| Configure secrets management | [secrets-management.md](resources/secrets-management.md) |
| Multi-cloud deployment (EKS/GKE/AKS) | [multi-cloud-pulumi.md](resources/multi-cloud-pulumi.md) |

---

## Quick Commands

### Local Development
```bash
# Create KIND cluster with local registry
./scripts/kind-with-registry.sh

# Deploy to local cluster
pulumi up --stack dev --cwd infra/

# Port-forward ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

### Production Deployment
```bash
# Preview infrastructure changes
pulumi preview --stack prod --cwd infra/

# Deploy infrastructure
pulumi up --stack prod --cwd infra/ --yes

# Sync ArgoCD application
argocd app sync my-app --prune --force

# Check rollout status
kubectl argo rollouts get rollout my-app -n production --watch
```

---

## Anti-Patterns to Avoid

| Bad Practice | Good Practice |
|--------------|---------------|
| Using `latest` tag | Use SHA-based immutable tags |
| Helm for app manifests | Kustomize for apps, Helm for 3rd-party |
| Pulumi TypeScript | Pulumi Go for this stack |
| Manual `kubectl apply` | GitOps via ArgoCD |
| Rolling updates | Canary with AnalysisTemplate |
| Secrets in Git | External Secrets Operator |
| Root containers | Non-root with distroless |
| Fat base images | Multi-stage with scratch/distroless |

---

## Example Inputs

### 1. Deploy Rust Axum API
```
"Deploy my Rust Axum backend to GKE with canary releases.
The app exposes /health and /metrics endpoints."
```

### 2. Setup Local Dev Environment
```
"Set up KIND with local registry for testing my Node.js
microservice before pushing to production EKS."
```

### 3. Add Canary to Existing Deployment
```
"Convert my existing Kubernetes Deployment to use Argo Rollouts
with 10-30-70-100% canary and Prometheus analysis."
```

---

## Integration with Other Skills

- **rust-skills** - Rust backend patterns, Axum framework
- **sveltekit-pwa-skills** - Frontend PWA deployment
- **production-hardening-backend** - Security hardening
- **kaizen-solaris-review** - Code review for Rust components
- **git-workflow-mastery** - CI/CD branching strategies

---

## References

- [Pulumi Kubernetes Registry](https://www.pulumi.com/registry/packages/kubernetes/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Argo Rollouts](https://argoproj.github.io/rollouts/)
- [KIND Local Registry](https://kind.sigs.k8s.io/docs/user/local-registry/)
- [Distroless Images](https://github.com/GoogleContainerTools/distroless)
- [Kustomize](https://kustomize.io/)

---

**Skill Status**: PRODUCTION-READY
**Line Count**: <500
**Progressive Disclosure**: 8 resource files
**Multi-Language**: Go, Node.js, Python, Rust
**Multi-Cloud**: EKS, GKE, AKS
