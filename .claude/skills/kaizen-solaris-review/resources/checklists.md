# Practical Review Checklists

## Overview

This document provides ready-to-use checklists for different review scenarios. Copy these into PRs, code review tools, or team documentation.

---

## Master Review Checklist

Use this comprehensive checklist for all code reviews:

### 🛡️ Memory Safety & Correctness

- [ ] **No unsafe without SAFETY comments** - Every unsafe block has detailed explanation
- [ ] **Unsafe review group approval** - All unsafe code reviewed by specialist
- [ ] **Miri verification** - Tests with unsafe code pass under Miri
- [ ] **No primitive obsession** - Domain types use newtypes, not primitives
- [ ] **Illegal states impossible** - Type system prevents invalid states
- [ ] **Input validation** - All external inputs validated at boundaries
- [ ] **Panic documentation** - All `# Panics` sections complete
- [ ] **No unwrap in production** - Use `?` or `expect()` with justification
- [ ] **Assertions present** - Minimum two checks per function

### 🧪 Testing & Quality

- [ ] **100% line coverage** - New code fully covered (measured)
- [ ] **Tests pass locally** - All tests run and pass on reviewer's machine
- [ ] **Error paths tested** - Not just happy paths
- [ ] **Regression tests** - Bug fixes include tests preventing recurrence
- [ ] **Property-based tests** - Algorithms/parsers have proptest coverage
- [ ] **Mutation testing** - Critical modules achieve 90%+ mutation kill rate
- [ ] **Doc tests work** - All code examples in documentation compile/run
- [ ] **Integration tests** - Real usage patterns tested in `tests/`
- [ ] **Fuzzing (if applicable)** - Input handlers have fuzz targets
- [ ] **Tests deterministic** - No flaky tests (timing, randomness)

### 🔒 Security

- [ ] **cargo-audit clean** - No known vulnerabilities in dependencies
- [ ] **cargo-vet audited** - All new dependencies audited
- [ ] **No hardcoded secrets** - Secrets from env vars or secret stores
- [ ] **Input sanitization** - All user input sanitized/validated
- [ ] **Crypto uses vetted libs** - ring, RustCrypto, sodiumoxide only
- [ ] **Sensitive data zeroized** - Use `zeroize` crate for secrets
- [ ] **No SQL injection** - Use parameterized queries or SQLx macros
- [ ] **Authentication/authz** - Proper access control implemented
- [ ] **Rate limiting** - DoS protection on public endpoints

### ✨ Code Quality

- [ ] **Zero compiler warnings** - `RUSTFLAGS="-D warnings"` passes
- [ ] **Zero clippy warnings** - All lint groups enabled and passing
- [ ] **rustfmt applied** - Code formatted consistently
- [ ] **Functions ≤60 lines** - Functions fit on one screen
- [ ] **Complexity ≤10** - Cyclomatic complexity within limits
- [ ] **Clear function purpose** - Single responsibility per function
- [ ] **No deeply nested code** - Prefer early returns
- [ ] **Meaningful names** - Variables/functions clearly named
- [ ] **Documentation complete** - All public APIs documented
  - [ ] `# Examples` section with working code
  - [ ] `# Errors` for fallible functions
  - [ ] `# Panics` if function can panic
  - [ ] `# Safety` for unsafe functions

### ⚡ Performance

- [ ] **No unnecessary allocations** - Hot paths optimized
- [ ] **Benchmarks (if needed)** - Performance-critical code benchmarked
- [ ] **No regressions** - Performance comparable to before
- [ ] **Resource bounds** - Memory/CPU usage predictable
- [ ] **Connection pooling** - Database/HTTP connections pooled

### 🤝 Process & Collaboration

- [ ] **PR sized appropriately** - ~300 lines ideal, \u003c500 max
- [ ] **Clear description** - What/why explained in PR
- [ ] **Linked issues** - References related issues/tickets
- [ ] **CI passing** - All automated checks green
- [ ] **Constructive feedback** - Reviews respectful and educational
- [ ] **Questions answered** - All reviewer questions addressed
- [ ] **Two approvals** - Two senior engineers approved

---

## Quick Safety Checklist (< 5 minutes)

Use this for rapid safety verification:

