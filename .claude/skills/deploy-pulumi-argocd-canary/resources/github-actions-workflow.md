# GitHub Actions CI/CD Workflow

Complete CI/CD pipeline for building, testing, and deploying to Kubernetes via ArgoCD.

---

## Directory Structure

```
.github/
├── workflows/
│   ├── ci.yaml           # Build and test on PR
│   ├── cd.yaml           # Deploy to environments
│   └── release.yaml      # Semantic release
└── actions/
    └── setup-tools/
        └── action.yaml   # Reusable setup action
```

---

## CI Workflow (ci.yaml)

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ==========================================================================
  # Lint and Test
  # ==========================================================================
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.24'
          cache: true

      - name: Lint
        uses: golangci/golangci-lint-action@v6
        with:
          version: latest
          args: --timeout=5m

      - name: Test
        run: |
          go test -v -race -coverprofile=coverage.out ./...
          go tool cover -func=coverage.out

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage.out
          fail_ci_if_error: true

  # ==========================================================================
  # Security Scan
  # ==========================================================================
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'

      - name: Run gosec
        uses: securego/gosec@master
        with:
          args: ./...

  # ==========================================================================
  # Build Docker Image
  # ==========================================================================
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test, security]
    permissions:
      contents: read
      packages: write
      id-token: write  # For OIDC
      attestations: write
    outputs:
      image: ${{ steps.meta.outputs.tags }}
      digest: ${{ steps.build.outputs.digest }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}

      - name: Build and push
        id: build
        uses: docker/build-push-action@v6
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: true
          sbom: true

      - name: Generate artifact attestation
        if: github.event_name != 'pull_request'
        uses: actions/attest-build-provenance@v1
        with:
          subject-name: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          subject-digest: ${{ steps.build.outputs.digest }}
          push-to-registry: true

      - name: Scan built image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          severity: 'CRITICAL,HIGH'
          exit-code: '1'
```

---

## CD Workflow (cd.yaml)

```yaml
name: CD

on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production
      image_tag:
        description: 'Image tag to deploy'
        required: true
        type: string

env:
  GITOPS_REPO: myorg/gitops-repo
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ==========================================================================
  # Deploy to Staging (Auto)
  # ==========================================================================
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    if: |
      (github.event_name == 'workflow_run' && github.event.workflow_run.conclusion == 'success') ||
      (github.event_name == 'workflow_dispatch' && github.event.inputs.environment == 'staging')
    environment:
      name: staging
      url: https://staging.myapp.example.com

    steps:
      - name: Checkout GitOps repo
        uses: actions/checkout@v4
        with:
          repository: ${{ env.GITOPS_REPO }}
          token: ${{ secrets.GITOPS_TOKEN }}
          path: gitops

      - name: Setup Kustomize
        uses: imranismail/setup-kustomize@v2

      - name: Determine image tag
        id: tag
        run: |
          if [ "${{ github.event_name }}" == "workflow_dispatch" ]; then
            echo "tag=${{ github.event.inputs.image_tag }}" >> $GITHUB_OUTPUT
          else
            echo "tag=${{ github.sha }}" >> $GITHUB_OUTPUT
          fi

      - name: Update staging manifest
        run: |
          cd gitops/k8s/overlays/staging
          kustomize edit set image \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.tag.outputs.tag }}

      - name: Commit and push
        run: |
          cd gitops
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add .
          git commit -m "deploy(staging): ${{ env.IMAGE_NAME }}:${{ steps.tag.outputs.tag }}"
          git push

      - name: Wait for ArgoCD sync
        run: |
          # Install ArgoCD CLI
          curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
          chmod +x /usr/local/bin/argocd

          # Login and sync
          argocd login ${{ secrets.ARGOCD_SERVER }} \
            --username admin \
            --password ${{ secrets.ARGOCD_PASSWORD }} \
            --grpc-web

          argocd app sync my-app-staging --prune
          argocd app wait my-app-staging --health --timeout 300

  # ==========================================================================
  # Deploy to Production (Manual Approval)
  # ==========================================================================
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [deploy-staging]
    if: |
      github.event_name == 'workflow_dispatch' && github.event.inputs.environment == 'production'
    environment:
      name: production
      url: https://myapp.example.com

    steps:
      - name: Checkout GitOps repo
        uses: actions/checkout@v4
        with:
          repository: ${{ env.GITOPS_REPO }}
          token: ${{ secrets.GITOPS_TOKEN }}
          path: gitops

      - name: Setup Kustomize
        uses: imranismail/setup-kustomize@v2

      - name: Update production manifest
        run: |
          cd gitops/k8s/overlays/prod
          kustomize edit set image \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.event.inputs.image_tag }}

      - name: Commit and push
        run: |
          cd gitops
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add .
          git commit -m "deploy(production): ${{ env.IMAGE_NAME }}:${{ github.event.inputs.image_tag }}"
          git push

      - name: Trigger ArgoCD sync (manual review in ArgoCD)
        run: |
          curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
          chmod +x /usr/local/bin/argocd

          argocd login ${{ secrets.ARGOCD_SERVER }} \
            --username admin \
            --password ${{ secrets.ARGOCD_PASSWORD }} \
            --grpc-web

          # Just refresh, don't auto-sync prod (Argo Rollouts handles canary)
          argocd app get my-app-prod --hard-refresh

          echo "Production deployment triggered. Monitor canary rollout in ArgoCD/Argo Rollouts dashboard."
```

---

## Release Workflow (release.yaml)

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write
  issues: write
  pull-requests: write
  id-token: write

jobs:
  release:
    name: Semantic Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm install -g semantic-release @semantic-release/git @semantic-release/changelog

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx semantic-release
```

### .releaserc.json

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    [
      "@semantic-release/git",
      {
        "assets": ["CHANGELOG.md"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ],
    "@semantic-release/github"
  ]
}
```

---

## Reusable Setup Action

```yaml
# .github/actions/setup-tools/action.yaml
name: Setup Tools
description: Setup common deployment tools

inputs:
  install-pulumi:
    description: Install Pulumi CLI
    default: 'false'
  install-argocd:
    description: Install ArgoCD CLI
    default: 'false'
  install-kubectl:
    description: Install kubectl
    default: 'true'

runs:
  using: composite
  steps:
    - name: Install kubectl
      if: inputs.install-kubectl == 'true'
      shell: bash
      run: |
        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
        chmod +x kubectl
        sudo mv kubectl /usr/local/bin/

    - name: Install Pulumi
      if: inputs.install-pulumi == 'true'
      shell: bash
      run: curl -fsSL https://get.pulumi.com | sh

    - name: Install ArgoCD CLI
      if: inputs.install-argocd == 'true'
      shell: bash
      run: |
        curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
        chmod +x /usr/local/bin/argocd

    - name: Install Kustomize
      shell: bash
      run: |
        curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash
        sudo mv kustomize /usr/local/bin/
```

---

## Required Secrets

| Secret | Description |
|--------|-------------|
| `GITHUB_TOKEN` | Auto-provided, for GHCR push |
| `GITOPS_TOKEN` | PAT for GitOps repo write access |
| `ARGOCD_SERVER` | ArgoCD server URL |
| `ARGOCD_PASSWORD` | ArgoCD admin password |
| `CODECOV_TOKEN` | Codecov upload token |

---

## Branch Protection Rules

```yaml
# Required for main branch
- Require pull request reviews: 1
- Require status checks:
  - test
  - security
  - build
- Require branches to be up to date
- Require signed commits (optional)
- Restrict force pushes
```
