# ArgoCD + Argo Rollouts Configuration

Complete GitOps setup with ArgoCD and progressive delivery with Argo Rollouts.

---

## ArgoCD App-of-Apps Pattern

### Root Application

```yaml
# argocd/root-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root-app
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/gitops-repo.git
    targetRevision: HEAD
    path: argocd/apps
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

### Application Template

```yaml
# argocd/apps/my-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app-prod
  namespace: argocd
  annotations:
    argocd.argoproj.io/sync-wave: "2"
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: production
  source:
    repoURL: https://github.com/myorg/gitops-repo.git
    targetRevision: HEAD
    path: k8s/overlays/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: my-app-prod
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - ApplyOutOfSyncOnly=true
      - ServerSideApply=true
    retry:
      limit: 3
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 1m
  ignoreDifferences:
    - group: argoproj.io
      kind: Rollout
      jsonPointers:
        - /spec/replicas
```

---

## ApplicationSet for Multi-Environment

```yaml
# argocd/applicationset.yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: my-app-environments
  namespace: argocd
spec:
  goTemplate: true
  goTemplateOptions: ["missingkey=error"]
  generators:
    - list:
        elements:
          - env: dev
            cluster: https://kubernetes.default.svc
            namespace: my-app-dev
            syncWave: "1"
            autoSync: true
          - env: staging
            cluster: https://kubernetes.default.svc
            namespace: my-app-staging
            syncWave: "2"
            autoSync: true
          - env: prod
            cluster: https://prod-cluster.example.com
            namespace: my-app-prod
            syncWave: "3"
            autoSync: false  # Manual promotion for prod
  template:
    metadata:
      name: 'my-app-{{ .env }}'
      namespace: argocd
      annotations:
        argocd.argoproj.io/sync-wave: '{{ .syncWave }}'
    spec:
      project: default
      source:
        repoURL: https://github.com/myorg/gitops-repo.git
        targetRevision: HEAD
        path: 'k8s/overlays/{{ .env }}'
      destination:
        server: '{{ .cluster }}'
        namespace: '{{ .namespace }}'
      syncPolicy:
        automated:
          prune: '{{ .autoSync }}'
          selfHeal: '{{ .autoSync }}'
        syncOptions:
          - CreateNamespace=true
          - ServerSideApply=true
```

---

## Argo Rollouts Configuration

### Complete Rollout with Canary Strategy

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: my-app
  namespace: production
spec:
  replicas: 4
  revisionHistoryLimit: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
        version: canary
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 65532
        runAsGroup: 65532
        fsGroup: 65532
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: app
          image: gcr.io/my-project/my-app:latest
          imagePullPolicy: Always
          ports:
            - name: http
              containerPort: 8080
          env:
            - name: ENVIRONMENT
              value: production
          resources:
            requests:
              cpu: 200m
              memory: 256Mi
            limits:
              cpu: 1000m
              memory: 1Gi
          livenessProbe:
            httpGet:
              path: /health/live
              port: http
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
  strategy:
    canary:
      # Traffic Management
      canaryService: my-app-canary
      stableService: my-app-stable
      trafficRouting:
        nginx:
          stableIngress: my-app-ingress
          additionalIngressAnnotations:
            canary-by-header: X-Canary
            canary-by-header-value: "true"

      # Canary Steps
      steps:
        # Phase 1: 10% traffic
        - setWeight: 10
        - pause: { duration: 5m }

        # Phase 2: Analyze + 30% traffic
        - analysis:
            templates:
              - templateName: error-rate-check
              - templateName: latency-check
            args:
              - name: service-name
                value: my-app-canary
        - setWeight: 30
        - pause: { duration: 5m }

        # Phase 3: 70% traffic
        - analysis:
            templates:
              - templateName: error-rate-check
        - setWeight: 70
        - pause: { duration: 5m }

        # Phase 4: Full rollout
        - analysis:
            templates:
              - templateName: error-rate-check
              - templateName: latency-check
        - setWeight: 100

      # Anti-affinity for canary and stable pods
      antiAffinity:
        preferredDuringSchedulingIgnoredDuringExecution:
          weight: 100

      # Max surge/unavailable during rollout
      maxSurge: "25%"
      maxUnavailable: 0

      # Rollback settings
      abortScaleDownDelaySeconds: 30

      # Analysis during entire rollout
      analysis:
        templates:
          - templateName: continuous-verification
        startingStep: 2
        args:
          - name: service-name
            value: my-app-canary
```

