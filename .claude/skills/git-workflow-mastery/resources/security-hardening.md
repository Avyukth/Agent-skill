# Security Hardening for Git Workflows

## Table of Contents

1. [Security Scanning Overview](#security-scanning-overview)
2. [Dependency Scanning](#dependency-scanning)
3. [Static Analysis (SAST)](#static-analysis-sast)
4. [Secret Detection](#secret-detection)
5. [Batch Security Hardening](#batch-security-hardening)
6. [Branch Protection](#branch-protection)
7. [Supply Chain Security](#supply-chain-security)

---

## Security Scanning Overview

### Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Git Workflow                          │
├─────────────────────────────────────────────────────────┤
│  Pre-Commit          │  CI/CD              │  Production │
│  ─────────           │  ─────              │  ──────────│
│  • Secret detection  │  • Dependency scan  │  • Runtime  │
│  • Lint checks       │  • SAST analysis    │    security │
│  • Type checking     │  • License check    │  • Monitoring│
│                      │  • Container scan   │  • Alerts    │
└─────────────────────────────────────────────────────────┘
```

### Tool Matrix

| Tool | Type | Speed | Coverage | Best For |
|------|------|-------|----------|----------|
| Snyk | Dependency | Fast | Excellent | OSS vulnerabilities |
| Dependabot | Dependency | Fast | Good | GitHub native |
| CodeQL | SAST | Slow | Excellent | Deep analysis |
| Semgrep | SAST | Fast | Good | Custom rules |
| Gitleaks | Secrets | Fast | Good | Git history |
| TruffleHog | Secrets | Medium | Excellent | Verified secrets |

---

## Dependency Scanning

### Snyk Setup

```yaml
# .github/workflows/snyk.yml
name: Snyk Security

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 0 * * *'  # Daily

jobs:
  snyk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high --fail-on=all

      - name: Upload Snyk results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: snyk.sarif
```

### NPM Audit

```yaml
# As part of CI workflow
- name: Security audit
  run: |
    npm audit --audit-level=high
    npm audit --json > audit-results.json

- name: Check for critical vulnerabilities
  run: |
    CRITICAL=$(jq '.metadata.vulnerabilities.critical' audit-results.json)
    HIGH=$(jq '.metadata.vulnerabilities.high' audit-results.json)
    if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]; then
      echo "Critical: $CRITICAL, High: $HIGH vulnerabilities found"
      exit 1
    fi
```

### Dependabot Auto-Merge

```yaml
# .github/workflows/dependabot-auto-merge.yml
name: Dependabot Auto-Merge

on:
  pull_request:
    types: [opened, synchronize]

permissions:
  contents: write
  pull-requests: write

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    steps:
      - name: Fetch Dependabot metadata
        id: metadata
        uses: dependabot/fetch-metadata@v2
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}

      - name: Auto-merge patch updates
        if: steps.metadata.outputs.update-type == 'version-update:semver-patch'
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Auto-merge minor updates for dev deps
        if: |
          steps.metadata.outputs.update-type == 'version-update:semver-minor' &&
          steps.metadata.outputs.dependency-type == 'direct:development'
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Static Analysis (SAST)

### CodeQL Configuration

```yaml
# .github/workflows/codeql.yml
name: CodeQL Analysis

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1'  # Weekly

permissions:
  security-events: write
  contents: read

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        language: ['javascript', 'typescript']

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
          queries: +security-extended,security-and-quality
          config-file: .github/codeql/codeql-config.yml

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:${{ matrix.language }}"
```

### CodeQL Config

```yaml
# .github/codeql/codeql-config.yml
name: "CodeQL Config"

queries:
  - uses: security-extended
  - uses: security-and-quality

query-filters:
  - exclude:
      id: js/unused-local-variable

paths-ignore:
  - node_modules
  - '**/*.test.ts'
  - '**/*.spec.ts'
  - dist
  - coverage
```

### Semgrep Configuration

```yaml
# .github/workflows/semgrep.yml
name: Semgrep

on:
  push:
    branches: [main]
  pull_request:

jobs:
  semgrep:
    runs-on: ubuntu-latest
    container:
      image: returntocorp/semgrep

    steps:
      - uses: actions/checkout@v4

      - name: Run Semgrep
        run: |
          semgrep scan \
            --config=auto \
            --config=p/security-audit \
            --config=p/secrets \
            --config=p/owasp-top-ten \
            --config=p/typescript \
            --sarif --output=semgrep.sarif \
            --error

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: semgrep.sarif
```

### Custom Semgrep Rules

```yaml
# .semgrep/custom-rules.yml
rules:
  - id: no-hardcoded-credentials
    patterns:
      - pattern-either:
          - pattern: password = "..."
          - pattern: api_key = "..."
          - pattern: secret = "..."
    message: "Hardcoded credentials detected"
    languages: [javascript, typescript]
    severity: ERROR

  - id: no-eval
    pattern: eval(...)
    message: "Avoid using eval() - potential code injection"
    languages: [javascript, typescript]
    severity: ERROR

  - id: no-sql-injection
    patterns:
      - pattern: |
          $DB.query(`... ${$VAR} ...`)
    message: "Potential SQL injection - use parameterized queries"
    languages: [javascript, typescript]
    severity: ERROR
```

---

## Secret Detection

### Pre-Commit Hook

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks

  - repo: https://github.com/awslabs/git-secrets
    rev: master
    hooks:
      - id: git-secrets
```

### Gitleaks Configuration

```toml
# .gitleaks.toml
title = "Gitleaks Config"

[extend]
useDefault = true

[[rules]]
id = "custom-api-key"
description = "Custom API Key Pattern"
regex = '''(?i)(api[_-]?key|apikey)\s*[:=]\s*['"]?[a-z0-9]{32,}['"]?'''
tags = ["key", "api"]

[[rules]]
id = "jwt-token"
description = "JWT Token"
regex = '''eyJ[A-Za-z0-9-_=]+\.eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*'''
tags = ["jwt", "token"]

[allowlist]
description = "Allowlisted files and patterns"
paths = [
    '''\.gitleaks\.toml$''',
    '''\.env\.example$''',
    '''package-lock\.json$''',
]
regexes = [
    '''EXAMPLE_KEY=.*''',
    '''test[_-]?api[_-]?key''',
]
```

### TruffleHog Workflow

```yaml
# .github/workflows/trufflehog.yml
name: TruffleHog Secret Scan

on:
  push:
  pull_request:

jobs:
  trufflehog:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: TruffleHog Scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
          extra_args: --only-verified --fail
```

---

## Batch Security Hardening

### Integration Branch Hardening Workflow

```yaml
# .github/workflows/batch-security-hardening.yml
name: Batch Security Hardening

on:
  workflow_dispatch:
    inputs:
      branch:
        description: 'Branch to harden'
        required: true
        default: 'integration'
  push:
    branches: [integration]

permissions:
  contents: write
  pull-requests: write
  security-events: write

jobs:
  dependency-audit:
    name: Dependency Audit
    runs-on: ubuntu-latest
    outputs:
      vulnerabilities: ${{ steps.audit.outputs.vulnerabilities }}
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ inputs.branch || github.ref }}

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Run comprehensive audit
        id: audit
        run: |
          npm audit --json > audit.json || true
          VULNS=$(jq '.metadata.vulnerabilities | .critical + .high' audit.json)
          echo "vulnerabilities=$VULNS" >> $GITHUB_OUTPUT

      - uses: actions/upload-artifact@v4
        with:
          name: audit-report
          path: audit.json

  sast-scan:
    name: SAST Scan
    runs-on: ubuntu-latest
    outputs:
      findings: ${{ steps.scan.outputs.findings }}
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ inputs.branch || github.ref }}

      - name: Run Semgrep
        id: scan
        run: |
          docker run --rm -v "${PWD}:/src" returntocorp/semgrep \
            semgrep scan --config=auto --json --output=/src/semgrep.json /src || true
          FINDINGS=$(jq '.results | length' semgrep.json)
          echo "findings=$FINDINGS" >> $GITHUB_OUTPUT

      - uses: actions/upload-artifact@v4
        with:
          name: sast-report
          path: semgrep.json

  secret-scan:
    name: Secret Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ inputs.branch || github.ref }}
          fetch-depth: 0

      - name: Run Gitleaks
        run: |
          docker run --rm -v "${PWD}:/repo" zricethezav/gitleaks:latest \
            detect --source=/repo --report-format=json --report-path=/repo/gitleaks.json || true

      - uses: actions/upload-artifact@v4
        with:
          name: secret-report
          path: gitleaks.json

  auto-fix:
    name: Auto-Fix Vulnerabilities
    needs: [dependency-audit, sast-scan]
    runs-on: ubuntu-latest
    if: needs.dependency-audit.outputs.vulnerabilities > 0
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ inputs.branch || github.ref }}
          token: ${{ secrets.GITHUB_TOKEN }}

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Auto-fix vulnerabilities
        run: |
          npm audit fix --force || true

      - name: Commit fixes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add package*.json
          git diff --staged --quiet || git commit -m "security: auto-fix vulnerabilities"
          git push

  hardening-report:
    name: Hardening Report
    needs: [dependency-audit, sast-scan, secret-scan]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          path: reports

      - name: Generate report
        run: |
          echo "# Security Hardening Report" > report.md
          echo "" >> report.md
          echo "## Dependency Vulnerabilities" >> report.md
          echo "Critical + High: ${{ needs.dependency-audit.outputs.vulnerabilities }}" >> report.md
          echo "" >> report.md
          echo "## SAST Findings" >> report.md
          echo "Total: ${{ needs.sast-scan.outputs.findings }}" >> report.md

      - uses: actions/upload-artifact@v4
        with:
          name: hardening-report
          path: report.md

  approve-merge:
    name: Approve Merge to Main
    needs: [auto-fix, hardening-report]
    runs-on: ubuntu-latest
    if: |
      needs.dependency-audit.outputs.vulnerabilities == 0 ||
      needs.auto-fix.result == 'success'
    steps:
      - name: Create PR to main
        uses: actions/github-script@v7
        with:
          script: |
            const { data: pr } = await github.rest.pulls.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'chore: merge hardened integration to main',
              head: '${{ inputs.branch || 'integration' }}',
              base: 'main',
              body: '## Security Hardening Complete\n\nThis PR contains batch-hardened changes ready for production.'
            });
            console.log(`Created PR #${pr.number}`);
