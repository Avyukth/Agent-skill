---
name: kaizen-solaris-code-review
description: Unified Rust code review system combining Solaris-Class technical excellence with Toyota Way continuous improvement philosophy. Use when conducting code reviews, establishing review processes, implementing quality gates, or hardening Rust projects for safety-critical production. Covers memory safety (zero unsafe tolerance), comprehensive testing (100% coverage, property-based, fuzzing), security hardening (cargo-audit, supply chain), static analysis (zero warnings), error handling discipline, and human-centered review processes emphasizing Kaizen (continuous improvement), Nemawashi (consensus building), Jidoka (stop-the-line quality), Genchi Genbutsu (go and see), and respect for people.
---

# Kaizen-Solaris Rust Code Review System

**Unified review framework for technical excellence and sustainable teams**

## Purpose

This skill establishes a comprehensive code review system that achieves both **uncompromising technical rigor** and **human-centered sustainable practices**. By combining Solaris-Class quality standards with Toyota Way philosophy, it creates reviews that produce safety-critical quality software while respecting people and fostering continuous improvement.

## When to Use This Skill

Automatically activates when:
- Conducting code reviews for Rust projects
- Establishing or improving code review processes
- Implementing quality gates and CI/CD checks
- Reviewing unsafe code blocks
- Evaluating test coverage and testing strategies
- Assessing security posture and dependencies
- Setting up static analysis pipelines
- Training teams on review best practices
- Performing post-incident retrospectives
- Planning refactoring or technical debt work

---

## Core Philosophy: Two Pillars

### Pillar 1: Continuous Improvement (Kaizen) 🎯

Systems and code are never finished. Every review is an opportunity to:
- Learn and improve processes
- Prevent future defects
- Challenge with courage and creativity
- Drive toward perfection (as an asymptotic goal)

**Key Insight:** The right process produces the right results.

### Pillar 2: Respect for People 🤝

Code review is collaboration, not gatekeeping. Reviews should:
- Build understanding and mutual trust
- Take responsibility collectively
- Balance rigor with sustainable workloads
- Develop both excellent code AND excellent engineers

**Key Insight:** Burned-out teams cannot produce reliable software.

---

## Quick Start: Essential Checklists

### Pre-Review Checklist (Reviewer Preparation)

Before reviewing any code:

- [ ] **Understand context** - Read the PR description and linked issues
- [ ] **Check out locally** - Don't just read on GitHub (Genchi Genbutsu)
- [ ] **Run the code** - Verify it works as advertised
- [ ] **Run tests** - Ensure all tests pass locally
- [ ] **Check CI** - Review all automated checks
- [ ] **Set aside time** - Allow proper review time (15-30 min per 300 lines)

### Critical Safety Review (Zero Tolerance Items)

These MUST be addressed before merging:

- [ ] **No unsafe without SAFETY comments** - Every unsafe block documented
- [ ] **No unwrap/expect in production** - Proper error handling
- [ ] **All tests passing** - 100% pass rate required
- [ ] **Zero compiler warnings** - `RUSTFLAGS="-D warnings"`
- [ ] **Zero clippy warnings** - All lint groups enabled
- [ ] **cargo-audit clean** - No known vulnerabilities
- [ ] **Input validation** - All external input validated
- [ ] **Documented panics** - All panic conditions in `# Panics` sections

### Human-Centered Review Checklist

Balance rigor with respect:

- [ ] **Assume good intent** - Ask questions, don't command
- [ ] **Explain why** - Share knowledge, don't just point out issues
- [ ] **Distinguish severity** - Must-fix vs nice-to-have
- [ ] **Praise good code** - Acknowledge thoughtful solutions
- [ ] **Review timely** - Within 24 hours for normal PRs
- [ ] **Size appropriately** - PRs should be ~300 lines (max 500)

---

## The Technical Foundation

### 1. Memory Safety & Correctness

**Zero Unsafe Code Tolerance** (except at boundaries):