---

## Analysis Templates

### Error Rate Analysis

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: error-rate-check
  namespace: production
spec:
  args:
    - name: service-name
  metrics:
    - name: error-rate
      interval: 1m
      count: 5
      successCondition: result[0] < 0.02
      failureCondition: result[0] >= 0.05
      failureLimit: 3
      inconclusiveLimit: 2
      provider:
        prometheus:
          address: http://prometheus.monitoring.svc:9090
          query: |
            sum(rate(http_requests_total{
              service="{{args.service-name}}",
              status=~"5.."
            }[5m]))
            /
            sum(rate(http_requests_total{
              service="{{args.service-name}}"
            }[5m]))
```

### Latency Analysis

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: latency-check
  namespace: production
spec:
  args:
    - name: service-name
  metrics:
    - name: p99-latency
      interval: 1m
      count: 5
      successCondition: result[0] < 800
      failureCondition: result[0] >= 1000
      failureLimit: 3
      provider:
        prometheus:
          address: http://prometheus.monitoring.svc:9090
          query: |
            histogram_quantile(0.99,
              sum(rate(http_request_duration_seconds_bucket{
                service="{{args.service-name}}"
              }[5m])) by (le)
            ) * 1000
    - name: p95-latency
      interval: 1m
      count: 5
      successCondition: result[0] < 500
      failureLimit: 3
      provider:
        prometheus:
          address: http://prometheus.monitoring.svc:9090
          query: |
            histogram_quantile(0.95,
              sum(rate(http_request_duration_seconds_bucket{
                service="{{args.service-name}}"
              }[5m])) by (le)
            ) * 1000
```

### Continuous Verification

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: continuous-verification
  namespace: production
spec:
  args:
    - name: service-name
  metrics:
    - name: pod-restarts
      interval: 2m
      successCondition: result[0] == 0
      failureLimit: 2
      provider:
        prometheus:
          address: http://prometheus.monitoring.svc:9090
          query: |
            sum(increase(kube_pod_container_status_restarts_total{
              namespace="production",
              pod=~"{{args.service-name}}.*"
            }[5m]))
    - name: memory-usage
      interval: 2m
      successCondition: result[0] < 0.9
      failureLimit: 3
      provider:
        prometheus:
          address: http://prometheus.monitoring.svc:9090
          query: |
            avg(container_memory_usage_bytes{
              namespace="production",
              pod=~"{{args.service-name}}.*"
            })
            /
            avg(container_spec_memory_limit_bytes{
              namespace="production",
              pod=~"{{args.service-name}}.*"
            })
```

---

## Blue-Green Strategy (Alternative)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: my-app-bluegreen
  namespace: production
spec:
  replicas: 4
  selector:
    matchLabels:
      app: my-app
  template:
    # ... same as canary
  strategy:
    blueGreen:
      activeService: my-app-active
      previewService: my-app-preview
      autoPromotionEnabled: false
      autoPromotionSeconds: 300
      scaleDownDelaySeconds: 30
      scaleDownDelayRevisionLimit: 2
      prePromotionAnalysis:
        templates:
          - templateName: smoke-tests
        args:
          - name: service-name
            value: my-app-preview
      postPromotionAnalysis:
        templates:
          - templateName: error-rate-check
        args:
          - name: service-name
            value: my-app-active
```

---

## ArgoCD CLI Commands

```bash
# Login
argocd login argocd.example.com --grpc-web

# Sync application
argocd app sync my-app-prod --prune --force

# Get rollout status
argocd app get my-app-prod

# Rollback to previous version
argocd app rollback my-app-prod 1

# Set image manually
argocd app set my-app-prod --kustomize-image my-app=gcr.io/project/my-app:v1.2.3

# Hard refresh (clear cache)
argocd app get my-app-prod --hard-refresh
```

## Argo Rollouts CLI Commands

```bash
# Get rollout status
kubectl argo rollouts get rollout my-app -n production --watch

# Promote canary manually
kubectl argo rollouts promote my-app -n production

# Abort rollout
kubectl argo rollouts abort my-app -n production

# Retry aborted rollout
kubectl argo rollouts retry rollout my-app -n production

# Set image
kubectl argo rollouts set image my-app my-app=gcr.io/project/my-app:v1.2.3 -n production

# Dashboard (web UI)
kubectl argo rollouts dashboard -n production
```
