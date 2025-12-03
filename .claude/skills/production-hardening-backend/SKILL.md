---
name: production-hardening-backend
description: Enterprise-grade production hardening for Rust backend services. Use when hardening Rust backends with NIST SP 800-53 controls, implementing defense-in-depth security, fault tolerance patterns (circuit breakers, retries), structured logging/metrics, secure Docker images, or deploying production-ready Rust services. Covers cargo audit, cargo deny, secret management, RBAC, TLS configuration, OWASP Top 10, resilience patterns, OpenTelemetry, Prometheus, container hardening, and Kubernetes/Docker security for production deployments.
---

# Production Hardening - Rust Backend Systems

**Production-grade hardening for Rust backend services with kernel-level reliability**

This skill guideline provides comprehensive production hardening practices for Rust backend systems, emphasizing security, reliability, fault tolerance, and operational excellence. Drawing from SunOS kernel quality standards, NIST SP 800-53 controls, CIS Benchmarks, and OWASP guidelines, these patterns ensure your Rust services are production-ready.

---

## Core Hardening Principles

### 1. **Defense in Depth** 🛡️
Multiple layers of security controls across application, infrastructure, and runtime

### 2. **Least Privilege** 🔒
Minimal permissions at every level (OS, application, network, data)

### 3. **Fail Secure** 🚨
Systems fail to a safe state with proper error handling

### 4. **Zero Trust** 🔐
Verify every request, encrypt everything, assume breach

### 5. **Observability First** 📊
Comprehensive monitoring, logging, and tracing for production visibility

### 6. **Immutable Infrastructure** 🏗️
Reproducible builds, versioned deployments, rollback capability

### 7. **Fault Isolation** 🧩
Circuit breakers, bulkheads, graceful degradation

### 8. **Security by Design** 🎯
Security requirements from day one, not bolted on

### 9. **Continuous Validation** ✅
Automated security scanning, testing, and compliance checks

### 10. **Minimal Attack Surface** 🎚️
Remove unnecessary code, dependencies, and services

---

## Quick Reference: Production Hardening Checklist

### Pre-Deployment Hardening

- [ ] **Security Scan**: Run `cargo audit` and fix all vulnerabilities
- [ ] **Dependency Review**: Audit all crates for security and maintenance
- [ ] **Secret Management**: Use environment variables or secret stores (never hardcode)
- [ ] **Error Handling**: No `.unwrap()` or `.expect()` in production paths
- [ ] **Input Validation**: Validate and sanitize all external input
- [ ] **Rate Limiting**: Implement per-endpoint rate limits
- [ ] **TLS Configuration**: Enforce TLS 1.3, disable weak ciphers
- [ ] **Authentication**: Implement robust auth (JWT, OAuth2, mTLS)
- [ ] **Authorization**: Fine-grained RBAC or ABAC
- [ ] **Logging**: Structured logging with correlation IDs

### Runtime Hardening

- [ ] **Health Checks**: Liveness and readiness probes
- [ ] **Graceful Shutdown**: Handle SIGTERM correctly
- [ ] **Resource Limits**: Set memory and CPU limits
- [ ] **Connection Pooling**: Configure max connections and timeouts
- [ ] **Circuit Breakers**: Protect against cascading failures
- [ ] **Backpressure**: Handle load spikes gracefully
- [ ] **Metrics Collection**: Export Prometheus metrics
- [ ] **Distributed Tracing**: Enable OpenTelemetry
- [ ] **Audit Logging**: Log security-relevant events
- [ ] **Panic Handling**: Catch panics and log before exit

### Infrastructure Hardening

- [ ] **Container Security**: Non-root user, minimal base image
- [ ] **Network Policies**: Restrict pod-to-pod traffic
- [ ] **RBAC**: Kubernetes service account with minimal permissions
- [ ] **Secrets Management**: Use Kubernetes Secrets or Vault
- [ ] **Image Scanning**: Scan containers for CVEs
- [ ] **Immutable Deployments**: Never modify running containers
- [ ] **Backup Strategy**: Automated backups with encryption
- [ ] **Disaster Recovery**: Tested recovery procedures

---

## Resource Files

This skill is organized into focused resource files:

### 1. [Core Hardening Principles](resources/core-principles.md)
- Least privilege and access control
- Defense in depth strategies
- Fail-secure patterns
- Zero trust architecture
- Attack surface reduction

