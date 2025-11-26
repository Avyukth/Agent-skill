# Git Branching Strategies

## Table of Contents

1. [Strategy Comparison](#strategy-comparison)
2. [Trunk-Based Development](#trunk-based-development)
3. [GitFlow](#gitflow)
4. [GitHub Flow](#github-flow)
5. [Enhanced Trunk-Based Development (EIB-TBD)](#enhanced-trunk-based-development-eib-tbd)
6. [Decision Matrix](#decision-matrix)
7. [Migration Guides](#migration-guides)

---

## Strategy Comparison

| Strategy | Complexity | Best For | Merge Frequency | Branch Lifetime |
|----------|------------|----------|-----------------|-----------------|
| Trunk-Based | Low | Small teams, CI/CD | Multiple/day | Hours |
| GitHub Flow | Low | Web apps, SaaS | Daily | Days |
| GitFlow | High | Scheduled releases | Weekly | Weeks-Months |
| EIB-TBD | Medium | Multi-agent, Security | Daily batches | Hours-Days |

### Industry Adoption

- **Trunk-Based**: Google (35,000+ engineers), Meta, Netflix
- **GitHub Flow**: GitHub, Shopify, most startups
- **GitFlow**: Enterprise software, mobile apps with store releases
- **EIB-TBD**: AI-assisted development teams, regulated industries

---

## Trunk-Based Development

### Overview

Developers collaborate on a single branch (`main`/`trunk`), committing small changes frequently. Feature branches are short-lived (< 1 day) or avoided entirely.

### Branch Structure

```
main ──●──●──●──●──●──●──●──●──●──●──●──●── (continuous)
        │     │           │
        └─●───┘           └─●───┘
        (hours)           (hours)
```

### Rules

1. **Commit to main at least daily**
2. **Branches live < 24 hours**
3. **All commits pass CI**
4. **Use feature flags for incomplete features**
5. **No long-lived branches**

### Pros

- Minimal merge conflicts
- Fast feedback loops
- Enables true CI/CD
- Simple mental model
- Forces small, reviewable changes

### Cons

- Requires robust CI/CD
- Needs feature flag infrastructure
- Not suitable for scheduled releases
- Requires high test coverage
- Can be challenging for junior developers

### When to Use

- Teams practicing CI/CD
- Web applications with continuous deployment
- Small to medium teams (< 50 developers)
- High test coverage environments
- Experienced development teams

### Implementation

```bash
# Daily workflow
git checkout main
git pull origin main
# Make changes
git add .
git commit -m "feat: add user validation"
git push origin main

# Short-lived branch (if needed)
git checkout -b quick-fix
# Make changes
git commit -m "fix: correct typo"
git checkout main
git merge quick-fix
git branch -d quick-fix
git push origin main
```

---

## GitFlow

### Overview

A strict branching model with dedicated branches for features, releases, and hotfixes. Designed for projects with scheduled release cycles.

### Branch Structure

```
main     ─────────────●─────────────────●──────────── (releases only)
                     /                 /
develop  ──●──●──●──●──●──●──●──●──●──●──●──●──●──── (integration)
            \   /     \       /   \     /
feature/a    ●─●       \     /     \   /
                        ●───●       ●─●
                     release/1.0  hotfix/1.0.1
```

### Branch Types

| Branch | Source | Merges To | Purpose |
|--------|--------|-----------|---------|
| `main` | - | - | Production releases |
| `develop` | main | main | Integration |
| `feature/*` | develop | develop | New features |
| `release/*` | develop | main, develop | Release prep |
| `hotfix/*` | main | main, develop | Emergency fixes |

### Rules

1. **Never commit directly to main or develop**
2. **Features branch from and merge to develop**
3. **Releases branch from develop, merge to both**
4. **Hotfixes branch from main, merge to both**
5. **Tag all releases on main**

### Pros

- Clear release management
- Parallel feature development
- Dedicated hotfix path
- Good for versioned software
- Clear audit trail

### Cons

- Complex branching model
- Slow feedback cycles
- Merge conflicts accumulate
- Overhead for small teams
- Can become bottleneck

### When to Use

- Scheduled release cycles
- Versioned software products
- Regulated industries requiring audit trails
- Large teams with dedicated release managers
- Mobile apps with app store releases

### Implementation

```bash
# Start feature
git checkout develop
git checkout -b feature/user-auth

# Complete feature
git checkout develop
git merge --no-ff feature/user-auth
git branch -d feature/user-auth

# Start release
git checkout develop
git checkout -b release/1.0.0
# Bug fixes only
git checkout main
git merge --no-ff release/1.0.0
git tag -a v1.0.0 -m "Release 1.0.0"
git checkout develop
git merge --no-ff release/1.0.0

# Hotfix
git checkout main
git checkout -b hotfix/1.0.1
# Fix critical bug
git checkout main
git merge --no-ff hotfix/1.0.1
git tag -a v1.0.1 -m "Hotfix 1.0.1"
git checkout develop
git merge --no-ff hotfix/1.0.1
```

---

## GitHub Flow

### Overview

A simplified workflow with a single `main` branch and feature branches. Every change goes through a pull request.

### Branch Structure

```
main ──●──────●──────────●──────●──────●──── (always deployable)
        \    /   \      /       \    /
         ●──●     ●────●         ●──●
        feature  feature       feature
```

### Rules

1. **Main is always deployable**
2. **Branch off main for any change**
3. **Open PR early for discussion**
4. **Merge only after review and CI passes**
5. **Deploy immediately after merge**

### Pros

- Simple and intuitive
- Fast iteration
- Great for web applications
- Easy onboarding
- Built into GitHub UI

### Cons

- No release management
- Limited for versioned software
- Can lack structure for large teams
- No batch integration
- Security hardening per-PR

### When to Use

- Web applications
- Continuous deployment
- Small to medium teams
- SaaS products
- Projects without versioning needs

### Implementation

```bash
# Start work
git checkout main
git pull origin main
git checkout -b feature/add-search

# Work and commit
git add .
git commit -m "feat: add search functionality"
git push origin feature/add-search

# Open PR on GitHub
# After review and CI
# Merge via GitHub UI
# Delete branch
```

---

## Enhanced Trunk-Based Development (EIB-TBD)

### Overview

Combines trunk-based development with an ephemeral integration branch for batch security hardening. Optimized for multi-agent AI-assisted development.

### Branch Structure

```
main                  ────✨────────────────✨────────────────✨──
                           \              /   \              /
integration                 ●────────────●     ●────────────●
                           /│\          /     /│\          /
                          / │ \        /     / │ \        /
agent-1-feature-A    ────●  │  \      /  ──●   │  \      /
agent-2-feature-B    ───────●   \    /  ──────●    \    /
agent-3-bugfix-C     ────────────●  /  ────────────●   /
                                   ↓                  ↓
                            [Security Hardening] [Security Hardening]
```

### Branch Types

| Branch | Lifetime | Purpose | Created From |
|--------|----------|---------|--------------|
| `main` | Permanent | Production-ready, secured | - |
| `integration` | 24-72 hours | Batch hardening | main |
| `agent-*-*` | Hours-days | Feature development | main |

### Workflow Phases

#### Phase 1: Agent Development (Parallel)

```bash
# Each agent
git checkout main
git pull origin main
git checkout -b agent-1-feat-user-auth

# TDD Loop
# 1. Write failing test
# 2. Implement feature
# 3. Pass test
# 4. Refactor

git commit -m "feat(auth): add JWT token validation"
git push origin agent-1-feat-user-auth
# Open Draft PR to integration
```

#### Phase 2: Batch Collection

- Auto-create `integration` on first PR
- Collect 3-7 ready PRs
- Label: `ready-for-batch`
- Merge all to integration

#### Phase 3: Security Hardening

```bash
# On integration branch
# Run security scans
snyk test
semgrep --config auto .
npm audit

# Fix vulnerabilities
git commit -m "security: patch CVE-2024-1234"

# Human review
# Approve hardened integration
```

#### Phase 4: Merge and Restart

```bash
# Fast-forward merge
git checkout main
git merge integration
git push origin main

# Cleanup
git branch -d integration
# Agents pull new main
```

### Pros

- Batch security reduces overhead by 50%
- Parallel agent development
- Clean, linear history on main
- Holistic vulnerability scanning
- Scales to 10+ agents

### Cons

- Requires coordination tooling
- 1-2 day delay for security
- More complex than pure TBD
- Needs feature flag infrastructure
- Requires GitHub Actions automation

### When to Use

- Multi-agent AI development
- Security-conscious environments
- Teams with 3+ parallel developers
- TDD-focused workflows
- Regulated industries

---

## Decision Matrix

### By Team Size

| Team Size | Recommended | Alternative |
|-----------|-------------|-------------|
| 1-3 | GitHub Flow | Trunk-Based |
| 4-10 | Trunk-Based | EIB-TBD |
| 10-50 | EIB-TBD | Trunk-Based |
| 50+ | EIB-TBD | GitFlow |

### By Release Cadence

| Cadence | Recommended |
|---------|-------------|
| Continuous | Trunk-Based |
| Daily | GitHub Flow |
| Weekly | EIB-TBD |
| Monthly | GitFlow |
| Quarterly | GitFlow |

### By Compliance Requirements

| Requirement | Recommended |
|-------------|-------------|
| SOC2/HIPAA | EIB-TBD |
| PCI-DSS | EIB-TBD or GitFlow |
| No compliance | Trunk-Based |
| Audit trail needed | GitFlow |

---

## Migration Guides

### GitFlow → Trunk-Based

1. Freeze `develop` branch
2. Merge all features to `develop`
3. Create release from `develop`
4. Merge to `main`
5. Delete `develop`
6. Implement feature flags
7. Set up robust CI/CD
8. Train team on small commits

### GitHub Flow → EIB-TBD

1. Keep existing PR workflow
2. Add `integration` branch concept
3. Implement batch merge automation
4. Add security scanning to integration
5. Configure auto-rebase for PRs
6. Set up agent naming conventions

### Any → EIB-TBD

1. Ensure main is stable
2. Set up branch protection
3. Implement GitHub Actions for:
   - Auto-create integration
   - PR validation
   - Security scanning
   - Batch merge detection
4. Train team on workflow
5. Start with 3 PR batches
6. Scale to 5-7 as team adapts

---

**Sources**: [Atlassian](https://www.atlassian.com/git/tutorials/comparing-workflows), [Trunk Based Development](https://trunkbaseddevelopment.com/), [Graphite Git Strategies](https://graphite.com/guides/git-branching-strategies)
