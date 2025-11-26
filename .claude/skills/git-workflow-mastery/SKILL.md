---
name: git-workflow-mastery
description: Comprehensive Git branching strategies and workflow best practices for modern development teams. Use when creating branches, writing commit messages, configuring CI/CD pipelines, managing pull requests, implementing trunk-based development, GitFlow, GitHub Flow, feature flags, multi-agent development, batch merging, security hardening, conventional commits, semantic versioning, code review, rebase vs merge decisions, or automating release workflows. Covers EIB-TBD strategy, PR size guidelines (150-250 LoC), branch protection rules, and GitHub Actions automation.
---

# Git Workflow Mastery

## Purpose

Establish comprehensive Git branching strategies and workflow best practices optimized for modern development teams, including multi-agent AI-assisted development, TDD practices, and batch security hardening workflows.

## When to Use This Skill

Automatically activates when working on:
- Creating or managing Git branches
- Writing commit messages
- Setting up CI/CD pipelines with Git
- Managing pull requests and code reviews
- Implementing branching strategies (trunk-based, GitFlow, GitHub Flow)
- Configuring branch protection rules
- Automating releases with semantic versioning
- Multi-agent or parallel development workflows
- Security hardening in Git workflows
- Feature flag integration with branching

---

## Quick Start

### New Feature Development Checklist

- [ ] **Branch**: Create from latest `main` with proper naming
- [ ] **Commits**: Use Conventional Commits format
- [ ] **Size**: Keep PR to 150-250 lines of code
- [ ] **Tests**: TDD - tests pass before PR
- [ ] **PR**: Clear description with test plan
- [ ] **Review**: Address feedback promptly
- [ ] **Merge**: Squash or rebase per team policy

### Repository Setup Checklist

- [ ] Branch protection on `main`
- [ ] Required status checks configured
- [ ] PR template with checklist
- [ ] Commit message linting (Commitlint)
- [ ] Automated versioning (semantic-release)
- [ ] Security scanning in CI

---

## Recommended Strategy: Enhanced Trunk-Based Development (EIB-TBD)

### Branch Structure

```
main                  ────✨ (Always secure, deployable, TDD-covered)
 │
 └─ integration        ────🔄 (Ephemeral: 1-3 days, holds 3-7 PRs for batch hardening)
      │
      ├─ agent-1-feature-A ────➡️ PR #1 (150-250 LoC)
      ├─ agent-2-feature-B ────➡️ PR #2
      ├─ agent-3-bugfix-C  ────➡️ PR #3
      └─ ... (up to 7)
```

### Branch Types

| Branch | Lifetime | Purpose | Protection |
|--------|----------|---------|------------|
| `main` | Permanent | Production-ready code | Strict |
| `integration` | 24-72 hours | Batch hardening | Moderate |
| `feature/*` | Hours-days | New features | None |
| `bugfix/*` | Hours | Bug fixes | None |
| `hotfix/*` | Hours | Critical fixes | Direct to main |

### Why EIB-TBD?

| Strategy | Fit Score | Best For |
|----------|-----------|----------|
| Pure TBD | 8/10 | Small teams, fast iterations |
| Git Flow | 4/10 | Release-based, slow cycles |
| GitHub Flow | 7/10 | Simple projects |
| **EIB-TBD** | **10/10** | Multi-agent + batch security |

See [branching-strategies.md](resources/branching-strategies.md) for detailed comparisons.

---

## Conventional Commits

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types and Versioning

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat` | New feature | MINOR (0.x.0) |
| `fix` | Bug fix | PATCH (0.0.x) |
| `docs` | Documentation only | None |
| `style` | Formatting, no code change | None |
| `refactor` | Code change, no feature/fix | None |
| `perf` | Performance improvement | PATCH |
| `test` | Adding tests | None |
| `chore` | Build, tooling, deps | None |
| `ci` | CI/CD configuration | None |

### Breaking Changes

```bash
# Using footer
feat: allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now used for extending other config files

# Using ! notation
feat!: send an email to the customer when a product is shipped

