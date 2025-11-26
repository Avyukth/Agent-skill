# Git Workflow Mastery Skill

A comprehensive Claude Code skill for Git branching strategies, workflow best practices, and modern development team coordination.

## Overview

This skill provides complete guidance for:

- **Branching Strategies** - Trunk-based, GitFlow, GitHub Flow, EIB-TBD
- **Conventional Commits** - Standardized commit messages with semantic versioning
- **Pull Request Guidelines** - Size limits, templates, review processes
- **Security Hardening** - Batch security scanning and vulnerability management
- **Multi-Agent Development** - Coordination for AI-assisted parallel development
- **Release Automation** - Semantic versioning and changelog generation

## Installation

Copy the `git-workflow-mastery` directory to your project's `.claude/skills/` folder:

```bash
cp -r git-workflow-mastery /path/to/your/project/.claude/skills/
```

## Skill Structure

```
git-workflow-mastery/
├── SKILL.md                          # Main skill file (<500 lines)
├── README.md                         # This file
└── resources/
    ├── branching-strategies.md       # Detailed strategy comparisons
    ├── conventional-commits.md       # Commit format guide
    ├── pull-request-guidelines.md    # PR templates and review process
    ├── rebase-vs-merge.md            # Decision guide for rebase/merge
    ├── github-actions-workflows.md   # CI/CD workflow templates
    ├── security-hardening.md         # Security scanning setup
    ├── multi-agent-workflow.md       # Agent coordination patterns
    └── semantic-release.md           # Automated versioning
```

## When This Skill Activates

The skill automatically triggers when you mention:

- Git branching, branch strategies, trunk-based development
- Commit messages, conventional commits
- Pull requests, code review
- Rebase vs merge
- CI/CD pipelines, GitHub Actions
- Security scanning, vulnerability management
- Multi-agent development, batch merging
- Semantic versioning, releases

## Key Features

### Enhanced Trunk-Based Development (EIB-TBD)

Optimized branching strategy for multi-agent development with batch security hardening:

```
main ────✨────────────────✨────
          \              /
integration ●────────────●
           /│\          /
          / │ \        /
agent-1-feat  agent-2-fix
```

### Conventional Commits

Standardized commit format enabling automated versioning:

```bash
feat(auth): add OAuth2 login support
fix(api): prevent null pointer in user lookup
feat!: redesign API response format

BREAKING CHANGE: All responses now use JSON:API
```

### PR Size Guidelines

| Lines Changed | Rating | Review Time |
|---------------|--------|-------------|
| 1-150 | Excellent | 15-30 min |
| 150-250 | Good | 30-60 min |
| 250-500 | Acceptable | 1-2 hours |
| 500+ | Too Large | Split it |

### Security Hardening Pipeline

- Snyk dependency scanning
- CodeQL static analysis
- Semgrep SAST
- Gitleaks secret detection
- Batch hardening on integration branch

## Usage Examples

### Setting Up Branching Strategy

```
User: "Help me set up a branching strategy for our team of 5 developers"

Claude will reference the skill and recommend:
- EIB-TBD or Trunk-Based Development
- Branch naming conventions
- PR workflow configuration
- GitHub Actions templates
```

### Fixing Commit Messages

```
User: "How should I write commit messages for this feature?"

Claude will provide:
- Conventional Commits format
- Appropriate type (feat/fix/chore)
- Scope recommendations
- Breaking change notation
```

### Multi-Agent Coordination

```
User: "We have 3 AI agents working in parallel, how do we coordinate?"

Claude will explain:
- Agent branch naming
- Conflict prevention strategies
- Batch merge workflow
- Security hardening phases
```

## Research Sources

This skill synthesizes best practices from:

- [Atlassian Git Tutorials](https://www.atlassian.com/git/tutorials)
- [Trunk Based Development](https://trunkbaseddevelopment.com/)
- [Conventional Commits v1.0.0](https://www.conventionalcommits.org/)
- [GitHub Documentation](https://docs.github.com/)
- [Google Engineering Practices](https://google.github.io/eng-practices/)
- [Semantic Versioning](https://semver.org/)
- Industry practices from Google, Microsoft, Netflix, and Meta

## Contributing

To extend or modify this skill:

1. Keep SKILL.md under 500 lines
2. Add detailed content to resource files
3. Include practical code examples
4. Test trigger keywords
5. Update this README

## License

This skill is provided as part of the Claude Code skills showcase.
