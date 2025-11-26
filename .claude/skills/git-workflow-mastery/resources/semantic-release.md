# Semantic Release & Versioning

## Table of Contents

1. [Semantic Versioning](#semantic-versioning)
2. [Semantic Release Setup](#semantic-release-setup)
3. [Changelog Generation](#changelog-generation)
4. [Release Workflows](#release-workflows)
5. [Monorepo Releases](#monorepo-releases)
6. [Manual Releases](#manual-releases)

---

## Semantic Versioning

### Version Format

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]

Examples:
1.0.0         - Initial stable release
1.2.3         - Standard release
2.0.0-alpha.1 - Pre-release
1.0.0+build.1 - Build metadata
```

### Version Increment Rules

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Breaking changes | MAJOR | 1.2.3 → 2.0.0 |
| New features | MINOR | 1.2.3 → 1.3.0 |
| Bug fixes | PATCH | 1.2.3 → 1.2.4 |
| Pre-release | Special | 1.2.3 → 1.2.4-beta.1 |

### Commit to Version Mapping

```
Conventional Commit → SemVer

feat: new feature           → MINOR (1.0.0 → 1.1.0)
fix: bug fix                → PATCH (1.0.0 → 1.0.1)
perf: performance           → PATCH (1.0.0 → 1.0.1)
feat!: breaking feature     → MAJOR (1.0.0 → 2.0.0)
fix!: breaking fix          → MAJOR (1.0.0 → 2.0.0)
BREAKING CHANGE: in footer  → MAJOR (1.0.0 → 2.0.0)

docs: documentation         → No bump
style: formatting           → No bump
refactor: code change       → No bump
test: tests                 → No bump
chore: maintenance          → No bump
ci: CI changes              → No bump
```

### Pre-release Versions

```bash
# Alpha releases (early testing)
1.0.0-alpha.1
1.0.0-alpha.2

# Beta releases (feature complete, testing)
1.0.0-beta.1
1.0.0-beta.2

# Release candidates (production ready candidate)
1.0.0-rc.1
1.0.0-rc.2

# Stable release
1.0.0
```

---

## Semantic Release Setup

### Installation

```bash
npm install -D semantic-release \
  @semantic-release/changelog \
  @semantic-release/git \
  @semantic-release/github \
  conventional-changelog-conventionalcommits
```

### Basic Configuration

```json
// .releaserc.json
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
```

### Extended Configuration

```json
// .releaserc.json
{
  "branches": [
    "main",
    {
      "name": "beta",
      "prerelease": true
    },
    {
      "name": "alpha",
      "prerelease": true
    }
  ],
  "plugins": [
    ["@semantic-release/commit-analyzer", {
      "preset": "conventionalcommits",
      "releaseRules": [
        {"type": "feat", "release": "minor"},
        {"type": "fix", "release": "patch"},
        {"type": "perf", "release": "patch"},
        {"type": "revert", "release": "patch"},
        {"type": "docs", "scope": "README", "release": "patch"},
        {"type": "refactor", "release": false},
        {"breaking": true, "release": "major"}
      ],
      "parserOpts": {
        "noteKeywords": ["BREAKING CHANGE", "BREAKING CHANGES"]
      }
    }],
    ["@semantic-release/release-notes-generator", {
      "preset": "conventionalcommits",
      "presetConfig": {
        "types": [
          {"type": "feat", "section": "Features", "hidden": false},
          {"type": "fix", "section": "Bug Fixes", "hidden": false},
          {"type": "perf", "section": "Performance Improvements", "hidden": false},
          {"type": "revert", "section": "Reverts", "hidden": false},
          {"type": "docs", "section": "Documentation", "hidden": true},
          {"type": "style", "section": "Styles", "hidden": true},
          {"type": "chore", "section": "Miscellaneous Chores", "hidden": true},
          {"type": "refactor", "section": "Code Refactoring", "hidden": true},
          {"type": "test", "section": "Tests", "hidden": true},
          {"type": "build", "section": "Build System", "hidden": true},
          {"type": "ci", "section": "Continuous Integration", "hidden": true}
        ]
      }
    }],
    ["@semantic-release/changelog", {
      "changelogFile": "CHANGELOG.md",
      "changelogTitle": "# Changelog\n\nAll notable changes to this project will be documented in this file."
    }],
    ["@semantic-release/npm", {
      "npmPublish": true,
      "tarballDir": "dist"
    }],
    ["@semantic-release/git", {
      "assets": ["CHANGELOG.md", "package.json", "package-lock.json"],
      "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
    }],
    ["@semantic-release/github", {
      "assets": [
        {"path": "dist/*.tgz", "label": "Distribution"}
      ],
      "successComment": "This ${issue.pull_request ? 'PR is included' : 'issue has been resolved'} in version ${nextRelease.version}",
      "failComment": false,
      "releasedLabels": ["released"]
    }]
  ]
}
```

### JavaScript Configuration

```javascript
// release.config.js
module.exports = {
  branches: [
    'main',
    { name: 'next', prerelease: true },
    { name: 'beta', prerelease: true },
  ],
  plugins: [
    ['@semantic-release/commit-analyzer', {
      preset: 'conventionalcommits',
      releaseRules: [
        { type: 'feat', release: 'minor' },
        { type: 'fix', release: 'patch' },
        { type: 'perf', release: 'patch' },
        { breaking: true, release: 'major' },
      ],
    }],
    ['@semantic-release/release-notes-generator', {
      preset: 'conventionalcommits',
    }],
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/git',
    '@semantic-release/github',
  ],
};
```

---

## Changelog Generation

### Changelog Format

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [2.1.0](https://github.com/owner/repo/compare/v2.0.0...v2.1.0) (2024-01-15)

### Features

* **auth:** add OAuth2 support ([#123](https://github.com/owner/repo/issues/123)) ([abc1234](https://github.com/owner/repo/commit/abc1234))
* **api:** add rate limiting ([def5678](https://github.com/owner/repo/commit/def5678))

### Bug Fixes

* **validation:** fix email regex ([#125](https://github.com/owner/repo/issues/125)) ([ghi9012](https://github.com/owner/repo/commit/ghi9012))

## [2.0.0](https://github.com/owner/repo/compare/v1.5.0...v2.0.0) (2024-01-01)

### ⚠ BREAKING CHANGES

* **api:** response format changed to JSON:API

### Features

* **api:** implement JSON:API response format ([jkl3456](https://github.com/owner/repo/commit/jkl3456))
```

### Custom Changelog Template

```javascript
// changelog-template.js
const template = `{{#each releases}}
## {{this.tag}} ({{this.date}})

{{#if this.features}}
### Features
{{#each this.features}}
* {{this.scope}}: {{this.subject}}
{{/each}}
{{/if}}

{{#if this.fixes}}
### Bug Fixes
{{#each this.fixes}}
* {{this.scope}}: {{this.subject}}
{{/each}}
{{/if}}

{{#if this.breaking}}
### BREAKING CHANGES
{{#each this.breaking}}
* {{this.text}}
{{/each}}
{{/if}}

{{/each}}`;

module.exports = template;
```

### Keep-a-Changelog Format

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New feature X

### Changed
- Updated dependency Y

### Deprecated
- Old API endpoint Z

### Removed
- Legacy function W

### Fixed
- Bug in component V

### Security
- Patched vulnerability U

## [1.0.0] - 2024-01-01

### Added
- Initial release
```

---

## Release Workflows

### GitHub Actions Release

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main, next, beta]

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
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run tests
        run: npm test

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

### Dry Run for Testing

```yaml
# .github/workflows/release-dry-run.yml
name: Release Dry Run

on:
  pull_request:
    branches: [main]

jobs:
  dry-run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Semantic Release Dry Run
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx semantic-release --dry-run

      - name: Preview next version
        run: |
          VERSION=$(npx semantic-release --dry-run 2>&1 | grep "next release version" | tail -1)
          echo "Next version: $VERSION"
```

### Release with Approval

```yaml
# .github/workflows/release-approval.yml
name: Release with Approval

on:
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'Dry run (no actual release)'
        required: true
        default: 'true'
        type: boolean

jobs:
  prepare:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.version }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Get next version
        id: version
        run: |
          VERSION=$(npx semantic-release --dry-run 2>&1 | grep -oP "next release version is \K[0-9]+\.[0-9]+\.[0-9]+")
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Generate release notes
        run: npx semantic-release --dry-run

  approve:
    needs: prepare
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Approve release
        run: echo "Release v${{ needs.prepare.outputs.version }} approved"

  release:
    needs: [prepare, approve]
    if: inputs.dry_run == false
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci && npm run build

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

---

## Monorepo Releases

### Using semantic-release-monorepo

```bash
npm install -D semantic-release-monorepo
```

```json
// packages/package-a/.releaserc.json
{
  "extends": "semantic-release-monorepo",
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    "@semantic-release/github"
  ]
}
```

### Lerna + Semantic Release

```json
// lerna.json
{
  "version": "independent",
  "npmClient": "npm",
  "command": {
    "version": {
      "conventionalCommits": true,
      "message": "chore(release): publish"
    }
  }
}
```

### Changesets for Monorepos

```bash
npm install -D @changesets/cli
npx changeset init
```

```yaml
# .github/workflows/release-changesets.yml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          publish: npm run release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Manual Releases

### When to Use Manual Releases

- Emergency hotfixes
- Coordinated releases
- Pre-releases
- Platform-specific releases

### Manual Release Script

```bash
#!/bin/bash
# manual-release.sh

set -e

VERSION=$1
TYPE=${2:-patch}  # major, minor, patch, premajor, preminor, prepatch, prerelease

if [ -z "$VERSION" ]; then
    echo "Usage: ./manual-release.sh <version> [type]"
    echo "  type: major, minor, patch (default), premajor, preminor, prepatch, prerelease"
    exit 1
fi

# Ensure clean working directory
if [ -n "$(git status --porcelain)" ]; then
    echo "Error: Working directory is not clean"
    exit 1
fi

# Ensure on main branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    echo "Error: Must be on main branch"
    exit 1
fi

# Pull latest
git pull origin main

# Run tests
npm test

# Build
npm run build

# Update version
npm version $TYPE --no-git-tag-version

# Update changelog manually or with conventional-changelog
npx conventional-changelog -p conventionalcommits -i CHANGELOG.md -s

# Commit
NEW_VERSION=$(node -p "require('./package.json').version")
git add .
git commit -m "chore(release): v$NEW_VERSION"

# Tag
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# Push
git push origin main
git push origin "v$NEW_VERSION"

# Publish to npm (if applicable)
npm publish

echo "Released v$NEW_VERSION"
```

### Git Tag Versioning

```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag
git push origin v1.0.0

# Push all tags
git push origin --tags

# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push origin --delete v1.0.0

# List tags
git tag -l "v1.*"

# Show tag details
git show v1.0.0
```

---

## Quick Reference

### Version Cheat Sheet

```
Breaking change?
├─ YES → MAJOR bump (1.0.0 → 2.0.0)
└─ NO → New feature?
         ├─ YES → MINOR bump (1.0.0 → 1.1.0)
         └─ NO → Bug fix?
                  ├─ YES → PATCH bump (1.0.0 → 1.0.1)
                  └─ NO → No version bump
```

### Semantic Release Commands

```bash
# Dry run (see what would happen)
npx semantic-release --dry-run

# Debug mode
DEBUG=semantic-release:* npx semantic-release

# Specify branches
npx semantic-release --branches main

# Skip CI
npx semantic-release --ci false
```

### Pre-release Flow

```bash
# Create beta branch
git checkout -b beta

# Make changes and commit
git commit -m "feat: new feature"

# Push to trigger release
git push origin beta

# Result: 1.0.0-beta.1

# More changes
git commit -m "fix: bug fix"
git push origin beta

# Result: 1.0.0-beta.2

# Promote to stable
git checkout main
git merge beta
git push origin main

# Result: 1.1.0
```

---

**Sources**: [Semantic Versioning](https://semver.org/), [semantic-release](https://semantic-release.gitbook.io/), [Conventional Commits](https://www.conventionalcommits.org/)
