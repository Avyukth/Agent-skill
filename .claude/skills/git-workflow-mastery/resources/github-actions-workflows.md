# GitHub Actions Workflows

## Table of Contents

1. [Essential Workflows](#essential-workflows)
2. [PR Validation](#pr-validation)
3. [Commit Linting](#commit-linting)
4. [Security Scanning](#security-scanning)
5. [Release Automation](#release-automation)
6. [Multi-Agent Orchestration](#multi-agent-orchestration)
7. [Reusable Workflows](#reusable-workflows)
8. [Claude Code AI-Powered Reviews](#claude-code-ai-powered-reviews)

---

## Essential Workflows

### Workflow Structure

```yaml
name: Workflow Name
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  job-name:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Step name
        run: echo "Hello"
```

### Event Triggers

```yaml
# Push to specific branches
on:
  push:
    branches: [main, develop]
    paths:
      - 'src/**'
      - '!src/**/*.md'

# Pull requests
on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [main]

# Manual trigger
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

# Scheduled
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight

# Multiple triggers
on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:
```

---

## PR Validation

### Complete PR Workflow

```yaml
# .github/workflows/pr-validation.yml
name: PR Validation

on:
  pull_request:
    branches: [main, develop]
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write
  checks: write

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run Prettier
        run: npm run format:check

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run TypeScript
        run: npm run typecheck

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          fail_ci_if_error: true

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/
          retention-days: 7
```

### PR Size Check

```yaml
# .github/workflows/pr-size.yml
name: PR Size Check

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  check-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check PR size
        uses: actions/github-script@v7
        with:
          script: |
            const { data: files } = await github.rest.pulls.listFiles({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number,
            });

            let additions = 0;
            let deletions = 0;

            files.forEach(file => {
              additions += file.additions;
              deletions += file.deletions;
            });

            const total = additions + deletions;
            let message = '';
            let label = '';

            if (total <= 50) {
              label = 'size/XS';
              message = 'Excellent PR size!';
            } else if (total <= 150) {
              label = 'size/S';
              message = 'Great PR size!';
            } else if (total <= 250) {
              label = 'size/M';
              message = 'Good PR size.';
            } else if (total <= 500) {
              label = 'size/L';
              message = 'Consider splitting this PR.';
            } else {
              label = 'size/XL';
              message = 'This PR is too large. Please split it.';
            }

            // Add label
            await github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              labels: [label]
            });

            // Comment if large
            if (total > 250) {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body: `**PR Size Warning**\n\nThis PR has ${total} lines changed (${additions} additions, ${deletions} deletions).\n\n${message}\n\nSmaller PRs are easier to review and less likely to introduce bugs.`
              });
            }
```

---

## Commit Linting

### Commitlint Workflow

```yaml
# .github/workflows/commitlint.yml
name: Commit Lint

on:
  pull_request:
    branches: [main]

jobs:
  commitlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install commitlint
        run: |
          npm install -g @commitlint/cli @commitlint/config-conventional

      - name: Validate commits
        run: |
          npx commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }} --verbose
```

### Using Commitlint Action

```yaml
# .github/workflows/commitlint.yml
name: Commit Lint

on:
  pull_request:

jobs:
  commitlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: wagoid/commitlint-github-action@v5
        with:
          configFile: commitlint.config.js
          failOnWarnings: false
          helpURL: https://github.com/conventional-changelog/commitlint/#what-is-commitlint
```

### commitlint.config.js

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'perf', 'test', 'chore', 'ci', 'build', 'revert'
    ]],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always']
  }
};
```

---

## Security Scanning

### Comprehensive Security Workflow

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday

permissions:
  contents: read
  security-events: write

jobs:
  dependency-scan:
    name: Dependency Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Run npm audit
        run: npm audit --audit-level=high

  codeql:
    name: CodeQL Analysis
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript, typescript
          queries: security-extended

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:javascript"

  secret-scan:
    name: Secret Detection
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: TruffleHog Scan
        uses: trufflesecurity/trufflehog@main
        with:
          extra_args: --only-verified

      - name: Gitleaks Scan
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  sast:
    name: SAST
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten

  license-check:
    name: License Compliance
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Check licenses
        run: npx license-checker --failOn "GPL;AGPL;LGPL"
```

### Dependabot Configuration

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    commit-message:
      prefix: "chore(deps)"
    labels:
      - "dependencies"
      - "automerge"
    groups:
      dev-dependencies:
        dependency-type: "development"
      production-dependencies:
        dependency-type: "production"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    commit-message:
      prefix: "ci(deps)"
```

---

## Release Automation

### Semantic Release Workflow

```yaml
# .github/workflows/release.yml
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
    name: Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

### .releaserc.json

```json
{
  "branches": ["main"],
  "plugins": [
    ["@semantic-release/commit-analyzer", {
      "preset": "conventionalcommits",
      "releaseRules": [
        {"type": "feat", "release": "minor"},
        {"type": "fix", "release": "patch"},
        {"type": "perf", "release": "patch"},
        {"type": "revert", "release": "patch"},
        {"breaking": true, "release": "major"}
      ]
    }],
    ["@semantic-release/release-notes-generator", {
      "preset": "conventionalcommits",
      "presetConfig": {
        "types": [
          {"type": "feat", "section": "Features"},
          {"type": "fix", "section": "Bug Fixes"},
          {"type": "perf", "section": "Performance"},
          {"type": "revert", "section": "Reverts"},
          {"type": "docs", "section": "Documentation", "hidden": true},
          {"type": "chore", "section": "Miscellaneous", "hidden": true}
        ]
      }
    }],
    ["@semantic-release/changelog", {
      "changelogFile": "CHANGELOG.md"
    }],
    "@semantic-release/npm",
    ["@semantic-release/git", {
      "assets": ["CHANGELOG.md", "package.json"],
      "message": "chore(release): ${nextRelease.version}\n\n${nextRelease.notes}"
    }],
    "@semantic-release/github"
  ]
}
```

---

## Multi-Agent Orchestration

### EIB-TBD Orchestrator Workflow

```yaml
# .github/workflows/eib-tbd-orchestrator.yml
name: EIB-TBD Orchestrator

on:
  pull_request:
    types: [opened, synchronize, labeled, closed]
    branches: [main, integration]

permissions:
  contents: write
  pull-requests: write

env:
  BATCH_SIZE_MIN: 3
  BATCH_SIZE_MAX: 7

jobs:
  # Create integration branch when first PR opens to main
  create-integration:
    if: |
      github.event.action == 'opened' &&
      github.event.pull_request.base.ref == 'main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check if integration exists
        id: check
        run: |
          if git ls-remote --heads origin integration | grep -q integration; then
            echo "exists=true" >> $GITHUB_OUTPUT
          else
            echo "exists=false" >> $GITHUB_OUTPUT
          fi

      - name: Create integration branch
        if: steps.check.outputs.exists == 'false'
        run: |
          git checkout -b integration
          git push origin integration

      - name: Update PR base
        if: steps.check.outputs.exists == 'false'
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.pulls.update({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number,
              base: 'integration'
            });

  # Monitor batch size
  check-batch:
    if: github.event.pull_request.base.ref == 'integration'
    runs-on: ubuntu-latest
    outputs:
      batch_ready: ${{ steps.count.outputs.ready }}
    steps:
      - name: Count ready PRs
        id: count
        uses: actions/github-script@v7
        with:
          script: |
            const { data: prs } = await github.rest.pulls.list({
              owner: context.repo.owner,
              repo: context.repo.repo,
              base: 'integration',
              state: 'open'
            });

            const readyPRs = prs.filter(pr =>
              pr.labels.some(l => l.name === 'ready-for-batch')
            );

            console.log(`Ready PRs: ${readyPRs.length}`);

            if (readyPRs.length >= ${{ env.BATCH_SIZE_MIN }}) {
              core.setOutput('ready', 'true');
            } else {
              core.setOutput('ready', 'false');
            }

  # Trigger batch merge when threshold met
  batch-merge:
    needs: check-batch
    if: needs.check-batch.outputs.batch_ready == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Merge ready PRs
        uses: actions/github-script@v7
        with:
          script: |
            const { data: prs } = await github.rest.pulls.list({
              owner: context.repo.owner,
              repo: context.repo.repo,
              base: 'integration',
              state: 'open'
            });

            const readyPRs = prs.filter(pr =>
              pr.labels.some(l => l.name === 'ready-for-batch')
            ).slice(0, ${{ env.BATCH_SIZE_MAX }});

            for (const pr of readyPRs) {
              try {
                await github.rest.pulls.merge({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  pull_number: pr.number,
                  merge_method: 'squash'
                });
                console.log(`Merged PR #${pr.number}`);
              } catch (error) {
                console.log(`Failed to merge PR #${pr.number}: ${error.message}`);
              }
            }

      - name: Trigger security hardening
        run: |
          gh workflow run security-hardening.yml -f branch=integration
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Auto-Rebase Workflow

```yaml
# .github/workflows/auto-rebase.yml
name: Auto Rebase

on:
  schedule:
    - cron: '0 */2 * * *'  # Every 2 hours
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write

jobs:
  rebase-prs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Rebase open PRs
        uses: actions/github-script@v7
        with:
          script: |
            const { data: prs } = await github.rest.pulls.list({
              owner: context.repo.owner,
              repo: context.repo.repo,
              state: 'open'
            });

            for (const pr of prs) {
              // Skip PRs with conflicts or specific labels
              if (pr.labels.some(l => l.name === 'no-auto-rebase')) {
                continue;
              }

              try {
                await github.rest.pulls.updateBranch({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  pull_number: pr.number
                });
                console.log(`Rebased PR #${pr.number}`);
              } catch (error) {
                console.log(`Could not rebase PR #${pr.number}: ${error.message}`);
              }
            }
