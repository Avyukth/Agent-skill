# Pragmatic Code Review Framework

**Complementing Toyota Way with "Pragmatic Quality" for High-Velocity Teams**

This resource extends the Kaizen-Solaris review system with a pragmatic framework optimized for startup/high-velocity environments while maintaining rigor.

---

## Core Philosophy: Net Positive > Perfection

**Primary Objective:** Determine if a change *definitively improves* overall code health.

**Key Directives:**

1. **Net Positive Focus** - Do not block on imperfections if the change is a net improvement
2. **Substance Over Style** - Assume CI (linters, formatters) passed; focus on architecture, design, logic, security
3. **Grounded in Principles** - Base feedback on SOLID, DRY, KISS, YAGNI - not opinions
4. **Signal Intent** - Prefix optional suggestions with "**Nit:**"

---

## Hierarchical Review Checklist

Analyze changes using this prioritized framework:

### 1. Architectural Design & Integrity (Critical)

- [ ] Is design appropriate and aligned with existing architectural patterns?
- [ ] Is code appropriately modular? Does it adhere to Single Responsibility Principle?
- [ ] Does it introduce unnecessary complexity? Could simpler solution work?
- [ ] Is the PR atomic? (Single cohesive purpose, not bundling unrelated changes)
- [ ] Appropriate abstraction levels and separation of concerns?

### 2. Functionality & Correctness (Critical)

- [ ] Does code correctly achieve intended business logic?
- [ ] Are edge cases, error conditions, unexpected inputs handled gracefully?
- [ ] Any logical flaws, race conditions, or concurrency issues?
- [ ] Is state management and data flow correct?
- [ ] Idempotency where appropriate?

### 3. Security (Non-Negotiable)

- [ ] All user input validated, sanitized, escaped (XSS, SQLi, command injection)?
- [ ] Authentication/authorization checks on all protected resources?
- [ ] No hardcoded secrets, API keys, or credentials?
- [ ] Data exposure in logs, error messages, or API responses?
- [ ] CORS, CSP, and security headers where applicable?
- [ ] Cryptographic implementations use standard libraries?

### 4. Maintainability & Readability (High Priority)

- [ ] Code easy for future developers to understand and modify?
- [ ] Variable, function, class names descriptive and unambiguous?
- [ ] Control flow clear? (Analyze complex conditionals and nesting depth)
- [ ] Comments explain "why" (intent/trade-offs) not "what" (mechanics)?
- [ ] Error messages aid debugging?
- [ ] Code duplication that should be refactored?

### 5. Testing Strategy & Robustness (High Priority)

- [ ] Test coverage sufficient for complexity and criticality?
- [ ] Tests cover failure modes, security edge cases, error paths (not just happy path)?
- [ ] Test code itself clean, maintainable, efficient?
- [ ] Appropriate test isolation and mock usage?
- [ ] Missing integration/e2e tests for critical paths?

### 6. Performance & Scalability (Important)

**Backend:**
- [ ] Database queries efficient? N+1 query problems?
- [ ] Appropriate caching utilized?

**Frontend:**
- [ ] Bundle size impact? Core Web Vitals?

**API Design:**
- [ ] Contract clear, consistent, backwards-compatible?
- [ ] Robust error handling?

### 7. Dependencies & Documentation (Important)

- [ ] New third-party dependencies necessary and vetted?
- [ ] Relevant external documentation (API docs, READMEs) updated?

---

## Triage Matrix

Categorize every issue to help author prioritize:

| Category | Symbol | When to Use |
|----------|--------|-------------|
| **Critical/Blocker** | `[BLOCKER]` | Must fix before merge (security vulnerability, architectural regression) |
| **Improvement** | `[IMPROVEMENT]` | Strong recommendation for better implementation |
| **Nitpick** | `Nit:` | Minor polish, optional |

### Example Feedback Format

```markdown
### Code Review Summary
[Overall assessment and high-level observations]

### Findings

#### Critical Issues
- [BLOCKER] `src/auth.rs:42` - SQL query built with string concatenation allows injection. Use parameterized queries.

#### Suggested Improvements
- [IMPROVEMENT] `src/service.rs:128` - This function handles both validation and persistence. Consider splitting per SRP.

#### Nitpicks
- Nit: `src/utils.rs:15` - Variable name `x` could be more descriptive.
```

---

## GitHub Actions Integration

Automate code review with Claude Code Action:

### Basic Configuration

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
          track_progress: true
          prompt: |
            REPO: ${{ github.repository }}
            PR NUMBER: ${{ github.event.pull_request.number }}

            Perform code review focusing on:
            1. Code Quality - Clean code, error handling, maintainability
            2. Security - Vulnerabilities, input validation, auth
            3. Performance - Bottlenecks, queries, resources
            4. Testing - Coverage, edge cases, quality
            5. Documentation - Comments, README updates

            Use inline comments for specific issues.
            Use top-level comments for general observations.
            Reference CLAUDE.md for style conventions.

            Use `gh pr comment` to leave review as PR comment.

          claude_args: '--model claude-opus-4-1-20250805 --allowed-tools "Bash(gh pr comment:*),Bash(gh pr diff:*),Bash(gh pr view:*)"'
```

### Custom Pragmatic Review Configuration

```yaml
# .github/workflows/pragmatic-review.yml
name: Pragmatic Code Review

on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]

jobs:
  pragmatic-review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      id-token: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Pragmatic Code Review
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          track_progress: true
          prompt: |
            You are the Principal Engineer Reviewer enforcing "Pragmatic Quality":
            balance rigorous engineering with development speed.

            ### Directives
            1. Net Positive > Perfection - Don't block on imperfections if net improvement
            2. Focus on Substance - Architecture, design, logic, security (not style)
            3. Grounded in Principles - SOLID, DRY, KISS, YAGNI
            4. Signal Intent - Prefix optional with "**Nit:**"

            ### Hierarchical Checklist (Priority Order)
            1. Architectural Design & Integrity
            2. Functionality & Correctness
            3. Security (Non-Negotiable)
            4. Maintainability & Readability
            5. Testing Strategy
            6. Performance & Scalability
            7. Dependencies & Documentation

            ### Output
            - [BLOCKER] for must-fix
            - [IMPROVEMENT] for recommendations
            - Nit: for minor polish

            Use `gh pr comment` for review output.

          claude_args: '--model claude-opus-4-1-20250805'
```

---

## Slash Command for On-Demand Review

Create `/review` command for local code review:

```markdown
---
allowed-tools: Bash, Glob, Grep, Read, TodoWrite
description: Conduct comprehensive code review of pending changes
---

You are the Principal Engineer AI Reviewer enforcing "Pragmatic Quality".

GIT STATUS:
!`git status`

FILES MODIFIED:
!`git diff --name-only origin/HEAD...`

COMMITS:
!`git log --no-decorate origin/HEAD...`

DIFF CONTENT:
!`git diff --merge-base origin/HEAD`

Review using the Hierarchical Review Framework:
1. Architecture (Critical)
2. Functionality (Critical)
3. Security (Non-Negotiable)
4. Maintainability (High)
5. Testing (High)
6. Performance (Important)
7. Dependencies (Important)

Output format:
- [BLOCKER] for critical issues
- [IMPROVEMENT] for recommendations
- Nit: for minor suggestions
```

---

## Integration with Toyota Way

The Pragmatic Framework complements Toyota Way principles:

| Pragmatic Concept | Toyota Way Equivalent |
|-------------------|----------------------|
| Net Positive > Perfection | Kaizen (continuous improvement) |
| Hierarchical Priority | Jidoka (critical issues first) |
| [BLOCKER] category | Stop-the-line quality |
| Assume good intent | Respect for People |
| Explain "why" | Nemawashi (build understanding) |
| Substance over style | Genchi Genbutsu (real issues) |

**Combined Approach:**

- Use Pragmatic Framework for **day-to-day velocity**
- Apply full Toyota Way rigor for **safety-critical code**
- Both share: assume good intent, explain rationale, distinguish severity

---

## Communication Principles

### DO:
- Describe problems and their impact
- Provide specific, actionable suggestions
- Explain the underlying engineering principle
- Start with positive acknowledgment
- Be constructive and concise

### DON'T:
- Prescribe technical solutions (let author choose)
- Comment on style if CI handles it
- Block on theoretical issues
- Flood with low-value feedback
- Assume negative intent

### Example: Good vs Bad Feedback

**Bad:**
> Change margin to 16px

**Good:**
> The spacing feels inconsistent with adjacent elements, creating visual clutter. Consider aligning with the 8px spacing grid used elsewhere.

**Bad:**
> This is wrong

**Good:**
> [IMPROVEMENT] This query could cause N+1 issues at scale. Consider eager loading the association or batching queries.

---

## Related Resources

- [review-process.md](review-process.md) - Full Nemawashi workflow
- [checklists.md](checklists.md) - Ready-to-use review checklists
- [continuous-improvement.md](continuous-improvement.md) - Kaizen practices

---

**Balance rigor with velocity. Ship improvements, not perfection.**