# With scope
feat(api)!: remove deprecated endpoints
```

### Examples

```bash
# Feature with scope
feat(auth): add OAuth2 support for Google login

# Bug fix
fix: prevent racing condition in user registration

# Documentation
docs: update API authentication examples

# Breaking change
feat(api)!: change response format to JSON:API spec

BREAKING CHANGE: All API responses now follow JSON:API specification.
Migration guide: https://example.com/migration
```

See [conventional-commits.md](resources/conventional-commits.md) for complete guide.

---

## PR Best Practices

### Size Guidelines

| Lines Changed | Rating | Review Time |
|---------------|--------|-------------|
| 1-150 | Excellent | 15-30 min |
| 150-250 | Good | 30-60 min |
| 250-500 | Acceptable | 1-2 hours |
| 500+ | Too Large | Split it |

### PR Template

```markdown
## Summary
Brief description of changes

## Type of Change
- [ ] feat: New feature
- [ ] fix: Bug fix
- [ ] refactor: Code refactoring
- [ ] docs: Documentation
- [ ] test: Tests
- [ ] chore: Maintenance

## Test Plan
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings introduced
```

See [pull-request-guidelines.md](resources/pull-request-guidelines.md) for templates and workflows.

---

## Rebase vs Merge Decision Tree

```
Is the branch shared with others?
├─ YES → Use MERGE
└─ NO → Is PR under active review with comments?
         ├─ YES → Use MERGE (preserve context)
         └─ NO → Use REBASE (clean history)
```

### Quick Rules

- **Merge into main** - Always preserve integration history
- **Rebase feature branches** - Keep linear history during development
- **Never rebase public branches** - Avoid coordination problems
- **Squash for clean history** - When merging feature → main

See [rebase-vs-merge.md](resources/rebase-vs-merge.md) for detailed scenarios.

---

## Branch Naming Conventions

### Format

```
<type>/<ticket>-<short-description>
```

### Examples

```bash
# Features
feature/PROJ-123-user-authentication
feat/AUTH-456-oauth-google

# Bug fixes
bugfix/PROJ-789-fix-login-redirect
fix/UI-101-button-alignment

# Hotfixes
hotfix/CRITICAL-emergency-security-patch

# Multi-agent development
agent-1-feat-PROJ-123-auth-module
agent-2-fix-PROJ-124-validation
```

### Rules

- Lowercase only
- Hyphens for word separation
- Include ticket number when available
- Keep under 50 characters
- Descriptive but concise

---

## GitHub Actions Automation

### Essential Workflows

```yaml
# PR Validation
on:
  pull_request:
    branches: [main, integration]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Lint Commits
        uses: wagoid/commitlint-github-action@v5
      - name: Run Tests
        run: npm test
      - name: Security Scan
        uses: snyk/actions/node@master
```

See [github-actions-workflows.md](resources/github-actions-workflows.md) for complete templates.

---

## Security Hardening

### Pre-Merge Checklist

- [ ] Dependency vulnerability scan (Snyk/Dependabot)
- [ ] Static code analysis (SonarQube/CodeQL)
- [ ] Secret detection (git-secrets/trufflehog)
- [ ] License compliance check
- [ ] Container scanning (if applicable)

### Branch Protection Rules

```yaml
# Recommended settings for main
main:
  required_status_checks:
    strict: true
    contexts:
      - "test"
      - "security-scan"
      - "lint"
  required_pull_request_reviews:
    required_approving_review_count: 1
    dismiss_stale_reviews: true
  enforce_admins: true
  restrictions: null