### 2. [Security Hardening](resources/security-hardening.md)
- Dependency management and auditing
- Secret management (environment, Vault, K8s)
- Input validation and sanitization
- Authentication and authorization
- TLS/mTLS configuration
- SQL injection and XSS prevention
- OWASP Top 10 mitigations

### 3. [Fault Tolerance and Resilience](resources/fault-tolerance.md)
- Circuit breakers (failsafe, tower)
- Retry strategies with exponential backoff
- Bulkhead pattern for isolation
- Graceful degradation
- Timeout configuration
- Deadlock prevention
- Panic recovery

### 4. [Monitoring and Observability](resources/monitoring.md)
- Structured logging (tracing, slog)
- Metrics with Prometheus
- Distributed tracing (OpenTelemetry)
- Health checks and readiness probes
- Audit logging for compliance
- Alerting strategies
- Performance profiling

### 5. [Deployment and Operations](resources/deployment.md)
- Secure Docker images (distroless, non-root)
- CI/CD pipeline security
- Environment configuration management
- Database migration strategies
- Blue-green and canary deployments
- Rollback procedures
- Incident response

### 6. [Performance and Scalability](resources/performance.md)
- Connection pooling (database, HTTP)
- Caching strategies (Redis, in-memory)
- Resource limits and backpressure
- Async optimization with Tokio
- Load testing and capacity planning
- Database query optimization

---

## NIST SP 800-53 Control Mapping

Production hardening aligns with NIST high-impact baseline controls:

| Control Family | Key Controls | Implementation |
|----------------|--------------|----------------|
| **AC** (Access Control) | AC-2, AC-3, AC-6 | RBAC, least privilege, MFA |
| **AU** (Audit/Accountability) | AU-2, AU-3, AU-6 | Structured logging, audit trails |
| **CM** (Configuration Mgmt) | CM-2, CM-7 | Immutable infra, least functionality |
| **IA** (Identification/Auth) | IA-2, IA-5 | Strong auth, credential management |
| **SC** (System/Comm Protection) | SC-8, SC-13, SC-28 | TLS, encryption at rest/transit |
| **SI** (System Integrity) | SI-2, SI-3, SI-4 | Patching, malware protection, monitoring |
| **RA** (Risk Assessment) | RA-5 | Vulnerability scanning, pen testing |

---

## Rust-Specific Hardening Advantages

### Compile-Time Guarantees ✅
- **Memory safety**: No buffer overflows, use-after-free
- **Thread safety**: Data races caught at compile time
- **Type safety**: SQL injection harder with compile-time queries (SQLx)

### Runtime Safety ✅
- **No null pointer dereferences**: `Option<T>` is explicit
- **Explicit error handling**: `Result<T, E>` forces handling
- **Ownership system**: Resource cleanup is automatic (RAII)

### Performance ✅
- **Zero-cost abstractions**: Security doesn't slow you down
- **Efficient async**: Tokio runtime for high-performance I/O
- **Minimal resource usage**: Low memory footprint

---

## Common Production Anti-Patterns

### ❌ DON'T: Use `.unwrap()` in Production

```rust
// ❌ BAD: Crashes on error
let config = std::env::var("DATABASE_URL").unwrap();

// ✅ GOOD: Graceful error handling
let config = std::env::var("DATABASE_URL")
    .map_err(|_| Error::MissingConfig("DATABASE_URL"))?;
```

### ❌ DON'T: Hardcode Secrets

```rust
// ❌ BAD: Secret in source code
const API_KEY: &str = "sk_live_abc123";

// ✅ GOOD: Load from environment
let api_key = std::env::var("API_KEY")
    .map_err(|_| Error::MissingSecret("API_KEY"))?;
```

### ❌ DON'T: Ignore Panics

```rust
// ❌ BAD: Panic crashes the entire process
std::panic::set_hook(Box::new(|_| {})); // Silent panic

// ✅ GOOD: Log and handle panics
std::panic::set_hook(Box::new(|panic_info| {
    tracing::error!("Panic occurred: {:?}", panic_info);
    // Trigger alert, cleanup, graceful shutdown
}));
```

### ❌ DON'T: Trust User Input

```rust
// ❌ BAD: Direct SQL from user input
let query = format!("SELECT * FROM users WHERE id = {}", user_id);

// ✅ GOOD: Parameterized queries
sqlx::query!("SELECT * FROM users WHERE id = $1", user_id)
    .fetch_one(&pool)
    .await?;
```