```rust
// ✅ GOOD: Default stance for application code
#![forbid(unsafe_code)]

// ✅ WHEN NECESSARY: Unsafe with SAFETY comments
unsafe {
    // SAFETY: This is safe because:
    // 1. The pointer is guaranteed non-null (from Box::into_raw)
    // 2. We own the allocation exclusively
    // 3. The alignment and size are correct for T
    Box::from_raw(ptr)
}
```

**Key Requirements:**
- `#![forbid(unsafe_code)]` for all application code
- Unsafe review group approval for all unsafe code
- Run Miri on unsafe code in CI/CD
- Minimize unsafe scope with safe public APIs

**See [memory-safety.md](resources/memory-safety.md) for complete details.**

### 2. Comprehensive Testing

**Multi-Layer Testing Strategy:**

1. **Unit Testing** - 100% line coverage for production code
2. **Property-Based Testing** - Use proptest/quickcheck for algorithms
3. **Documentation Testing** - All examples compile and run
4. **Fuzzing** - Coverage-guided fuzzing for input handlers
5. **Integration Testing** - Real usage patterns in tests/
6. **Formal Verification** - Kani/Prusti for critical components

```rust
// ✅ GOOD: Comprehensive test coverage
#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    #[test]
    fn test_happy_path() { /* ... */ }

    #[test]
    fn test_error_path() { /* ... */ }

    proptest! {
        #[test]
        fn test_property(input in any::<ValidInput>()) {
            // Property must hold for all valid inputs
            assert!(invariant_holds(&input));
        }
    }
}
```

**See [testing-strategy.md](resources/testing-strategy.md) for complete testing guide.**

### 3. Security Hardening

**Supply Chain Security:**

```bash
# Required in CI/CD
cargo vet      # Audit dependencies
cargo audit    # Check RustSec database
cargo deny     # Enforce licensing/policy
cargo geiger   # Detect unsafe in deps
```

**Cryptographic Practices:**
- Use vetted libraries (ring, RustCrypto, sodiumoxide)
- Constant-time operations for crypto comparisons
- Use `zeroize` crate for sensitive data
- Never roll custom cryptography

**See [security-hardening.md](resources/security-hardening.md) for defense-in-depth practices.**

### 4. Code Quality Standards

**Function Complexity Limits:**
- Functions ≤60 lines (fit on one screen)
- Cyclomatic complexity ≤10 (use cargo-complexity)
- Single, clear purpose per function

**Documentation Requirements:**
```rust
/// Fetches user by ID from the database.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - Unique user identifier
///
/// # Returns
/// User record if found
///
/// # Errors
/// Returns `Error::NotFound` if user doesn't exist
/// Returns `Error::Database` for connection issues
///
/// # Examples
/// ```
/// # use myapp::*;
/// # async fn example() -> Result<(), Error> {
/// let pool = create_pool().await?;
/// let user = get_user(&pool, UserId(42)).await?;
/// println!("Found user: {}", user.name);
/// # Ok(())
/// # }
/// ```
pub async fn get_user(pool: &PgPool, id: UserId) -> Result<User> {
    // Implementation
}
```

**See [code-quality.md](resources/code-quality.md) for readability standards.**

### 5. Static Analysis Pipeline

**Zero Warnings Policy:**

```toml
# In Cargo.toml
[lints.clippy]
all = "warn"
pedantic = "warn"
cargo = "warn"
nursery = "warn"

[profile.dev]
# Fail fast on warnings during development
rustflags = ["-D", "warnings"]
```

**Required Tools:**
- rustc with maximum warnings
- clippy with all lint groups
- rustfmt (mandatory formatting)
- cargo-audit (vulnerabilities)
- cargo-deny (supply chain policy)
- cargo-udeps (unused dependencies)
- cargo-geiger (unsafe detection)

**See [static-analysis.md](resources/static-analysis.md) for CI/CD integration.**

### 6. Error Handling Discipline

```rust
// ❌ NEVER in production code
let value = map.get(key).unwrap();

// ✅ ALWAYS use ? or explicit handling
let value = map.get(key)
    .ok_or(Error::KeyNotFound(key.clone()))?;

