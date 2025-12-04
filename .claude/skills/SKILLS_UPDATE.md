# Skills Update - December 2024

## Major Update: PAIML Integration & Extreme TDD Workflow ✨

This update introduces comprehensive integration with the PAIML MCP Agent Toolkit and adds Extreme TDD workflow support for Rust development.

---

## New Skills Added

### 1. PAIML MCP Toolkit (`paiml-mcp-toolkit`)

**Location**: `.claude/skills/paiml-mcp-toolkit/`

**Purpose**: Integrate PMAT (Pragmatic AI Labs MCP Agent Toolkit) for deterministic code quality analysis

**Key Features**:
- ✅ Technical Debt Grading (TDG) - A+ to F scoring
- ✅ Rust Project Score (0-211 points comprehensive scoring)
- ✅ Toyota Way Quality Gates (Jidoka, Kaizen)
- ✅ MCP server configuration for Claude Desktop
- ✅ Mutation testing integration

**Auto-Activation**:
- Keywords: pmat, paiml, mcp server, technical debt grading, rust project score (25+ total)
- Intent patterns: Install/setup/configure PMAT, analyze quality, run mutation testing
- File triggers: `**/Cargo.toml`, `**/*.rs`, `**/pmat.toml`

**Files**:
- `SKILL.md` (~400 lines) - Main skill guidance
- `resources/rust-score-criteria.md` - Complete 211-point scoring breakdown
- `resources/toyota-way-gates.md` - Jidoka/Kaizen implementation
- `resources/mcp-configuration.md` - Claude Desktop MCP setup

**Compliance**: ✅ Meta-skill verified, <500 lines, progressive disclosure

---

### 2. Kaizen-Solaris Review (`kaizen-solaris-review`)

**Location**: `.claude/skills/kaizen-solaris-review/`

**Purpose**: Unified Rust code review combining Solaris-Class technical excellence with Toyota Way continuous improvement

**Key Features**:
- ✅ Memory safety review (zero unsafe tolerance)
- ✅ Toyota Way principles (Nemawashi, Genchi Genbutsu, Hansei)
- ✅ Quality gates with PMAT integration
- ✅ Comprehensive review checklists

**Auto-Activation**:
- Keywords: code review, rust review, kaizen, toyota way, solaris class, memory safety
- Intent patterns: Review Rust code, implement Toyota Way, check quality
- File triggers: `**/*.rs`, `**/Cargo.toml`, GitHub workflow files

---

## Existing Skills Updated

### rust-skills (Major Update)

**Added**:
- **Extreme TDD Workflow** - RED-GREEN-REFACTOR cycle with atomic commits
- **PAIML MCP Integration** - TDG, Rust Project Score, quality gates
- New resource: `resources/extreme-tdd-workflow.md`

**Extreme TDD Features**:
- RED phase: Write failing tests first
- GREEN phase: Minimal implementation to pass
- REFACTOR phase: Meet quality gates (Coverage ≥85%, Mutation ≥80%, TDG A/B)
- Atomic commits with squash workflow
- CI/CD integration with quality gates

**New Keywords Added to skill-rules.json**:
- extreme tdd, red green refactor, tdd rust
- test driven development, mutation testing
- cargo mutants, property based testing, proptest
- cargo tarpaulin, code coverage rust
- quality gate rust, atomic commits

---

### production-hardening-backend

**Added**:
- PAIML security analysis integration
- Cargo audit/deny references with PMAT

---

### production-hardening-frontend

**Added**:
- PMAT polyglot reference for multi-language analysis

---

### sveltekit-pwa-skills

**Added**:
- Quality analysis integration with PMAT

---

## Project Skills Summary

**Total Skills**: 16+

1. skill-developer
2. backend-dev-guidelines
3. frontend-dev-guidelines
4. route-tester
5. error-tracking
6. production-hardening-frontend
7. production-hardening-backend
8. rust-skills (+ Extreme TDD)
9. sveltekit-pwa-skills
10. mobile-frontend-design
11. prd
12. c4-architecture
13. paiml-mcp-toolkit
14. kaizen-solaris-review
15. git-workflow-mastery
16. **deploy-pulumi-argocd-canary** (NEW - Dec 2025)

---

## Usage Examples

### Extreme TDD Workflow

```
"I'm implementing a new user service in Rust. Help me follow the
RED-GREEN-REFACTOR workflow with proper atomic commits."
```

### PAIML Quality Analysis

```
"Run PMAT analysis on this Rust project and calculate the
Rust Project Score. Check if we meet the quality gates."
```

### Kaizen Code Review

```
"Review this Rust PR following Toyota Way principles. Check for
memory safety, zero warnings policy, and continuous improvement."
```

### Kubernetes Deployment with Canary

```
"Deploy my Rust Axum backend to GKE with canary releases using
Pulumi Go and ArgoCD. Include Prometheus-based analysis."
```

---

## Installation Notes

- ✅ All skills installed to `.claude/skills/`
- ✅ Skills copied to global `~/.claude/skills/`
- ✅ `skill-rules.json` updated with all new triggers
- ✅ README.md updated with new skill count (13+)
- ✅ CLAUDE_INTEGRATION_GUIDE.md updated

---

## Quality Gate Reference

| Metric | Threshold | Tool |
|--------|-----------|------|
| Coverage | ≥85% | `cargo tarpaulin` |
| Mutation Score | ≥80% | `pmat mutate` / `cargo mutants` |
| TDG Grade | A or B | `pmat analyze tdg` |
| Clippy | Zero warnings | `cargo clippy -- -D warnings` |
| Repo Score | ≥150/211 | `pmat repo-score` |

---

## Commit Message Format (TDD)

```
[PHASE] TICKET-ID: Short description

- What was done
- Why it was done

Coverage: XX% | Mutation: XX% | Grade: X
```

Phases: `[RED]`, `[GREEN]`, `[REFACTOR]`

---

**Date**: December 4, 2024
**Status**: Production-ready
**Previous Update**: November 18, 2024 (PRD, C4 Architecture)

*This update brings deterministic quality analysis and disciplined TDD workflow to Rust development in the claude-code-infrastructure-showcase project.*
