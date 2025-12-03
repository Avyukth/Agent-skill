# Toyota Way Quality Gates Implementation

Implementing Toyota Production System (TPS) principles as software quality gates ensures deterministic, high-quality Rust development.

---

## Core Toyota Way Principles in Software

### 1. Jidoka (Automation with Human Touch)

**Concept**: Stop the production line when a defect is detected.

**Software Implementation**:

```bash
# Pre-commit hook that stops on quality issues
#!/bin/bash
# .git/hooks/pre-commit

set -e

echo "Running Jidoka quality gate..."

# Stop the line for formatting issues
if ! cargo fmt -- --check; then
    echo "JIDOKA: Formatting violation detected. Stopping commit."
    echo "Run 'cargo fmt' to fix."
    exit 1
fi

# Stop the line for linting issues
if ! cargo clippy -- -D warnings; then
    echo "JIDOKA: Clippy warning detected. Stopping commit."
    exit 1
fi

# Stop the line for test failures
if ! cargo test --quiet; then
    echo "JIDOKA: Test failure detected. Stopping commit."
    exit 1
fi

# Stop the line for security vulnerabilities
if ! cargo audit --quiet; then
    echo "JIDOKA: Security vulnerability detected. Stopping commit."
    exit 1
fi

echo "Jidoka gate passed. Proceeding with commit."
```

### 2. Kaizen (Continuous Improvement)

**Concept**: Small, incremental improvements over time.

**Software Implementation**:

```toml
# .pmat/kaizen-config.toml

[metrics]
# Track these metrics over time
track = ["complexity", "coverage", "debt_score", "build_time"]

[thresholds]
# Ratchet: quality can only improve
complexity_max = 15  # Lower each sprint
coverage_min = 85    # Raise each sprint
debt_score_max = "B" # Improve grade each quarter

[improvement]
# Required improvement per sprint
complexity_delta = -1
coverage_delta = 2
```

```bash
# Check for Kaizen progress
pmat kaizen-check --since "last sprint"

# Output:
# Complexity: 12 → 11 (IMPROVED)
# Coverage: 86% → 88% (IMPROVED)
# Debt Score: B+ → A- (IMPROVED)
# Build Time: 45s → 42s (IMPROVED)
```

### 3. Genchi Genbutsu (Go and See)

**Concept**: Understand problems by observing them directly.

**Software Implementation**:

```bash
# Don't just read code on GitHub - run it locally
git checkout feature-branch

# Run the actual tests
cargo test

# Run with instrumentation to see actual behavior
RUST_LOG=trace cargo run

# Profile actual performance
cargo bench

# Use debugger to understand flow
rust-lldb target/debug/myapp
```

**Code Review Requirement**:

```markdown
## PR Review Checklist (Genchi Genbutsu)

- [ ] I checked out and ran the code locally
- [ ] I ran the test suite myself
- [ ] I tested the feature manually
- [ ] I verified performance claims with benchmarks
- [ ] I read the actual implementation, not just the diff
```

### 4. Nemawashi (Consensus Building)

**Concept**: Build consensus before implementation.

**Software Implementation**:

```markdown
## RFC Template (Nemawashi Process)

### Summary
One paragraph explanation of the change.

### Motivation
Why are we doing this?

### Design
Detailed design explanation.

### Alternatives Considered
What other approaches were considered and why were they rejected?

### Impact Assessment
- [ ] Breaking changes?
- [ ] Performance impact?
- [ ] Security implications?
- [ ] Documentation needs?

### Reviewers
Required approvals from:
- [ ] Architecture team
- [ ] Security team (if applicable)
- [ ] Performance team (if applicable)
- [ ] Affected team leads
```

### 5. Heijunka (Level the Workload)

**Concept**: Avoid overburden (muri), unevenness (mura), and waste (muda).

**Software Implementation**:

```yaml
# .github/workflows/balanced-load.yml
name: Balanced PR Processing

on:
  pull_request:
    types: [opened, ready_for_review]

jobs:
  enforce-pr-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check PR Size (Heijunka)
        run: |
          LINES_CHANGED=$(git diff --numstat origin/main...HEAD | awk '{s+=$1+$2} END {print s}')

          if [ "$LINES_CHANGED" -gt 500 ]; then
            echo "HEIJUNKA VIOLATION: PR has $LINES_CHANGED lines changed."
            echo "Maximum allowed: 500 lines."
            echo "Please break into smaller, reviewable PRs."
            exit 1
          fi

          if [ "$LINES_CHANGED" -gt 300 ]; then
            echo "WARNING: PR has $LINES_CHANGED lines. Consider breaking down."
          fi

          echo "PR size acceptable: $LINES_CHANGED lines."
```

---

## Quality Gate Implementation

### Gate 1: Format Gate (Poka-Yoke)

Poka-Yoke = mistake-proofing. Prevent errors before they happen.

```rust
// rustfmt.toml
edition = "2021"
max_width = 100
tab_spaces = 4
newline_style = "Unix"
use_small_heuristics = "Max"

// Enforced: No manual formatting decisions
```

### Gate 2: Lint Gate (Andon)

Andon = visual signal to stop the line.

```toml
# Cargo.toml
[lints.clippy]
all = "deny"
pedantic = "deny"
nursery = "warn"
cargo = "warn"

# Specific safety-critical lints
unwrap_used = "deny"
expect_used = "deny"
panic = "deny"
```

### Gate 3: Test Gate (100% Pass Required)