// ✅ OK: After explicit validation with comment
let index = validate_index(i, len)?;
let value = array[index]; // Safe: validated above
```

**Panic vs Result:**
- Panics = "bug in the program" (programming error)
- Result = "expected runtime error" (network failure, file not found)
- For libraries: prefer Result to give callers control

**See [error-handling.md](resources/error-handling.md) for comprehensive patterns.**

### 7. Performance & Robustness

**Zero-Cost Abstractions:**
```rust
// ✅ GOOD: Type safety without runtime cost
#[derive(Debug, Clone, Copy)]
pub struct UserId(i64);

// ✅ GOOD: Const evaluation for compile-time work
const MAX_BATCH_SIZE: usize = {
    let page_size = 1024;
    let items_per_page = 100;
    page_size / items_per_page
};
```

**Memory Management:**
- Minimize allocations in hot paths
- Use `SmallVec`/`arrayvec` for small collections
- Static allocation for hard real-time code
- Profile before optimizing (criterion.rs)

**See [performance.md](resources/performance.md) for optimization strategies.**

---

## The Human Element: Process Standards

### 8. Code Review Process - Nemawashi (Consensus Building)

**Toyota Way Review Philosophy:**

Code review is **consensus building**, not approval gatekeeping. The goal is to:
- Discuss problems with all affected parties
- Build mutual understanding
- Make decisions slowly by consensus
- Implement rapidly once decided
- Focus on learning, not blame

**Two Senior Engineer Rule:**

- All code requires approval from **two senior engineers**
- Senior = 3+ years Rust OR mastery of unsafe/concurrency/type system
- For smaller teams: one senior + peer with senior oversight
- Focus on developing senior engineers through pairing

**Review Response Times:**
- Normal PRs: within 24 hours
- Urgent/blocking: within 4 hours
- Large features (>500 lines): schedule dedicated time

**See [review-process.md](resources/review-process.md) for complete checklist and workflow.**

### 9. Jidoka - Stop the Line for Quality

**Zero Defect Culture:**

When a bug is discovered:
1. **STOP THE LINE** - Halt feature work
2. **Root cause analysis** - Five whys, not symptom patching
3. **Fix at source** - Prevent in generator, not post-production
4. **Learn and improve** - Update process to prevent recurrence

**Quality Gates (No Exceptions):**

Every commit must pass:
- All tests (100% pass rate)
- All static analysis (zero warnings)
- Code coverage threshold (≥80%, targeting 100%)
- Security audit (cargo-audit clean)
- Dependency audit (cargo-vet clean)

**Failed quality gate = no merge. Period.**

**Prevention Over Detection:**
- Build quality into process
- Don't inspect quality in at the end
- Use type system to prevent bugs at compile time
- Treat CI failures seriously (never "skip CI")

### 10. Genchi Genbutsu - Go and See

**Hands-On Verification:**

Reviewers MUST:
- Check out code locally (don't just read on GitHub)
- Run the application and test behavior
- Write small test programs to verify API ergonomics
- Run benchmarks for performance-critical code
- Use debugger to understand complex flow
- Profile actual performance characteristics

**Understanding at Source:**
- Examine actual behavior, not claimed behavior
- Run examples and documentation
- Check dependencies when uncertain
- Manual testing supplements (not replaces) automated testing

### 11. Kaizen - Continuous Improvement

**Systematic Improvement:**

Every sprint/iteration:
- Include improvement initiatives
- Track and address technical debt
- Regular retrospectives (Hansei)
- Experiment with new tools/techniques
- Share learnings across team

**Metrics-Driven Improvement:**

Track over time:
- Code coverage percentage
- Static analysis warning count
- Build/test execution time
- Bug escape rate (defects in production)
- Time to fix defects
- Code complexity trends

**Learning Organization:**
- Post-mortems without blame
- Document lessons learned
- Update processes based on learnings
- Invest in training
- Pair programming and knowledge sharing

**See [continuous-improvement.md](resources/continuous-improvement.md) for Kaizen practices.**

### 12. Hansei - Reflection and Learning

**Post-Review Reflection:**

After significant reviews, ask:
- What worked well?
- What could be improved?
- What did we learn?
- What process changes would prevent similar issues?

**Incident Retrospectives:**

For production incidents:
1. **What happened?** (timeline)
2. **Why did it happen?** (root cause, five whys)
3. **What prevented early detection?** (process gaps)
4. **What will we change?** (concrete actions)

Focus on **learning, not blame**.

### 13. Respect for People - Sustainable Practices

**Heijunka - Level the Workload:**

- Avoid overburdening engineers (muri)
- Spread code review load across team
- Set reasonable turnaround expectations
- Size PRs appropriately (~300 lines ideal, 500 max)
- Break large features into reviewable chunks

**Constructive Feedback:**

- Frame as questions/suggestions, not commands
- Explain the "why" (share knowledge)
- Distinguish: must-fix / should-fix / nice-to-have
- Praise good code and solutions
- Assume good intent; ask clarifying questions

**Team Development:**

- Pair juniors with seniors
- Code review as teaching opportunity
- Rotate assignments to spread knowledge
- Document common feedback to reduce repetition
- Invest in formal Rust training

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)

**Immediate Actions:**
1. Set up CI/CD with all static analysis tools
2. Configure rustfmt and enforce formatting
3. Enable Clippy with pedantic lints
4. Integrate cargo-audit and cargo-deny
5. Define unsafe review group
6. Create PR template with checklist

**Team Preparation:**
- Review this standard with entire team
- Identify gaps in current practices
- Plan training for improvement areas
- Establish code review rotation
- Set up metrics dashboard

### Phase 2: Process Integration (Weeks 5-8)

**Review Process:**
- Implement two-engineer review requirement
- Establish turnaround time expectations
- Begin using comprehensive checklist
- Track review metrics

**Quality Gates:**
- Configure CI to block on failures
- Set code coverage thresholds
- Enable warnings-as-errors
- Implement cargo-vet for dependencies

### Phase 3: Continuous Improvement (Ongoing)

**Regular Activities:**
- Weekly metrics review
- Monthly retrospectives (Hansei)
- Quarterly process improvements (Kaizen)
- Annual external audit

**Advanced Practices:**
- Property-based testing for complex logic
- Fuzzing for parsers/input handlers
- Formal verification for critical components
- Audit sharing (cargo-vet ecosystem)

---

## Context-Specific Tailoring

### For Startups / Rapid Development

**Start with essentials:**
- Forbid unsafe code
- 80% coverage minimum
- Basic static analysis (cargo-audit, rustfmt, clippy::correctness)
- Single reviewer for low-risk code

**Maintain:**
- Zero-defect culture
- Stop-the-line mindset

### For Safety-Critical Systems

**Enhance:**
- 100% coverage mandatory
- Formal verification for critical paths
- Ferrocene qualified toolchain
- DO-178C/ISO 26262 compliance

**Strengthen:**
- All unsafe formally verified
- Extensive fuzzing
- Complete requirements traceability

### For Libraries / Frameworks

**Emphasize:**
- API design review
- Comprehensive documentation
- Semantic versioning
- Breaking change analysis

**Add:**
- Property-based tests
- Multiple Rust version support
- Zero unsafe in public APIs

### For Embedded / Real-Time

**Enforce:**
- `no_std` mode
- Static allocation only
- Bounded execution time
- Stack usage analysis

**Test:**
- On actual hardware
- Deterministic behavior verification
- WCET analysis

---

## Success Metrics

### Technical Quality

- Code coverage ≥90% (target 100% for new code)
- Zero known security vulnerabilities
- Static analysis warnings = 0
- Build time enables fast iteration
- Test execution \u003c5 minutes for unit tests

### Process Quality

- Review turnaround \u003c24 hours (median)
- Defect escape rate → 0
- Team satisfaction with reviews (quarterly survey)
- Knowledge sharing effectiveness

### Learning & Improvement

- All engineers trained on unsafe Rust
- Retrospectives with tracked action items
- Process improvements quarterly
- Documentation kept current

---

## Resource Files

This skill is organized into focused resource files for deep dives:

### Technical Standards
1. **[Memory Safety & Correctness](resources/memory-safety.md)** - Unsafe code, type system, assertions
2. **[Testing Strategy](resources/testing-strategy.md)** - Multi-layer testing, property-based, fuzzing
3. **[Security Hardening](resources/security-hardening.md)** - Supply chain, cryptography, defense-in-depth
4. **[Code Quality](resources/code-quality.md)** - Complexity limits, documentation, readability
5. **[Static Analysis](resources/static-analysis.md)** - Zero warnings policy, tool integration
6. **[Error Handling](resources/error-handling.md)** - Result patterns, panic discipline
7. **[Performance](resources/performance.md)** - Zero-cost abstractions, memory management

### Process Standards
8. **[Review Process](resources/review-process.md)** - Nemawashi, checklists, workflow
9. **[Continuous Improvement](resources/continuous-improvement.md)** - Kaizen, metrics, learning
10. **[Practical Checklists](resources/checklists.md)** - Ready-to-use review checklists
11. **[Pragmatic Review Framework](resources/pragmatic-review-framework.md)** - High-velocity review, GitHub Actions, triage matrix

---

## PAIML MCP Integration

Automate Toyota Way principles with PMAT quality gates:

### Jidoka (Stop-the-Line) Automation

```bash
# Install PMAT
cargo install pmat