- [ ] Tests passing
- [ ] No compiler/clippy warnings
- [ ] No unsafe code (or properly documented)
- [ ] No unwrap/expect in production paths
- [ ] cargo-audit clean
- [ ] Input validation present
- [ ] Documentation complete

---

## Extreme TDD Checklist

For projects using extreme TDD methodology:

### Property-Based Testing

- [ ] **Property tests for parsers** - Generate thousands of test cases
- [ ] **Edge cases covered** - bash keywords as variables, special chars
- [ ] **Shrinking configured** - Minimal failing examples found
- [ ] **Invariants tested** - Properties hold for all valid inputs

### Mutation Testing

- [ ] **Baseline established** - Initial mutation kill rate recorded
- [ ] **90%+ kill rate** - Target achieved for critical modules
- [ ] **Targeted tests** - One test per missed mutant
- [ ] **Operator mutations** - Tests catch `+` → `*`, `==` → `!=`, etc.
- [ ] **Boundary mutations** - Tests catch off-by-one errors
- [ ] **Mutation patterns documented** - Lessons learned recorded

### Stop-The-Line Quality

- [ ] **Property tests pass** - Never proceed if prop tests fail
- [ ] **Mutation baseline complete** - Before new feature work
- [ ] **Quick wins identified** - Assertion-only fixes documented
- [ ] **Blockers categorized** - Parser/transpiler/runtime dependencies clear

### Batch Efficiency

- [ ] **Tests pre-written** - All targeted tests queued
- [ ] **Parallel execution** - Multiple baselines run concurrently
- [ ] **Bottlenecks identified** - Parser constraints documented

---

## Unsafe Code Review Checklist

Specialized checklist for unsafe code review:

### Documentation

- [ ] **SAFETY comment present** - Every unsafe block documented
- [ ] **Pointer validity explained** - Non-null, aligned, valid for access
- [ ] **Ownership documented** - No aliasing violations
- [ ] **Lifetime guarantees** - Memory outlives references
- [ ] **Invariants maintained** - Type invariants (UTF-8, etc.) preserved
- [ ] **Alternative considered** - Safe approach investigated first

### Verification

- [ ] **Miri passes** - No undefined behavior detected
- [ ] **Minimal scope** - Unsafe contained in smallest function
- [ ] **Safe public API** - Unsafe not exposed to callers
- [ ] **Specialist review** - Unsafe review group approved
- [ ] **Tests comprehensive** - All paths through unsafe tested

### Common UB Sources

- [ ] **No dangling pointers** - Use-after-free prevented
- [ ] **No out-of-bounds** - All indices validated
- [ ] **No data races** - Shared mutable state protected
- [ ] **No uninitialized reads** - Memory initialized before access
- [ ] **No alignment violations** - Pointers properly aligned
- [ ] **No invalid values** - Type invariants maintained (bool 0/1, enum discriminants)

---

## Security Review Checklist

Focused on security hardening:

### Supply Chain

- [ ] **Dependencies audited** - cargo-vet for all new deps
- [ ] **RustSec checked** - cargo-audit passing
- [ ] **License compatible** - cargo-deny enforcing policy
- [ ] **Unsafe in deps** - cargo-geiger reviewed
- [ ] **Pin versions** - Exact versions for reproducibility

### Input Validation

- [ ] **All inputs validated** - Trust no external data
- [ ] **SQL injection prevented** - Parameterized queries only
- [ ] **XSS prevented** - Output sanitized/escaped
- [ ] **Path traversal prevented** - File paths validated
- [ ] **Command injection prevented** - No shell execution with user input
- [ ] **Buffer overflow impossible** - Rust prevents, but check unsafe
- [ ] **Integer overflow checked** - Use checked arithmetic

### Cryptography

- [ ] **Vetted libraries** - ring, RustCrypto, sodiumoxide only
- [ ] **No custom crypto** - Never roll your own
- [ ] **Constant-time ops** - Crypto comparisons timing-safe
- [ ] **Secrets zeroized** - Memory cleared after use
- [ ] **Random properly seeded** - Use getrandom/rand crate
- [ ] **Key management** - Keys from secure storage, not hardcoded

### Authentication/Authorization

