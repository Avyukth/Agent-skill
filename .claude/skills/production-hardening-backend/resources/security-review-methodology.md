# Security Review Methodology

Systematic security review process for identifying vulnerabilities in code changes. Based on OWASP standards and Anthropic's security-focused approach.

## Table of Contents

- [Review Philosophy](#review-philosophy)
- [Security Categories](#security-categories)
- [Analysis Methodology](#analysis-methodology)
- [Severity Classification](#severity-classification)
- [False Positive Filtering](#false-positive-filtering)
- [Output Format](#output-format)

---

## Review Philosophy

### Core Principles

1. **HIGH-CONFIDENCE Focus** - Only flag issues with >80% confidence of actual exploitability
2. **Minimize False Positives** - Skip theoretical issues, style concerns, or low-impact findings
3. **Prioritize Impact** - Focus on vulnerabilities leading to unauthorized access, data breaches, or system compromise
4. **New Code Only** - Focus on vulnerabilities newly introduced, not existing issues

### Exclusions (Do NOT Report)

- Denial of Service (DoS) vulnerabilities
- Secrets stored on disk (handled by other processes)
- Rate limiting or resource exhaustion issues
- Memory safety issues in Rust (impossible due to language guarantees)
- Files that are only unit tests
- Log spoofing concerns
- Insecure documentation (markdown files)
- Lack of audit logs

---

## Security Categories

### 1. Input Validation Vulnerabilities

| Vulnerability | Description | Impact |
|---------------|-------------|--------|
| **SQL Injection** | Unsanitized user input in SQL queries | Data breach, unauthorized access |
| **Command Injection** | User input in system calls/subprocesses | RCE, system compromise |
| **XXE Injection** | Malicious XML parsing | Data exfiltration, SSRF |
| **Template Injection** | User input in templating engines | RCE, XSS |
| **NoSQL Injection** | Unsanitized input in NoSQL queries | Data breach |
| **Path Traversal** | User input in file operations | Arbitrary file read/write |

### 2. Authentication & Authorization

| Vulnerability | Description | Impact |
|---------------|-------------|--------|
| **Auth Bypass** | Logic flaws bypassing authentication | Unauthorized access |
| **Privilege Escalation** | Accessing higher privilege functionality | Data breach, system compromise |
| **Session Management** | Weak session handling | Session hijacking |
| **JWT Vulnerabilities** | Weak signing, no expiry validation | Token forgery |
| **Authorization Bypass** | Logic flaws in access control | Data breach |

### 3. Cryptography & Secrets

| Vulnerability | Description | Impact |
|---------------|-------------|--------|
| **Hardcoded Secrets** | API keys, passwords in code | Full compromise |
| **Weak Algorithms** | MD5, SHA1, DES usage | Crypto bypass |
| **Improper Key Storage** | Keys in plaintext/weak storage | Key theft |
| **Randomness Issues** | Predictable random values | Crypto bypass |
| **Certificate Bypass** | Disabled cert validation | MITM attacks |

### 4. Injection & Code Execution

| Vulnerability | Description | Impact |
|---------------|-------------|--------|
| **Deserialization RCE** | Untrusted deserialization | Remote code execution |
| **Pickle Injection** | Python pickle with untrusted data | RCE |
| **YAML Deserialization** | Unsafe YAML loading | RCE |
| **Eval Injection** | User input in eval/exec | RCE |
| **XSS** | Unsanitized output in HTML | Session hijacking, defacement |

### 5. Data Exposure

| Vulnerability | Description | Impact |
|---------------|-------------|--------|
| **Sensitive Logging** | Secrets/PII in logs | Data breach |
| **PII Handling** | Improper PII storage/transmission | Compliance violation |
| **API Data Leakage** | Excessive data in responses | Information disclosure |
| **Debug Exposure** | Debug info in production | Information disclosure |

---

## Analysis Methodology

### Phase 1: Repository Context Research

Before reviewing changes, understand existing security patterns:

```bash
# Identify security frameworks in use
grep -r "sanitize\|validate\|escape\|encode" src/

# Find existing auth patterns
grep -r "authenticate\|authorize\|jwt\|token" src/

# Check for security middleware
grep -r "middleware\|guard\|filter" src/
```

**Questions to answer:**
- What security libraries are already used?
- What validation patterns exist?
- Where are trust boundaries?

### Phase 2: Comparative Analysis

Compare new code against established patterns:

- [ ] Does new code follow existing security patterns?
- [ ] Are there deviations from established practices?
- [ ] Does it introduce new attack surfaces?
- [ ] Are security checks consistent?

### Phase 3: Vulnerability Assessment

For each modified file:

1. **Trace Data Flow** - Follow user input from entry to sensitive operations
2. **Identify Trust Boundaries** - Where does untrusted data cross into trusted zones?
3. **Check Privilege Operations** - Are authorization checks in place?
4. **Review Injection Points** - Any string concatenation with user input?

---

## Severity Classification

### HIGH Severity

**Criteria:** Directly exploitable vulnerabilities leading to:
- Remote Code Execution (RCE)
- Data breach / unauthorized data access
- Authentication bypass
- Full system compromise

**Examples:**
- SQL injection with no parameterization
- Hardcoded production credentials
- Auth bypass via logic flaw
- Deserialization of untrusted data

### MEDIUM Severity

**Criteria:** Vulnerabilities requiring specific conditions but with significant impact:
- Chained exploits needed
- Requires user interaction
- Limited scope but real impact

**Examples:**
- Stored XSS in admin panel
- IDOR requiring valid session
- Weak password policy
- Missing rate limiting on sensitive endpoints

### LOW Severity

**Criteria:** Defense-in-depth issues or lower-impact vulnerabilities:
- Information disclosure (non-sensitive)
- Missing security headers
- Verbose error messages

---

## Confidence Scoring

| Score | Confidence Level | Action |
|-------|------------------|--------|
| 0.9-1.0 | Certain exploit path identified | Report as HIGH confidence |
| 0.8-0.9 | Clear vulnerability pattern with known methods | Report |
| 0.7-0.8 | Suspicious pattern requiring specific conditions | Report with caveats |
| <0.7 | Speculative | **Do NOT report** |

---

## False Positive Filtering

### Hard Exclusions

Always exclude findings matching these patterns:

1. DoS/resource exhaustion attacks
2. Secrets on disk (handled separately)
3. Rate limiting concerns
4. Memory safety in Rust/Go (language guarantees)
5. Test-only files
6. Log spoofing
7. Documentation files
8. Missing audit logs
9. Regex injection (not a vulnerability)
10. User content in AI prompts (not a vulnerability)

### Precedents

Apply these precedents consistently:

| Pattern | Verdict | Rationale |
|---------|---------|-----------|
| Logging URLs | Safe | URLs are not sensitive |
| UUIDs as identifiers | Safe | Unguessable by design |
| Environment variables | Trusted | Attacker cannot modify |
| CLI flags | Trusted | Require shell access |
| React/Angular without `dangerouslySetInnerHTML` | XSS-safe | Framework escapes by default |
| Client-side permission checks | Not vulnerable | Server validates |

### Framework-Specific Considerations

**React/Angular/Vue:**
- XSS only via `dangerouslySetInnerHTML`, `bypassSecurityTrust*`, or `v-html`
- Default rendering is escaped

**GitHub Actions:**
- Most workflow vulnerabilities are not exploitable
- Only report with specific untrusted input attack path

**Shell Scripts:**
- Generally don't run with untrusted input
- Only report with concrete attack path

---

## Output Format

### Required Fields

For each vulnerability found:

```markdown
# Vuln N: [Category]: `file.rs:line`

* **Severity:** HIGH | MEDIUM | LOW
* **Confidence:** 0.8-1.0
* **Description:** Clear explanation of the vulnerability
* **Exploit Scenario:** Concrete attack path an attacker could follow
* **Recommendation:** Specific remediation guidance
```

### Example Report

```markdown
# Vuln 1: SQL Injection: `src/db/users.rs:142`

* **Severity:** HIGH
* **Confidence:** 0.95
* **Description:** User input from `username` parameter is directly
  concatenated into SQL query without parameterization, allowing SQL injection.
* **Exploit Scenario:** Attacker submits username like `admin'--` to bypass
  authentication, or `'; DROP TABLE users;--` to destroy data.
* **Recommendation:** Use SQLx parameterized queries:
  ```rust
  sqlx::query!("SELECT * FROM users WHERE username = $1", username)
  ```

---

# Vuln 2: Hardcoded Secret: `src/config.rs:28`

* **Severity:** HIGH
* **Confidence:** 1.0
* **Description:** Production API key hardcoded in source code.
* **Exploit Scenario:** Anyone with repo access can extract the key and
  access the third-party API as this application.
* **Recommendation:** Move to environment variable or secret manager:
  ```rust
  let api_key = std::env::var("API_KEY").expect("API_KEY must be set");
  ```
```

---

## Integration with CI/CD

### Claude Security Review Action

```yaml
# .github/workflows/security-review.yml
name: Security Review

on:
  pull_request:

permissions:
  pull-requests: write
  contents: read

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - uses: anthropics/claude-code-security-review@main
        with:
          comment-pr: true
          claude-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          claude-model: claude-opus-4-1-20250805
```

### Manual Security Review

Use the `/security-review` slash command for on-demand reviews:

```
/security-review
```

This analyzes:
1. Git diff for changes
2. Repository context for existing patterns
3. Each change against security categories
4. Filters false positives
5. Reports HIGH and MEDIUM findings only

---

## Related Resources

- [security-hardening.md](security-hardening.md) - OWASP Top 10 mitigations
- [core-principles.md](core-principles.md) - Defense in depth strategies

---

**Focus on HIGH and MEDIUM findings only. Better to miss theoretical issues than flood with false positives.**
