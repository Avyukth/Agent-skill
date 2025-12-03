---
name: paiml-mcp-toolkit
description: Comprehensive integration guide for PAIML (Pragmatic AI Labs) MCP tools including PMAT, deterministic agents, and organizational intelligence. Use when analyzing Rust code quality via Technical Debt Grading (TDG), calculating Rust Project Score (0-211), running mutation testing, implementing deterministic FSM-based agents, enforcing Toyota Way quality gates, or integrating MCP servers with Claude. Covers cargo install pmat, MCP server configuration, zero-configuration analysis, semantic code search, and extreme TDD workflows.
---

# PAIML MCP Agent Toolkit Integration

**Deterministic AI-assisted Rust development via Model Context Protocol**

## Purpose

This skill provides comprehensive integration patterns for the Pragmatic AI Labs (PAIML) ecosystem with Claude AI. PAIML tools enforce **deterministic**, **quality-focused**, and **Toyota Way-aligned** workflows for Rust development through the Model Context Protocol (MCP).

## When to Use This Skill

Automatically activates when:
- Analyzing Rust code quality with TDG (Technical Debt Grading)
- Calculating Rust Project Score (0-211 scale)
- Running mutation testing for test quality validation
- Setting up MCP servers for Claude integration
- Implementing deterministic FSM-based agents
- Enforcing quality gates in CI/CD pipelines
- Using semantic code search for large codebases
- Applying Toyota Way principles to software development

---

## Core Tools Overview

| Tool | Purpose | Key Command |
|------|---------|-------------|
| **PMAT** | MCP server toolkit for deterministic analysis | `pmat mcp` |
| **deterministic-mcp-agents** | FSM-based agent development | `cargo run --bin mcp-server` |
| **PDMT** | Logic-less templating with quality gates | Library integration |
| **rust-mcp-sdk** | JSON-RPC 2.0 MCP implementation | `cargo add rust-mcp-sdk` |

---

## Quick Start: Installation

### Prerequisites

```bash
# Rust 1.80+ required
rustup update stable
rustc --version  # Should be >= 1.80.0
```

### Install PMAT (Core Toolkit)

```bash
# From crates.io (recommended)
cargo install pmat

# Verify installation
pmat --version  # Should show v2.20+
```

### Install Supporting Tools

```bash
# Deterministic agents course/examples
git clone https://github.com/paiml/deterministic-mcp-agents
cd deterministic-mcp-agents && make install-dev

# Organizational intelligence plugin
git clone https://github.com/paiml/organizational-intelligence-plugin
cd organizational-intelligence-plugin && cargo build --release

# MCP SDK for custom agents
cargo add rust-mcp-sdk
```

---

## Claude Desktop MCP Configuration

Configure Claude Desktop to connect to PMAT as an MCP server:

**Configuration File Locations:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**Configuration Payload:**

```json
{
  "mcpServers": {
    "pmat": {
      "command": "pmat",
      "args": ["mcp"],
      "env": {
        "RUST_LOG": "info"
      }
    },
    "ruchy": {
      "command": "ruchy",
      "args": ["mcp"]
    },
    "depyler": {
      "command": "depyler",
      "args": ["agent", "start", "--foreground"]
    }
  }
}
```

After saving, restart Claude Desktop. Look for the plug icon indicating active MCP connections.

---

## Technical Debt Grading (TDG)

PMAT provides a nuanced **A+ to F** grading system based on six orthogonal metrics:

| Metric | Description | Weight |
|--------|-------------|--------|
| **Structural Complexity** | Cyclomatic complexity (CFG analysis) | High |
| **Semantic Complexity** | Cognitive complexity (nesting, flow breaks) | High |
| **Code Duplication** | Token-based clone detection | Medium |
| **Coupling Analysis** | Fan-in/Fan-out metrics | Medium |
| **Documentation Coverage** | Rustdoc compliance scoring | Medium |
| **Consistency Analysis** | Naming and style uniformity | Low |

### Running TDG Analysis

```bash
# Analyze current directory
pmat analyze tdg

# Analyze specific path with JSON output
pmat analyze tdg --path src/ --format json

# Full repository analysis
pmat analyze tdg --full
```

### Zero SATD Policy

PMAT enforces **Zero Self-Admitted Technical Debt**:

```rust
// These trigger TDG violations:
// TODO: fix this later
// FIXME: temporary hack
// HACK: workaround for X
// XXX: needs refactoring

// Instead, create tracked issues and reference them:
// See: https://github.com/org/repo/issues/123
```

---

## Rust Project Score (0-211)

The Rust Project Score is a comprehensive, evidence-based scoring system inspired by elite Rust projects (tokio, serde, clap, syn, regex).

### Score Breakdown

| Category | Max Points | Key Criteria |
|----------|------------|--------------|
| **Rust Tooling & CI/CD** | 130 | Workflows, metadata, lints, clippy, MSRV |
| **Code Quality** | 26 | Unsafe docs, mutation testing, complexity |
| **Testing Excellence** | 20 | Coverage >=85%, mutation, integration, doc tests |
| **Documentation** | 15 | Rustdoc coverage, README, changelog |
| **Dependency Health** | 12 | Count, feature flags, tree pruning |
| **Performance** | 10 | Criterion benchmarks, CI benchmarks |
| **Bonus: Formal Verification** | 8 | Kani, Prusti evidence |

### Running Score Analysis

```bash
# Full Rust project score
pmat repo-score --full

# JSON output for CI integration
pmat repo-score --format json

# Specific category analysis
pmat repo-score --category testing
```

### CI/CD Integration

```yaml
# .github/workflows/quality.yml
name: Quality Gate
on: [push, pull_request]

jobs:
  pmat-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install PMAT
        run: cargo install pmat
      - name: Run Quality Analysis
        run: |
          pmat repo-score --format json > score.json
          SCORE=$(jq '.total_score' score.json)
          if [ "$SCORE" -lt 150 ]; then
            echo "Quality score $SCORE below threshold 150"
            exit 1
          fi
```

---

## Mutation Testing

Mutation testing validates test quality by injecting faults and checking if tests catch them:

```bash
# Run mutation testing on src/
pmat mutate --target src/ --threshold 85

# Verbose output with surviving mutants
pmat mutate --target src/ --verbose

# Integration with cargo-mutants
cargo install cargo-mutants
cargo mutants --output target/mutants
```

### Interpreting Results

| Mutation Score | Assessment |
|----------------|------------|
| >= 90% | Excellent test quality |
| 80-89% | Good, minor gaps |
| 70-79% | Acceptable, needs improvement |
| < 70% | Poor, significant test gaps |

---

## Deterministic FSM Agents

PAIML's deterministic agents use Finite State Machines (FSMs) to ensure predictable AI behavior:

### FSM Architecture

```rust
use pdmt::fsm::{State, Transition, StateMachine};

// Define states
enum CodeReviewState {
    Initial,
    Parsing,
    Analyzing,
    Reporting,
    Complete,
}

// Define transitions with guards
impl StateMachine for CodeReviewAgent {
    fn transition(&mut self, input: &Input) -> Result<State> {
        match (&self.state, input) {
            (Initial, StartReview) => {
                // Guard: file must exist
                if !input.file.exists() {
                    return Err(Error::FileNotFound);
                }
                Ok(Parsing)
            }
            (Parsing, ParseComplete(ast)) => {
                self.ast = Some(ast);
                Ok(Analyzing)
            }
            // ... other transitions
        }
    }
}
```

### Key Benefits

- **Determinism**: Same input always produces same output
- **Testability**: Each state/transition can be unit tested
- **Observability**: State transitions can be logged/traced
- **Safety**: Invalid transitions rejected at compile time

---

## Toyota Way Quality Gates

PMAT implements Toyota Production System principles as software quality gates:

### Andon Cord (Stop-the-Line)

```bash
# Pre-commit quality gate
pmat quality-gate --strict

# Blocks commit if:
# - Cyclomatic complexity > 20
# - Documentation coverage < 80%
# - Any SATD detected
# - Clippy warnings present
```

### Jidoka (Automation with Human Touch)

```toml
# .pmat/config.toml
[quality_gates]
max_complexity = 20
min_doc_coverage = 80
zero_satd = true
zero_warnings = true

[automation]
# Auto-fix what can be fixed
auto_format = true
auto_clippy_fix = true
# Stop for human review
require_review = ["unsafe", "security", "api_change"]
```

### Kaizen (Continuous Improvement)

```bash
# Track quality over time
pmat metrics --since "1 month ago" --format chart

# Compare branches
pmat compare --base main --head feature-branch

# Quality archaeology
pmat history --file src/lib.rs --metric complexity
```