```

See [security-hardening.md](resources/security-hardening.md) for batch security workflows.

---

## Multi-Agent Development

### Coordination Patterns

1. **No Overlapping Features** - Orchestrator assigns via GitHub Issues
2. **Feature Flags** - All partial features behind flags
3. **Frequent Rebasing** - Every 2 hours during active development
4. **Conflict Detection** - Fail PR if >10% conflicts
5. **Batch Integration** - Collect 3-7 PRs before hardening

### Agent Workflow

```
1. Pull latest main
2. Create agent-{id}-{type}-{feature} branch
3. TDD Loop: failing test → code → pass → refactor
4. Atomic commits with Conventional format
5. Open Draft PR to integration
6. Auto-rebase every 2 hours
7. Mark ready-for-batch when complete
```

See [multi-agent-workflow.md](resources/multi-agent-workflow.md) for orchestration details.

---

## Navigation Guide

| Need to... | Read this |
|------------|-----------|
| Compare branching strategies | [branching-strategies.md](resources/branching-strategies.md) |
| Write proper commit messages | [conventional-commits.md](resources/conventional-commits.md) |
| Create/review pull requests | [pull-request-guidelines.md](resources/pull-request-guidelines.md) |
| Decide rebase vs merge | [rebase-vs-merge.md](resources/rebase-vs-merge.md) |
| Set up GitHub Actions | [github-actions-workflows.md](resources/github-actions-workflows.md) |
| Implement security scanning | [security-hardening.md](resources/security-hardening.md) |
| Coordinate multi-agent dev | [multi-agent-workflow.md](resources/multi-agent-workflow.md) |
| Automate releases | [semantic-release.md](resources/semantic-release.md) |

---

## Anti-Patterns to Avoid

- **Long-lived feature branches** - Leads to merge hell
- **Direct commits to main** - Bypasses review and CI
- **Vague commit messages** - "fixed stuff", "updates"
- **Giant PRs** - 500+ lines impossible to review well
- **Force pushing shared branches** - Breaks collaborators
- **Skipping CI checks** - Technical debt accumulation
- **No branch protection** - Accidental overwrites
- **Manual versioning** - Inconsistent and error-prone

---

## Quick Reference

### Git Commands Cheatsheet

```bash
# Create feature branch
git checkout -b feature/PROJ-123-description main

# Rebase on latest main
git fetch origin && git rebase origin/main

# Interactive rebase (clean up commits)
git rebase -i HEAD~3

# Squash merge
git merge --squash feature-branch

# Amend last commit (local only!)
git commit --amend --no-edit

# Cherry-pick specific commit
git cherry-pick <commit-sha>

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

### Semantic Version Format

```
MAJOR.MINOR.PATCH
  │     │     │
  │     │     └── Bug fixes (backwards compatible)
  │     └──────── New features (backwards compatible)
  └────────────── Breaking changes
```

---

## Resource Files

### [branching-strategies.md](resources/branching-strategies.md)
Detailed comparison of TBD, GitFlow, GitHub Flow, EIB-TBD with decision matrices

### [conventional-commits.md](resources/conventional-commits.md)
Complete Conventional Commits guide with automation setup

### [pull-request-guidelines.md](resources/pull-request-guidelines.md)
PR templates, review checklists, and size guidelines

### [rebase-vs-merge.md](resources/rebase-vs-merge.md)
Decision trees and scenarios for rebase vs merge

### [github-actions-workflows.md](resources/github-actions-workflows.md)
Ready-to-use workflow templates for CI/CD

### [security-hardening.md](resources/security-hardening.md)
Security scanning setup and batch hardening workflows

### [multi-agent-workflow.md](resources/multi-agent-workflow.md)
Multi-agent development coordination and orchestration

### [semantic-release.md](resources/semantic-release.md)
Automated versioning and release management

---

## Related Skills

- **backend-dev-guidelines** - Node.js/Express patterns
- **frontend-dev-guidelines** - React/TypeScript best practices
- **production-hardening-backend** - Security hardening for Rust services
- **production-hardening-frontend** - Security hardening for SvelteKit apps

---

**Skill Status**: COMPLETE
**Line Count**: < 500
**Progressive Disclosure**: 8 resource files
**Coverage**: Full Git workflow lifecycle

**Sources**: Research compiled from [Atlassian Git Tutorials](https://www.atlassian.com/git/tutorials), [Trunk Based Development](https://trunkbaseddevelopment.com/), [Conventional Commits](https://www.conventionalcommits.org/), [GitHub Docs](https://docs.github.com/), and industry best practices from Google, Microsoft, and Netflix.
