# Dockerfile Templates

Optimized multi-stage Dockerfiles for Go, Node.js, Python, and Rust with December 2025 base images.

---

## Go (Axum-style API)

```dockerfile
# syntax=docker/dockerfile:1.7
# Go Backend - Multi-stage Build
# Final image: ~15MB with distroless

# =============================================================================
# Stage 1: Builder
# =============================================================================
FROM golang:1.24-alpine3.21 AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Create non-root user for final stage
RUN adduser -D -g '' -u 65532 appuser

WORKDIR /app

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Copy source and build
COPY . .

# Build with security flags
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s -extldflags '-static'" \
    -tags netgo \
    -o /app/server \
    ./cmd/server

# =============================================================================
# Stage 2: Runtime (Distroless)
# =============================================================================
FROM gcr.io/distroless/static-debian12:nonroot

# Copy timezone data and CA certificates
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy binary
COPY --from=builder /app/server /server

# Use non-root user (65532 is the distroless nonroot user)
USER 65532:65532

# Expose port
EXPOSE 8080

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["/server", "healthcheck"]

# Run
ENTRYPOINT ["/server"]
```

---

## Node.js (SvelteKit/Express)

```dockerfile
# syntax=docker/dockerfile:1.7
# Node.js Application - Multi-stage Build
# Final image: ~150MB with distroless nodejs

# =============================================================================
# Stage 1: Dependencies
# =============================================================================
FROM node:22-alpine3.21 AS deps

WORKDIR /app

# Install dependencies only
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile --prod=false

# =============================================================================
# Stage 2: Builder
# =============================================================================
FROM node:22-alpine3.21 AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm run build

# Prune dev dependencies
RUN pnpm prune --prod

# =============================================================================
# Stage 3: Runtime (Distroless)
# =============================================================================
FROM gcr.io/distroless/nodejs22-debian12:nonroot

WORKDIR /app

# Copy built application
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Use non-root user
USER 65532:65532

# Expose port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Run
CMD ["build/index.js"]
```

---

## Node.js (Static SvelteKit with NGINX)

```dockerfile
# syntax=docker/dockerfile:1.7
# SvelteKit Static Build with NGINX
# Final image: ~25MB

# =============================================================================
# Stage 1: Builder
# =============================================================================
FROM node:22-alpine3.21 AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm run build

# =============================================================================
# Stage 2: Runtime (NGINX)
# =============================================================================
FROM nginx:1.27-alpine3.21

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/build /usr/share/nginx/html

# Add non-root user
RUN adduser -D -g '' -u 65532 appuser && \
    chown -R appuser:appuser /var/cache/nginx && \
    chown -R appuser:appuser /var/log/nginx && \
    chown -R appuser:appuser /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appuser /var/run/nginx.pid

USER 65532:65532

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf for SvelteKit PWA

```nginx
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript application/wasm;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Service Worker - NEVER cache
    location = /service-worker.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        expires 0;
        try_files $uri =404;
    }

    # Manifest - short cache
    location = /manifest.json {
        add_header Cache-Control "public, max-age=3600";
        try_files $uri =404;
    }

    # Immutable assets (hashed filenames)
    location /_app/immutable/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    # Health check endpoint
    location = /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Python (FastAPI/Flask)

```dockerfile
# syntax=docker/dockerfile:1.7
# Python Application - Multi-stage Build
# Final image: ~120MB with distroless python

# =============================================================================
# Stage 1: Builder
# =============================================================================
FROM python:3.13-slim-bookworm AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# =============================================================================
# Stage 2: Runtime (Distroless)
# =============================================================================
FROM gcr.io/distroless/python3-debian12:nonroot

WORKDIR /app

# Copy virtual environment and application
COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app /app

# Set environment
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Use non-root user
USER 65532:65532

EXPOSE 8000

# Run with uvicorn (FastAPI)
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Rust (Axum Backend)

```dockerfile
# syntax=docker/dockerfile:1.7
# Rust Axum Backend - Multi-stage Build with cargo-chef
# Final image: ~20MB with distroless

# =============================================================================
# Stage 1: Chef (Dependency Caching)
# =============================================================================
FROM rust:1.83-slim-bookworm AS chef

RUN cargo install cargo-chef --locked
WORKDIR /app

# =============================================================================
# Stage 2: Planner
# =============================================================================
FROM chef AS planner

COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN cargo chef prepare --recipe-path recipe.json

# =============================================================================
# Stage 3: Builder
# =============================================================================
FROM chef AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Cache dependencies
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

# Copy source and build
COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN cargo build --release --locked

# Strip binary
RUN strip /app/target/release/server

# =============================================================================
# Stage 4: Runtime (Distroless)
# =============================================================================
FROM gcr.io/distroless/cc-debian12:nonroot

# Copy CA certificates for HTTPS
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy binary
COPY --from=builder /app/target/release/server /server

# Use non-root user
USER 65532:65532

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["/server", "--healthcheck"]

ENTRYPOINT ["/server"]
```

---

## Build Commands

```bash
# Build with BuildKit and provenance
DOCKER_BUILDKIT=1 docker build \
  --provenance=true \
  --sbom=true \
  -t my-app:v1.0.0 \
  -f Dockerfile .

# Multi-platform build
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --provenance=true \
  --sbom=true \
  -t gcr.io/my-project/my-app:v1.0.0 \
  --push .

# Scan for vulnerabilities
docker scout cves my-app:v1.0.0
trivy image my-app:v1.0.0
```

---

## Security Checklist

- [x] Multi-stage build (minimal final image)
- [x] Distroless or scratch base image
- [x] Non-root user (UID 65532)
- [x] No shell in final image
- [x] Static binary where possible
- [x] CA certificates included
- [x] Provenance attestation enabled
- [x] SBOM generation enabled
- [x] No secrets in image layers
- [x] Healthcheck defined