- [ ] **Strong auth** - MFA, JWT, OAuth2, or mTLS
- [ ] **Session management** - Secure session tokens
- [ ] **RBAC/ABAC** - Fine-grained authorization
- [ ] **Least privilege** - Minimal permissions
- [ ] **Secure defaults** - Fail closed, not open

### Network/API

- [ ] **TLS 1.3** - Strong encryption enforced
- [ ] **Rate limiting** - DoS protection
- [ ] **CORS configured** - Proper origin restrictions
- [ ] **CSP headers** - Content security policy set
- [ ] **Input size limits** - Max request size enforced

---

## Performance Review Checklist

For performance-critical code:

### Profiling

- [ ] **Profiled before optimizing** - Data-driven optimization
- [ ] **Hot paths identified** - Know where time is spent
- [ ] **Benchmarks exist** - criterion.rs benchmarks
- [ ] **No regressions** - Performance maintained or improved

### Memory Management

- [ ] **Allocations minimized** - Hot paths avoid heap allocation
- [ ] **Stack allocation used** - Small data on stack
- [ ] **Pooling implemented** - Reuse expensive resources
- [ ] **SmallVec for small collections** - Avoid heap for \u003c8 items
- [ ] **Copy types for small data** - ≤2 words use Copy
- [ ] **Zero-copy when possible** - Borrow instead of clone

### Async/Concurrency

- [ ] **Tokio runtime configured** - Worker threads tuned
- [ ] **Blocking work offloaded** - spawn_blocking for CPU work
- [ ] **Connection pools** - Database/HTTP connections pooled
- [ ] **Backpressure handling** - Load shedding implemented
- [ ] **Batching used** - Aggregate operations when possible

### Algorithms

- [ ] **Complexity analyzed** - O(n) vs O(n²) understood
- [ ] **Data structures appropriate** - HashMap vs BTreeMap vs Vec
- [ ] **Caching implemented** - Repeated work memoized
- [ ] **Lazy evaluation** - Work deferred until needed

---

## Post-Incident Review Checklist (Hansei)

Use after production incidents:

### Incident Timeline

- [ ] **What happened?** - Clear timeline of events
- [ ] **When detected?** - Time from occurrence to detection
- [ ] **Who responded?** - Team members involved
- [ ] **Resolution time** - Time to mitigation/fix
- [ ] **Impact assessed** - Users/systems affected

### Root Cause Analysis

- [ ] **Immediate cause** - What directly caused the issue
- [ ] **Five whys completed** - Root cause identified
- [ ] **Contributing factors** - Secondary causes listed
- [ ] **Why not caught earlier?** - Process gaps identified

### Prevention

- [ ] **Test added** - Regression test prevents recurrence
- [ ] **Monitoring improved** - Earlier detection possible
- [ ] **Documentation updated** - Runbooks/docs improved
- [ ] **Process changed** - Review/deployment process improved
- [ ] **Code hardened** - Defensive code added

### Learning

- [ ] **Blameless retrospective** - Focus on learning, not blame
- [ ] **Lessons documented** - Shared with team
- [ ] **Action items assigned** - Owners and deadlines
- [ ] **Follow-up scheduled** - Verify actions completed

---

## Sprint/Iteration Review Checklist (Kaizen)

For continuous improvement:

### Metrics Review

- [ ] **Coverage trend** - Moving toward 100%?
- [ ] **Warning count** - Decreasing over time?
- [ ] **Build time** - Fast feedback maintained?
- [ ] **Test time** - Tests run quickly?
- [ ] **Bug escape rate** - Production defects decreasing?
- [ ] **Review turnaround** - \u003c24 hours median?

### Process Improvement

- [ ] **What worked well?** - Celebrate successes
- [ ] **What didn't work?** - Identify friction points
- [ ] **Blockers removed?** - Team unblocked?
- [ ] **Technical debt tracked** - Debt register updated
- [ ] **Improvement experiments** - New tools/techniques tried

### Team Health

- [ ] **Workload sustainable?** - No burnout signs
- [ ] **Knowledge shared?** - Pairing/mentoring happening
- [ ] **Skills developing?** - Training investments made
- [ ] **Morale high?** - Team satisfaction good

### Action Items