```

---

## Branch Protection

### Recommended Settings

```json
{
  "main": {
    "required_status_checks": {
      "strict": true,
      "contexts": [
        "test",
        "lint",
        "typecheck",
        "security-scan",
        "dependency-audit"
      ]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "dismissal_restrictions": {},
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": true,
      "required_approving_review_count": 1,
      "require_last_push_approval": true
    },
    "restrictions": null,
    "required_linear_history": true,
    "allow_force_pushes": false,
    "allow_deletions": false,
    "block_creations": false,
    "required_conversation_resolution": true,
    "required_signatures": true
  }
}
```

### Setup via CLI

```bash
# Using GitHub CLI
gh api repos/{owner}/{repo}/branches/main/protection \
  -X PUT \
  -H "Accept: application/vnd.github+json" \
  -f required_status_checks='{"strict":true,"contexts":["test","security"]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"dismiss_stale_reviews":true,"required_approving_review_count":1}' \
  -f allow_force_pushes=false \
  -f allow_deletions=false
```

### CODEOWNERS

```
# .github/CODEOWNERS

# Security-sensitive files require security team review
/.github/workflows/          @security-team
/src/auth/                   @security-team
/src/crypto/                 @security-team
*.secrets.*                  @security-team
.env*                        @security-team

# Infrastructure changes require ops review
/terraform/                  @ops-team
/kubernetes/                 @ops-team
Dockerfile                   @ops-team

