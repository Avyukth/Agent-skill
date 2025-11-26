# Conventional Commits Guide

## Table of Contents

1. [Specification](#specification)
2. [Commit Types](#commit-types)
3. [Scopes](#scopes)
4. [Breaking Changes](#breaking-changes)
5. [Examples](#examples)
6. [Automation Setup](#automation-setup)
7. [Semantic Versioning Integration](#semantic-versioning-integration)

---

## Specification

Conventional Commits is a specification for adding human and machine-readable meaning to commit messages. It provides an explicit commit history that enables automated tooling.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Rules

1. **Type is required** - Must be one of the defined types
2. **Description is required** - Imperative mood, lowercase, no period
3. **Scope is optional** - Noun describing section of codebase
4. **Body is optional** - Detailed explanation if needed
5. **Footer is optional** - Breaking changes, issue references

### Character Limits

| Component | Limit |
|-----------|-------|
| Header (type + scope + description) | 72 characters |
| Body line | 100 characters |
| Footer line | 100 characters |

---

## Commit Types

### Primary Types (Affect Version)

| Type | Description | Version Bump | When to Use |
|------|-------------|--------------|-------------|
| `feat` | New feature | MINOR | Adding new functionality |
| `fix` | Bug fix | PATCH | Fixing broken behavior |
| `perf` | Performance | PATCH | Improving performance |

### Secondary Types (No Version Bump)

| Type | Description | When to Use |
|------|-------------|-------------|
| `docs` | Documentation | README, JSDoc, comments |
| `style` | Formatting | Whitespace, semicolons, lint |
| `refactor` | Code restructure | No behavior change |
| `test` | Tests | Adding/fixing tests |
| `chore` | Maintenance | Dependencies, tooling |
| `ci` | CI/CD | GitHub Actions, pipelines |
| `build` | Build system | Webpack, npm scripts |
| `revert` | Revert commit | Undoing previous commit |

### Type Decision Tree

```
Does it add new functionality?
├─ YES → feat
└─ NO → Does it fix a bug?
         ├─ YES → fix
         └─ NO → Does it improve performance?
                  ├─ YES → perf
                  └─ NO → Does it change code behavior?
                           ├─ YES → refactor
                           └─ NO → Is it documentation?
                                    ├─ YES → docs
                                    └─ NO → Is it tests?
                                             ├─ YES → test
                                             └─ NO → Is it CI/CD?
                                                      ├─ YES → ci
                                                      └─ NO → chore
```

---

## Scopes

### What is a Scope?

A scope provides additional contextual information about which part of the codebase is affected. It's a noun in parentheses after the type.

### Common Scopes

```bash
# By Feature
feat(auth): add OAuth2 login
fix(cart): correct total calculation
docs(api): update endpoint documentation

# By Component
feat(button): add loading state
fix(modal): prevent backdrop scroll

# By Layer
feat(service): add caching layer
fix(repository): handle null results

# By Module
feat(user-service): add profile endpoint
fix(payment-gateway): retry failed transactions
```

### Scope Guidelines

- Use consistent, project-defined scopes
- Keep scopes lowercase
- Use hyphens for multi-word scopes
- Document allowed scopes in CONTRIBUTING.md
- Consider monorepo package names as scopes

### Example Scope Configuration

```json
// commitlint.config.js scopes
{
  "scope-enum": [
    "api",
    "auth",
    "core",
    "ui",
    "db",
    "config",
    "deps",
    "ci"
  ]
}
```

---

## Breaking Changes

### What is a Breaking Change?

A change that requires consumers to modify their code when upgrading. Breaking changes trigger a MAJOR version bump.

### Indicating Breaking Changes

#### Method 1: Footer

```bash
feat: allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now used
for extending other config files instead of defining extensions.
```

#### Method 2: Bang Notation (!)

```bash
feat!: remove deprecated API endpoints

# With scope
feat(api)!: change response format to JSON:API

# With body explaining migration
refactor!: drop support for Node 14

Node 14 reached EOL. Minimum supported version is now Node 18.

Migration: Update your Node.js version to 18 or higher.
```

### Breaking Change Guidelines

1. **Always explain migration path** in body or footer
2. **Link to migration guide** if complex
3. **Deprecate first** when possible
4. **Batch breaking changes** in major releases
5. **Test thoroughly** before releasing

---

## Examples

### Feature Commits

```bash
# Simple feature
feat: add dark mode toggle

# Feature with scope
feat(auth): implement password reset flow

# Feature with body
feat(search): add fuzzy matching support

Implements Levenshtein distance algorithm for typo tolerance.
Configurable threshold via SEARCH_FUZZY_THRESHOLD env var.

# Feature with issue reference
feat(notifications): add email digest option

Closes #234
```

### Bug Fix Commits

```bash
# Simple fix
fix: prevent null pointer in user lookup

# Fix with scope
fix(cart): correct quantity validation

# Fix with detailed body
fix(api): handle rate limit exceeded gracefully

Previously, 429 responses caused unhandled exceptions.
Now properly caught and retried with exponential backoff.

Fixes #567

# Security fix
fix(auth): sanitize user input in login form

Prevents XSS attack vector in username field.

Security: CVE-2024-1234
```

### Refactor Commits

```bash
# Simple refactor
refactor: extract validation logic to separate module

# Refactor with scope
refactor(db): use connection pooling

# Refactor with rationale
refactor(api): replace callbacks with async/await

Improves readability and error handling.
No functional changes.
```

### Documentation Commits

```bash
# README updates
docs: update installation instructions

# API documentation
docs(api): add authentication examples

# Code comments
docs: add JSDoc to utility functions
```

### Chore Commits

```bash
# Dependencies
chore(deps): upgrade lodash to 4.17.21

# Tooling
chore: configure prettier

# Build
chore(build): optimize webpack bundle size
```

### CI Commits

```bash
# Pipeline changes
ci: add Node 20 to test matrix

# GitHub Actions
ci(actions): cache npm dependencies

# Deployment
ci: add staging deployment workflow
```

### Revert Commits

```bash
revert: feat(auth): add OAuth2 login

This reverts commit abc1234.

Reason: OAuth provider integration incomplete.
```

---

## Automation Setup

### Commitlint

Enforces commit message format.

```bash
# Install
npm install -D @commitlint/cli @commitlint/config-conventional

# Configure
echo "module.exports = { extends: ['@commitlint/config-conventional'] };" > commitlint.config.js
```

### Husky (Git Hooks)

Runs commitlint on commit.

```bash
# Install
npm install -D husky

# Initialize
npx husky init

# Add commit-msg hook
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
```

### Commitizen

Interactive commit message builder.

```bash
# Install globally
npm install -g commitizen

# Initialize project
commitizen init cz-conventional-changelog --save-dev --save-exact

# Use instead of git commit
git cz
# or
npx cz
```

### Complete Setup Script

```bash
#!/bin/bash
# setup-conventional-commits.sh

# Install dependencies
npm install -D @commitlint/cli @commitlint/config-conventional husky

# Configure commitlint
cat > commitlint.config.js << 'EOF'
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'perf', 'test', 'chore', 'ci', 'build', 'revert'
    ]],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100]
  }
};
EOF

# Setup husky
npx husky init
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg

echo "Conventional Commits setup complete!"
```

---

## Semantic Versioning Integration

### How Types Map to Versions

```
MAJOR.MINOR.PATCH (e.g., 2.1.3)

feat  → MINOR bump (2.1.3 → 2.2.0)
fix   → PATCH bump (2.1.3 → 2.1.4)
perf  → PATCH bump (2.1.3 → 2.1.4)
!     → MAJOR bump (2.1.3 → 3.0.0)
```

### Semantic Release Setup

```bash
# Install
npm install -D semantic-release @semantic-release/changelog @semantic-release/git

# Configure
cat > .releaserc.json << 'EOF'
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/git",
    "@semantic-release/github"
  ]
}
EOF
```

### GitHub Actions for Release

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

### Version Bump Examples

```bash
# These commits since last release:
feat: add user profiles          # → MINOR
fix: correct email validation    # → PATCH
docs: update README              # → (none)
chore: upgrade dependencies      # → (none)

# Result: MINOR bump (highest precedence)
# v1.2.3 → v1.3.0
```

```bash
# Breaking change example:
feat!: redesign API responses    # → MAJOR
fix: handle edge case            # → PATCH

# Result: MAJOR bump (breaking change takes precedence)
# v1.2.3 → v2.0.0
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│                 CONVENTIONAL COMMITS                     │
├─────────────────────────────────────────────────────────┤
│ FORMAT:                                                  │
│   <type>[scope]: <description>                          │
│                                                         │
│ TYPES:                                                  │
│   feat     New feature                    → MINOR       │
│   fix      Bug fix                        → PATCH       │
│   docs     Documentation                  → -           │
│   style    Formatting                     → -           │
│   refactor Code change (no feat/fix)     → -           │
│   perf     Performance                    → PATCH       │
│   test     Tests                          → -           │
│   chore    Maintenance                    → -           │
│   ci       CI/CD                          → -           │
│   build    Build system                   → -           │
│   revert   Revert commit                  → -           │
│                                                         │
│ BREAKING CHANGE:                                        │
│   feat!: description          → MAJOR                   │
│   BREAKING CHANGE: in footer  → MAJOR                   │
│                                                         │
│ EXAMPLES:                                               │
│   feat(auth): add OAuth2 login                          │
│   fix: prevent null pointer exception                   │
│   docs(api): update authentication guide                │
│   feat!: remove deprecated endpoints                    │
└─────────────────────────────────────────────────────────┘
```

---

**Sources**: [Conventional Commits v1.0.0](https://www.conventionalcommits.org/), [Semantic Versioning](https://semver.org/), [Angular Convention](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