# Automated quality gate (Andon cord)
pmat quality-gate --strict

# Technical Debt Grading with Kaizen tracking
pmat analyze tdg --track-improvement

# Zero SATD enforcement
pmat analyze satd --zero-tolerance
```

### Kaizen Metrics Tracking

```bash
# Track improvement over sprints
pmat metrics kaizen --since "last sprint"

# Compare quality trajectory
pmat compare --base main --head feature-branch

# Quality archaeology for retrospectives
pmat history --metric complexity --format chart
```

### CI/CD Toyota Way Pipeline

```yaml
# .github/workflows/kaizen-gates.yml
- name: Toyota Way Quality Gates
  run: |
    cargo install pmat
    # Jidoka: Stop on any violation
    pmat quality-gate --strict
    # Kaizen: Ensure improvement
    pmat metrics kaizen --require-improvement
    # Genchi Genbutsu: Verify actual behavior
    cargo test --no-fail-fast
```

See [paiml-mcp-toolkit](../paiml-mcp-toolkit/SKILL.md) for Toyota Way gates reference.

---

## Philosophy in Practice

**Remember:** Perfect code is an asymptotic goal. What matters is:

1. **Direction of travel** - Continuous improvement
2. **Learning from mistakes** - Hansei without blame
3. **Stop-the-line quality** - Jidoka when quality at risk
4. **Respect for people** - Sustainable, collaborative practices

The Toyota Way teaches us that **the right process produces the right results**, and that process must value people as much as it values correctness.

---

## Quick Reference Card

Print this for your desk:

```
KAIZEN-SOLARIS REVIEW ESSENTIALS