# Default owners
*                            @core-team
```

---

## Supply Chain Security

### Dependency Pinning

```json
// package.json
{
  "dependencies": {
    "express": "4.18.2",
    "lodash": "4.17.21"
  },
  "overrides": {
    "minimist": "1.2.8"
  }
}
```

### Lock File Verification

```yaml
# Verify lock file integrity
- name: Verify lock file
  run: |
    npm ci --ignore-scripts
    git diff --exit-code package-lock.json
```

### Signed Commits

```yaml
# Require signed commits
- name: Verify commit signatures
  run: |
    git verify-commit HEAD || {
      echo "Commit is not signed"
      exit 1
    }
```

### SLSA Provenance

```yaml
# Generate SLSA provenance for releases
- name: Generate provenance
  uses: slsa-framework/slsa-github-generator/.github/workflows/builder_nodejs_slsa3.yml@v1.9.0
  with:
    run-npm-build: true
```

---

## Quick Reference

### Security Checklist

```
Pre-Commit:
□ Secrets scanned
□ Linting passed
□ Type checking passed

PR Validation:
□ Dependency audit passed
□ SAST scan passed
□ Secret detection passed
□ License compliance passed
□ Tests passed

Pre-Merge:
□ Branch up to date
□ Required approvals obtained
□ All checks green
□ No merge conflicts

Production:
□ Signed release
□ Provenance generated
□ Changelog updated
```

### Common Vulnerability Types

| Type | Tool | Severity |
|------|------|----------|
| Dependency vulns | Snyk, npm audit | High |
| SQL Injection | CodeQL, Semgrep | Critical |
| XSS | CodeQL, Semgrep | High |
| Secrets in code | Gitleaks, TruffleHog | Critical |
| Insecure deserialization | Semgrep | High |
| Path traversal | CodeQL | High |

---

**Sources**: [Snyk](https://snyk.io/), [GitHub Security](https://docs.github.com/en/code-security), [OWASP](https://owasp.org/), [Semgrep](https://semgrep.dev/)