```bash
# No partial passes - all or nothing
cargo test --no-fail-fast 2>&1 | tee test-results.log

if grep -q "FAILED" test-results.log; then
    echo "QUALITY GATE FAILED: Tests must have 100% pass rate"
    exit 1
fi
```

### Gate 4: Coverage Gate (Threshold Ratchet)

```bash
# Coverage can only go up, never down
PREVIOUS_COVERAGE=$(cat .coverage-baseline || echo "0")
CURRENT_COVERAGE=$(cargo tarpaulin --out json | jq '.coverage')

if (( $(echo "$CURRENT_COVERAGE < $PREVIOUS_COVERAGE" | bc -l) )); then
    echo "KAIZEN VIOLATION: Coverage decreased from $PREVIOUS_COVERAGE% to $CURRENT_COVERAGE%"
    exit 1
fi

echo "$CURRENT_COVERAGE" > .coverage-baseline
```

### Gate 5: Complexity Gate (Bounded)

```bash
# No function exceeds complexity threshold
pmat analyze complexity --max 15

# Fails if any function has cyclomatic complexity > 15
```

### Gate 6: Security Gate (Zero Vulnerabilities)

```bash
# Run security audit chain
cargo audit || exit 1
cargo deny check || exit 1
cargo vet || exit 1
cargo geiger --quiet || echo "WARNING: Unsafe code detected"
```

---

## CI/CD Pipeline Integration

```yaml
# .github/workflows/toyota-way-gates.yml
name: Toyota Way Quality Gates

on:
  push:
    branches: [main, develop]
  pull_request:

env:
  RUSTFLAGS: "-D warnings"
  CARGO_TERM_COLOR: always

jobs:
  # Gate 1: Poka-Yoke (Format)
  format-gate:
    name: "Gate 1: Format (Poka-Yoke)"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cargo fmt -- --check

  # Gate 2: Andon (Lints)
  lint-gate:
    name: "Gate 2: Lint (Andon)"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cargo clippy -- -D warnings

  # Gate 3: Test (100% Pass)
  test-gate:
    name: "Gate 3: Test (Zero Defects)"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cargo test --no-fail-fast

  # Gate 4: Coverage (Kaizen Ratchet)
  coverage-gate:
    name: "Gate 4: Coverage (Kaizen)"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: taiki-e/install-action@cargo-tarpaulin
      - run: cargo tarpaulin --out xml
      - name: Check coverage threshold
        run: |
          COVERAGE=$(cargo tarpaulin --out json 2>/dev/null | jq -r '.coverage // 0')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% below 80% threshold"
            exit 1
          fi

  # Gate 5: Complexity (Bounded)
  complexity-gate:
    name: "Gate 5: Complexity (Bounded)"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cargo install pmat
      - run: pmat analyze complexity --max 20

  # Gate 6: Security (Zero Vulnerabilities)
  security-gate:
    name: "Gate 6: Security (Jidoka)"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cargo install cargo-audit cargo-deny
      - run: cargo audit
      - run: cargo deny check

  # Final Gate: All must pass
  all-gates:
    name: "All Gates Passed"
    needs: [format-gate, lint-gate, test-gate, coverage-gate, complexity-gate, security-gate]
    runs-on: ubuntu-latest
    steps:
      - run: echo "All Toyota Way quality gates passed!"
```

---

## Metrics Dashboard (Kaizen Tracking)

```bash
# Generate Kaizen metrics report
pmat metrics kaizen --format markdown > KAIZEN_REPORT.md
```

**Example Report**:

```markdown
# Kaizen Metrics Report

## Sprint 42 (2025-12-03)

### Quality Trend (Last 6 Sprints)

| Sprint | Complexity | Coverage | Debt Grade | Build Time |
|--------|------------|----------|------------|------------|
| 37     | 18         | 78%      | C+         | 58s        |
| 38     | 17         | 80%      | B-         | 55s        |
| 39     | 16         | 82%      | B          | 52s        |
| 40     | 15         | 84%      | B+         | 48s        |
| 41     | 14         | 86%      | A-         | 45s        |
| 42     | 13         | 88%      | A          | 42s        |

### Kaizen Achievement

- Complexity: -5 (28% improvement)
- Coverage: +10% (13% improvement)
- Debt Grade: C+ → A (4 grade improvement)
- Build Time: -16s (28% faster)

### Next Sprint Targets

- Complexity: 12 (-1)
- Coverage: 90% (+2%)
- Debt Grade: A+ (maintain or improve)
- Build Time: 40s (-2s)
```

---

## Five Whys for Root Cause Analysis

When a quality gate fails, apply Five Whys:

```markdown
## Incident: Test Failure in CI

**Problem**: Integration test `test_user_auth` failed in CI

**Why 1**: The test timed out waiting for database connection
**Why 2**: Database pool was exhausted
**Why 3**: Previous test didn't clean up connections
**Why 4**: Test teardown wasn't implemented for that test
**Why 5**: No test framework enforcing cleanup

**Root Cause**: Missing test infrastructure for resource cleanup

**Countermeasure**:
- Implement Drop-based cleanup in test fixtures
- Add CI check for connection leak detection
- Update test guidelines
```

---

## Related Resources

- [Kaizen-Solaris Review](../../kaizen-solaris-review/SKILL.md) - Full Toyota Way code review system
- [Production Hardening](../../production-hardening-backend/SKILL.md) - Security quality gates