```

---

## Reusable Workflows

### Reusable Test Workflow

```yaml
# .github/workflows/reusable-test.yml
name: Reusable Test Workflow

on:
  workflow_call:
    inputs:
      node-version:
        description: 'Node.js version'
        required: false
        default: '20'
        type: string
      coverage-threshold:
        description: 'Minimum coverage percentage'
        required: false
        default: '80'
        type: string
    secrets:
      CODECOV_TOKEN:
        required: false

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage --coverageThreshold='{"global":{"branches":${{ inputs.coverage-threshold }},"functions":${{ inputs.coverage-threshold }},"lines":${{ inputs.coverage-threshold }}}}'

      - name: Upload coverage
        if: ${{ secrets.CODECOV_TOKEN }}
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
```

### Using Reusable Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  test:
    uses: ./.github/workflows/reusable-test.yml
    with:
      node-version: '20'
      coverage-threshold: '85'
    secrets:
      CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}
```

---

## Claude Code AI-Powered Reviews

### Claude Code Review Action

Automate AI-powered code reviews on every PR using Anthropic's official GitHub Action:

```yaml
# .github/workflows/claude-code-review.yml
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]

jobs:
  claude-review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: read
      id-token: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Run Claude Code Review
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          # Alternative: claude-api-key: ${{ secrets.CLAUDE_API_KEY }}
          track_progress: true
          prompt: |
            REPO: ${{ github.repository }}
            PR NUMBER: ${{ github.event.pull_request.number }}

            Perform comprehensive code review:
            1. Code Quality - Clean code, error handling, maintainability
            2. Security - Vulnerabilities, input validation, authentication
            3. Performance - Bottlenecks, queries, resource usage
            4. Testing - Coverage, edge cases, test quality
            5. Documentation - Comments, README updates

            Provide inline comments for specific issues.
            Use top-level comments for general observations.
            Reference CLAUDE.md for style conventions.

            Use `gh pr comment` to leave review.

          claude_args: '--model claude-opus-4-1-20250805 --allowed-tools "Bash(gh pr comment:*),Bash(gh pr diff:*),Bash(gh pr view:*)"'
```