---

## Semantic Code Search

PMAT provides AI-ready semantic search using embeddings:

```bash
# Search for patterns
pmat semantic search "error handling patterns"

# Find similar code
pmat semantic similar --file src/auth.rs --function validate

# Generate context for Claude
pmat context --format llm-optimized > context.md
```

### Deep Context Generation

```bash
# Generate curated context for AI consumption
pmat context --format llm-optimized \
  --include "architecture,interfaces,critical-paths" \
  --exclude "tests,generated"
```

This produces high-signal, low-noise context that prevents the "lost in the middle" phenomenon in LLM prompts.

---

## Extreme TDD Workflow

PAIML advocates for Extreme Test-Driven Development:

### Phase 1: Red (Test Generation)

```bash
# Generate test scaffolding with PMAT prompts
pmat prompt tdd-start --module user_auth

# Claude generates tests FIRST using property-based testing
# Tests define the contract before implementation
```

### Phase 2: Green (Implementation with Gates)

```bash
# Quality gate validates implementation
pmat quality-gate --on-change

# Blocks if:
# - Tests don't pass
# - Coverage drops
# - Complexity exceeds limit
```

### Phase 3: Refactor (Optimization)

```bash
# Check score improvement opportunities
pmat repo-score --suggestions

# Apply safe refactorings
pmat refactor --safe-only
```

---

## MCP Tool Reference

PMAT exposes 19 tools via MCP:

| Tool | Purpose |
|------|---------|
| `analyze_tdg` | Technical Debt Grading |
| `repo_score` | Repository health score |
| `rust_project_score` | Rust-specific 0-211 score |
| `analyze_complexity` | Function-level complexity |
| `semantic_search` | AI-driven code discovery |
| `get_quality_status` | Quick health check |
| `mutate` | Mutation testing |
| `context_generate` | LLM-optimized context |
| `quality_gate` | Pre-commit validation |
| `refactor_start` | Safe refactoring session |
| `dependency_audit` | Security vulnerability check |
| `coverage_report` | Test coverage analysis |

---

## Integration with Existing Skills

### With rust-skills

```bash
# Validate Rust patterns against PMAT standards
pmat analyze tdg --rust-patterns

# Check BMC pattern compliance
pmat pattern-check --pattern bmc
```

### With production-hardening-backend

```bash
# Security-focused analysis
pmat analyze security --nist-mapping

# Combine with cargo-audit
cargo audit && pmat repo-score --category security
```

### With kaizen-solaris-review

```bash
# Toyota Way metrics
pmat metrics --kaizen

# Quality archaeology for retrospectives
pmat history --since "last sprint" --format report
```

---

## Troubleshooting

### Connection Issues

```bash
# Check MCP server status
pmat mcp --health

# Enable verbose logging
RUST_LOG=debug pmat mcp

# Test connection manually
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | pmat mcp --stdio
```

### Analysis Failures

```bash
# Verify project structure
pmat diagnose --project .

# Check for unsupported patterns
pmat analyze --verbose 2>&1 | grep -i warning
```

### Performance Issues

```bash
# Use incremental analysis
pmat analyze --incremental

# Limit scope
pmat analyze --path src/core/ --depth 2
```

---

## Resource Files

| Resource | Purpose |
|----------|---------|
| [installation.md](resources/installation.md) | Detailed installation guide |
| [mcp-configuration.md](resources/mcp-configuration.md) | MCP setup and troubleshooting |
| [tdg-reference.md](resources/tdg-reference.md) | Complete TDG metric documentation |
| [rust-score-criteria.md](resources/rust-score-criteria.md) | 211-point scoring breakdown |
| [fsm-patterns.md](resources/fsm-patterns.md) | Deterministic agent design |
| [toyota-way-gates.md](resources/toyota-way-gates.md) | Quality gate implementation |
| [workflow-examples.md](resources/workflow-examples.md) | End-to-end workflow guides |

---

## Related Skills

- **rust-skills** - Core Rust development patterns
- **production-hardening-backend** - Security and resilience
- **kaizen-solaris-review** - Code review and Toyota Way

---

**Version**: 1.0
**Last Updated**: 2025-12-03
**Status**: Production-Ready
**Ecosystem**: PAIML v2.20+, MCP 1.0