SAFETY (Zero Tolerance):
□ No unsafe without SAFETY comments
□ No unwrap/expect in production
□ All tests passing
□ Zero warnings (rustc + clippy)
□ cargo-audit clean

QUALITY (Standards):
□ 100% coverage for new code
□ Functions ≤60 lines, complexity ≤10
□ All public APIs documented
□ Input validation at boundaries

HUMAN (Respect):
□ Assume good intent
□ Explain "why" in feedback
□ Review within 24 hours
□ PRs ≤500 lines
□ Praise good solutions

PROCESS (Kaizen):
□ Stop the line for bugs
□ Five-whys root cause
□ Regular retrospectives
□ Metrics-driven improvement

PMAT COMMANDS:
□ pmat quality-gate --strict
□ pmat analyze tdg
□ pmat metrics kaizen
```

---

## Related Skills

- [paiml-mcp-toolkit](../paiml-mcp-toolkit/SKILL.md) - PMAT integration and Toyota Way gates
- [rust-skills](../rust-skills/SKILL.md) - Rust development patterns
- [production-hardening-backend](../production-hardening-backend/SKILL.md) - Security hardening

---

**Excellence through respect. Quality through process. Improvement through reflection.**

**Version**: 1.1
**Last Updated**: 2025-12-03
**PAIML Integration**: Toyota Way Gates, Kaizen Metrics ✅