### Claude Security Review Action

Automated security scanning with Anthropic's specialized security review action:

```yaml
# .github/workflows/claude-security-review.yml
name: Claude Security Review

permissions:
  pull-requests: write
  contents: read

on:
  pull_request:

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha || github.sha }}
          fetch-depth: 2

      - uses: anthropics/claude-code-security-review@main
        with:
          comment-pr: true
          claude-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          claude-model: claude-opus-4-1-20250805
          custom-security-scan-instructions: |
            Focus on OWASP Top 10 vulnerabilities.
            Flag hardcoded secrets with HIGH severity.
```

### Required Secrets

| Secret | Purpose | How to Get |
|--------|---------|------------|
| `CLAUDE_CODE_OAUTH_TOKEN` | OAuth authentication | [Claude Code OAuth](https://docs.anthropic.com/claude-code) |
| `ANTHROPIC_API_KEY` | API key authentication | [Anthropic Console](https://console.anthropic.com) |

### Best Practices

1. **Use OAuth token** for production (more secure than API keys)
2. **Enable track_progress** for visibility into review status
3. **Customize prompts** to match your team's review standards
4. **Reference CLAUDE.md** for project-specific conventions
5. **Combine with traditional CI** - Claude reviews complement, not replace, linting/testing

### Integration with EIB-TBD

Add Claude review as a required status check:

```yaml
# In your branch protection rules, require:
# - claude-review (from claude-code-review.yml)
# - security (from claude-security-review.yml)
```

---

## Quick Reference

### Common Actions

| Purpose | Action |
|---------|--------|
| Checkout | `actions/checkout@v4` |
| Node.js | `actions/setup-node@v4` |
| Cache | `actions/cache@v4` |
| Upload artifact | `actions/upload-artifact@v4` |
| GitHub Script | `actions/github-script@v7` |
| Snyk | `snyk/actions/node@master` |
| CodeQL | `github/codeql-action/*@v3` |
| Commitlint | `wagoid/commitlint-github-action@v5` |
| Codecov | `codecov/codecov-action@v4` |

### Status Badges

```markdown
![CI](https://github.com/owner/repo/workflows/CI/badge.svg)
![Security](https://github.com/owner/repo/workflows/Security/badge.svg)
![Release](https://github.com/owner/repo/workflows/Release/badge.svg)
```

---

**Sources**: [GitHub Actions Docs](https://docs.github.com/en/actions), [GitHub Marketplace](https://github.com/marketplace?type=actions), [Snyk Docs](https://docs.snyk.io/)