---

## Production Hardening Workflow

### 1. Design Phase
```
Security Requirements → Threat Modeling → Architecture Review
```

### 2. Development Phase
```
Secure Coding → Dependency Audit → Unit Tests → Security Tests
```

### 3. Pre-Deployment Phase
```
Vulnerability Scan → Pen Testing → Load Testing → Compliance Check
```

### 4. Deployment Phase
```
Immutable Build → Canary Deploy → Monitor → Rollback Plan
```

### 5. Operations Phase
```
Continuous Monitoring → Incident Response → Patch Management → Audit
```

---

## Essential Crates for Production Hardening

### Security
- **cargo-audit** - Vulnerability scanning
- **cargo-deny** - License and dependency policies
- **secrecy** - Zero-on-drop secrets
- **argon2** - Password hashing
- **jsonwebtoken** - JWT authentication

### Resilience
- **failsafe** - Circuit breakers, retries
- **tower** - Middleware for timeouts, rate limiting
- **backoff** - Exponential backoff strategies

### Observability
- **tracing** - Structured logging
- **tracing-subscriber** - Log formatting and filtering
- **opentelemetry** - Distributed tracing
- **prometheus** - Metrics collection

### Runtime
- **tokio** - Async runtime with timeouts
- **hyper** - HTTP with connection pooling
- **tower-http** - HTTP middleware (CORS, compression)

---

## Getting Started

### 1. Assess Current State
- Run `cargo audit` to check for vulnerabilities
- Review dependencies with `cargo tree`
- Scan Docker images for CVEs
- Test error handling paths

### 2. Implement Core Hardening
- Start with [Security Hardening](resources/security-hardening.md)
- Add [Fault Tolerance](resources/fault-tolerance.md) patterns
- Implement [Monitoring](resources/monitoring.md)

### 3. Harden Deployment
- Follow [Deployment](resources/deployment.md) best practices
- Set up CI/CD security scanning
- Configure environment secrets

### 4. Continuous Improvement
- Regular security audits
- Load and chaos testing
- Update dependencies monthly
- Review and improve based on incidents

---

## PAIML MCP Integration

Integrate PMAT for automated security and quality analysis:

### Security-Focused Analysis

```bash
# Install PMAT
cargo install pmat

# Run security audit chain
cargo audit && cargo deny check && pmat analyze security

# Check Rust Project Score (security category)
pmat repo-score --category security

# Dependency health analysis
pmat analyze dependencies --security-focus
```

### Toyota Way Quality Gates (Jidoka)

```bash
# Pre-deployment security gate
pmat quality-gate --strict --security

# Zero vulnerability policy
pmat analyze security --zero-tolerance
```

### CI/CD Security Pipeline

```yaml
# .github/workflows/security-hardening.yml
- name: PAIML Security Gate
  run: |
    cargo install pmat cargo-audit cargo-deny
    cargo audit
    cargo deny check
    pmat analyze security --nist-mapping
    pmat repo-score --category security --min 40
```

See [paiml-mcp-toolkit](../paiml-mcp-toolkit/SKILL.md) for complete integration.

---

## Compliance and Standards

This skill aligns with:
- ✅ **NIST SP 800-53** (High-impact baseline)
- ✅ **CIS Benchmarks** (Level 2 for production)
- ✅ **OWASP Top 10** (Web application security)
- ✅ **PCI DSS** (Payment card industry)
- ✅ **HIPAA** (Healthcare data protection)
- ✅ **SOC 2** (Security and availability)

---

**Related Skills:**
- [paiml-mcp-toolkit](../paiml-mcp-toolkit/SKILL.md) - PMAT security analysis
- [kaizen-solaris-review](../kaizen-solaris-review/SKILL.md) - Toyota Way quality gates
- [rust-skills](../rust-skills/SKILL.md) - Rust Backend Development Guidelines
- [Error Handling](../rust-skills/resources/error-handling.md)
- [Security Patterns](../rust-skills/resources/security-patterns.md)
- [Deployment Guide](../rust-skills/resources/deployment-guide.md)

---

**Version**: 1.1
**Last Updated**: 2025-12-03
**Status**: Production-Ready
**Compliance**: NIST SP 800-53, CIS Level 2, OWASP
**PAIML Integration**: PMAT Security Analysis, Toyota Way Gates ✅