- [ ] **Improvement initiatives** - What to try next sprint
- [ ] **Technical debt work** - Debt scheduled
- [ ] **Process changes** - Workflow improvements
- [ ] **Training needs** - Skills to develop

---

## PR Template (Copy/Paste)

```markdown
## Description

[What does this PR do?]

## Type of Change

- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Refactoring (no functional changes)
- [ ] Documentation update

## Related Issues

Fixes #[issue number]
Related to #[issue number]

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Property-based tests added (if applicable)
- [ ] Mutation testing performed (if applicable)
- [ ] All tests passing locally
- [ ] Manual testing completed

## Security

- [ ] No new dependencies OR dependencies audited with cargo-vet
- [ ] cargo-audit passing
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] No unsafe code OR unsafe properly documented and reviewed

## Quality

- [ ] Zero compiler warnings
- [ ] Zero clippy warnings
- [ ] Code formatted with rustfmt
- [ ] Documentation complete (all public APIs)
- [ ] Functions ≤60 lines, complexity ≤10
- [ ] Code coverage ≥90% for new code

## Review Notes

[Any specific areas reviewers should focus on]

## Checklist for Reviewers

- [ ] Code checked out and run locally (Genchi Genbutsu)
- [ ] Tests executed and verified
- [ ] Safety checklist reviewed
- [ ] Security checklist reviewed
- [ ] Quality standards met
- [ ] Constructive feedback provided
```

---

## Quick Reference Card (Print for Desk)

```
┌─────────────────────────────────────────────────────┐
│ KAIZEN-SOLARIS REVIEW ESSENTIALS                    │
├─────────────────────────────────────────────────────┤
│ SAFETY (Zero Tolerance):                            │
│ □ No unsafe without SAFETY comments                 │
│ □ No unwrap/expect in production                    │
│ □ All tests passing                                 │
│ □ Zero warnings (rustc + clippy)                    │
│ □ cargo-audit clean                                 │
│                                                      │
│ QUALITY (Standards):                                │
│ □ 100% coverage for new code                        │
│ □ 90%+ mutation kill rate (critical modules)        │
│ □ Functions ≤60 lines, complexity ≤10               │
│ □ All public APIs documented                        │
│ □ Input validation at boundaries                    │
│                                                      │
│ HUMAN (Respect):                                    │
│ □ Assume good intent                                │
│ □ Explain "why" in feedback                         │
│ □ Review within 24 hours                            │
│ □ PRs ≤500 lines                                    │
│ □ Praise good solutions                             │
│                                                      │
│ PROCESS (Kaizen):                                   │
│ □ Stop the line for bugs                            │
│ □ Five-whys root cause                              │
│ □ Regular retrospectives                            │
│ □ Metrics-driven improvement                        │
└─────────────────────────────────────────────────────┘
```

---

## Context-Specific Checklists

### Startup/Rapid Development

**Essential subset:**
- [ ] Forbid unsafe code
- [ ] 80% coverage minimum
- [ ] Basic static analysis (cargo-audit, rustfmt, clippy::correctness)
- [ ] Single reviewer OK for low-risk code
- [ ] Zero-defect culture maintained

### Safety-Critical Systems

**Enhanced requirements:**
- [ ] 100% coverage mandatory
- [ ] Formal verification for critical paths
- [ ] All unsafe formally verified
- [ ] Extensive fuzzing
- [ ] DO-178C/ISO 26262 compliance
- [ ] Complete requirements traceability

### Library/Framework

**API-focused:**
- [ ] API design review
- [ ] Comprehensive documentation
- [ ] Semantic versioning
- [ ] Breaking change analysis
- [ ] Property-based tests
- [ ] Multiple Rust version support
- [ ] Zero unsafe in public APIs

### Embedded/Real-Time

**Resource-constrained:**
- [ ] `no_std` mode
- [ ] Static allocation only
- [ ] Bounded execution time
- [ ] Stack usage analysis
- [ ] Testing on actual hardware
- [ ] WCET analysis
- [ ] Deterministic behavior verified

---

**Remember:** Checklists are tools to ensure consistency, not bureaucracy. Adapt them to your context while maintaining the core principles of safety, quality, and respect for people.
