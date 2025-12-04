# Kustomize Overlays

Complete Kustomize configuration for dev/staging/prod environments.

---

## Directory Structure

```
k8s/
├── base/
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   └── pdb.yaml
└── overlays/
    ├── dev/
    │   ├── kustomization.yaml
    │   ├── namespace-patch.yaml
    │   └── deployment-patch.yaml
    ├── staging/
    │   ├── kustomization.yaml
    │   ├── namespace-patch.yaml
    │   └── deployment-patch.yaml
    └── prod/
        ├── kustomization.yaml
        ├── namespace-patch.yaml
        ├── deployment-patch.yaml
        └── rollout.yaml
```

---

## Base Manifests

### base/kustomization.yaml

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

metadata:
  name: app-base

resources:
  - namespace.yaml
  - deployment.yaml
  - service.yaml
  - ingress.yaml
  - hpa.yaml
  - pdb.yaml

commonLabels:
  app.kubernetes.io/name: my-app
  app.kubernetes.io/managed-by: kustomize

configMapGenerator:
  - name: app-config
    literals:
      - LOG_LEVEL=info
      - METRICS_ENABLED=true
```

### base/namespace.yaml

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: my-app
  labels:
    istio-injection: disabled
```

### base/deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: my-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
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
          image: my-app:latest
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
            - name: metrics
              containerPort: 9090
              protocol: TCP
          env:
            - name: PORT
              value: "8080"
            - name: ENVIRONMENT
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
          envFrom:
            - configMapRef:
                name: app-config
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health/live
              port: http
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: my-app
```

### base/service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
  namespace: my-app
  labels:
    app: my-app
spec:
  type: ClusterIP
  ports:
    - name: http
      port: 80
      targetPort: http
      protocol: TCP
    - name: metrics
      port: 9090
      targetPort: metrics
      protocol: TCP
  selector:
    app: my-app
```

### base/ingress.yaml

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
  namespace: my-app
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  ingressClassName: nginx
  rules:
    - host: my-app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app
                port:
                  number: 80
```

### base/hpa.yaml

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app
  namespace: my-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
```

### base/pdb.yaml

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app
  namespace: my-app
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: my-app
```

---

## Dev Overlay

### overlays/dev/kustomization.yaml

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: my-app-dev

resources:
  - ../../base

namePrefix: dev-

commonLabels:
  environment: dev

patches:
  - path: namespace-patch.yaml
  - path: deployment-patch.yaml

images:
  - name: my-app
    newName: localhost:5001/my-app
    newTag: latest

configMapGenerator:
  - name: app-config
    behavior: merge
    literals:
      - LOG_LEVEL=debug
      - ENVIRONMENT=dev

replicas:
  - name: my-app
    count: 1
```

### overlays/dev/deployment-patch.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      containers:
        - name: app
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 200m
              memory: 256Mi
          env:
            - name: DEBUG
              value: "true"
```

---

## Staging Overlay

### overlays/staging/kustomization.yaml

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: my-app-staging

resources:
  - ../../base

namePrefix: staging-

commonLabels:
  environment: staging

patches:
  - path: namespace-patch.yaml
  - path: deployment-patch.yaml
  - path: ingress-patch.yaml

images:
  - name: my-app
    newName: gcr.io/my-project/my-app
    # Tag set by CI/CD

configMapGenerator:
  - name: app-config
    behavior: merge
    literals:
      - LOG_LEVEL=info
      - ENVIRONMENT=staging

replicas:
  - name: my-app
    count: 2
```

### overlays/staging/ingress-patch.yaml

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-staging
spec:
  tls:
    - hosts:
        - staging.my-app.example.com
      secretName: my-app-staging-tls
  rules:
    - host: staging.my-app.example.com
```

---

## Production Overlay

### overlays/prod/kustomization.yaml

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: my-app-prod

resources:
  - ../../base
  - rollout.yaml
  - analysis-template.yaml
  - canary-service.yaml

namePrefix: prod-

commonLabels:
  environment: prod

patches:
  - path: namespace-patch.yaml
  - path: deployment-to-rollout-patch.yaml
  - path: ingress-patch.yaml
  - path: hpa-patch.yaml

images:
  - name: my-app
    newName: gcr.io/my-project/my-app
    # Tag set by CI/CD

configMapGenerator:
  - name: app-config
    behavior: merge
    literals:
      - LOG_LEVEL=warn
      - ENVIRONMENT=prod
      - METRICS_ENABLED=true
```

### overlays/prod/rollout.yaml

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: my-app
  namespace: my-app-prod
spec:
  replicas: 4
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      # Same as Deployment spec.template.spec
      securityContext:
        runAsNonRoot: true
        runAsUser: 65532
      containers:
        - name: app
          image: my-app:latest
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: 200m
              memory: 256Mi
            limits:
              cpu: 1000m
              memory: 1Gi
  strategy:
    canary:
      canaryService: my-app-canary
      stableService: my-app-stable
      trafficRouting:
        nginx:
          stableIngress: my-app
      steps:
        - setWeight: 10
        - pause: { duration: 5m }
        - analysis:
            templates:
              - templateName: success-rate
        - setWeight: 30
        - pause: { duration: 5m }
        - analysis:
            templates:
              - templateName: success-rate
        - setWeight: 70
        - pause: { duration: 5m }
        - analysis:
            templates:
              - templateName: success-rate
        - setWeight: 100
      analysis:
        templates:
          - templateName: success-rate
        startingStep: 2
        args:
          - name: service-name
            value: my-app-canary
```

### overlays/prod/analysis-template.yaml

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
  namespace: my-app-prod
spec:
  args:
    - name: service-name
  metrics:
    - name: error-rate
      interval: 1m
      successCondition: result[0] < 0.02
      failureLimit: 3
      provider:
        prometheus:
          address: http://prometheus.monitoring:9090
          query: |
            sum(rate(http_requests_total{service="{{args.service-name}}",status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total{service="{{args.service-name}}"}[5m]))
    - name: latency-p99
      interval: 1m
      successCondition: result[0] < 800
      failureLimit: 3
      provider:
        prometheus:
          address: http://prometheus.monitoring:9090
          query: |
            histogram_quantile(0.99,
              sum(rate(http_request_duration_seconds_bucket{service="{{args.service-name}}"}[5m]))
              by (le)
            ) * 1000
```

### overlays/prod/canary-service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-canary
  namespace: my-app-prod
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 8080
  selector:
    app: my-app
---
apiVersion: v1
kind: Service
metadata:
  name: my-app-stable
  namespace: my-app-prod
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 8080
  selector:
    app: my-app
```

---

## Usage Commands

```bash
# Build and preview dev overlay
kustomize build k8s/overlays/dev

# Apply to cluster
kubectl apply -k k8s/overlays/dev

# Build prod with specific image tag
cd k8s/overlays/prod
kustomize edit set image my-app=gcr.io/my-project/my-app:v1.2.3
kustomize build . | kubectl apply -f -

# Diff before applying
kubectl diff -k k8s/overlays/staging
```
