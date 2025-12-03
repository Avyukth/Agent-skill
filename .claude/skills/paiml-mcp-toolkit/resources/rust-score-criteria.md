# Rust Project Score: Complete 211-Point Criteria

The Rust Project Score is an evidence-based scoring system derived from analysis of elite Rust projects (tokio, serde, clap, syn, regex) and grounded in academic research on software maintainability.

---

## Category 1: Rust Tooling & CI/CD (130 Points)

### CI/CD Integration (37 pts)

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| GitHub Actions workflow | 10 | Multi-platform (Linux, macOS, Windows) |
| GitLab CI pipeline | 7 | Alternative CI support |
| Test matrix | 8 | Multiple Rust versions (stable, beta, nightly) |
| Scheduled audits | 6 | Weekly cargo-audit runs |
| Release automation | 6 | Automated crate publishing |

### Advanced Metadata (35 pts)

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| Documentation link | 8 | `documentation = "https://docs.rs/..."` |
| Repository URL | 7 | `repository = "https://github.com/..."` |
| License | 6 | Valid SPDX identifier |
| Categories | 5 | Appropriate crates.io categories |
| Keywords | 5 | Relevant search keywords |
| Authors | 4 | Maintainer contact info |

### Workspace-level Lints (12 pts)

```toml
# Cargo.toml (workspace root)
[workspace.lints.clippy]
all = "warn"
pedantic = "warn"
cargo = "warn"
nursery = "warn"

[workspace.lints.rust]
unsafe_code = "forbid"
missing_docs = "warn"
```

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| Centralized lints | 6 | `[workspace.lints]` section |
| Inherited by members | 3 | `lints.workspace = true` in members |
| Documented rationale | 3 | Comments explaining lint choices |

### Release Profile Optimization (11 pts)

```toml
[profile.release]
lto = true
codegen-units = 1
panic = "abort"
strip = true
opt-level = 3
```

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| LTO enabled | 3 | `lto = true` or `lto = "fat"` |
| Single codegen unit | 2 | `codegen-units = 1` |
| Panic strategy | 2 | `panic = "abort"` for binaries |
| Symbol stripping | 2 | `strip = true` |
| Optimization level | 2 | `opt-level = 3` or `"z"` for size |

### Clippy Compliance (10 pts)

| Level | Points | Requirement |
|-------|--------|-------------|
| correctness | 4 | Zero warnings on correctness lints |
| suspicious | 3 | Zero warnings on suspicious lints |
| pedantic | 3 | Zero warnings on pedantic lints |

### MSRV Tracking (10 pts)

```toml
[package]
rust-version = "1.75.0"
```

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| Declared MSRV | 5 | `rust-version` in Cargo.toml |
| CI verification | 3 | Tests run on MSRV |
| Policy documented | 2 | MSRV policy in README |

### cargo-audit (7 pts)

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| Zero vulnerabilities | 4 | Clean `cargo audit` |
| CI integration | 2 | Automated in pipeline |
| Ignore file | 1 | Documented ignores if needed |

### Rustfmt Compliance (5 pts)

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| Formatted code | 3 | `cargo fmt -- --check` passes |
| Config file | 2 | `rustfmt.toml` with consistent style |

### cargo-deny (3 pts)

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| License policy | 1 | Allowed licenses defined |
| Source policy | 1 | Crates.io only or explicit |
| Duplicate policy | 1 | No unintentional duplicates |

---

## Category 2: Code Quality (26 Points)

### Unsafe Code Documentation (9 pts)

```rust
unsafe {
    // SAFETY: This is safe because:
    // 1. The pointer is guaranteed non-null (from Box::into_raw)
    // 2. We own the allocation exclusively
    // 3. The alignment and size are correct for T
    Box::from_raw(ptr)
}
```

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| SAFETY comments | 5 | Every unsafe block documented |
| Invariants stated | 2 | Pre/post conditions explicit |
| Miri validation | 2 | Unsafe code runs under Miri |

### Mutation Testing (8 pts)

| Score Range | Points | Assessment |
|-------------|--------|------------|
| >= 90% | 8 | Excellent |
| 80-89% | 6 | Good |
| 70-79% | 4 | Acceptable |
| 60-69% | 2 | Needs work |
| < 60% | 0 | Poor |

### Build Time (4 pts)

| Time | Points | Requirement |
|------|--------|-------------|
| < 2 min | 4 | Excellent build performance |
| 2-5 min | 3 | Good |
| 5-10 min | 2 | Acceptable |
| 10-15 min | 1 | Slow |
| > 15 min | 0 | Needs optimization |

### Cyclomatic Complexity (3 pts)

| Max Complexity | Points | Requirement |
|----------------|--------|-------------|
| <= 10 | 3 | All functions low complexity |
| <= 15 | 2 | Some complexity acceptable |
| <= 20 | 1 | Upper bound |
| > 20 | 0 | Refactoring needed |

### Dead Code Detection (2 pts)

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| Zero dead code | 2 | `#[warn(dead_code)]` clean |
| Documented exceptions | 1 | `#[allow(dead_code)]` with reason |

---

## Category 3: Testing Excellence (20 Points)

### Coverage (8 pts)

| Coverage | Points | Requirement |
|----------|--------|-------------|
| >= 95% | 8 | Excellent |
| 90-94% | 7 | Very good |
| 85-89% | 6 | Good |
| 80-84% | 4 | Acceptable |
| 70-79% | 2 | Needs improvement |
| < 70% | 0 | Poor |

### Mutation Coverage (5 pts)

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| >= 85% killed | 5 | Tests catch mutations |
| 75-84% | 3 | Some gaps |
| < 75% | 1 | Significant gaps |

### Integration Tests (4 pts)

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| tests/ directory | 2 | Dedicated integration tests |
| Real scenarios | 1 | Actual usage patterns tested |
| External deps mocked | 1 | Proper test isolation |

### Doc Tests (3 pts)

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| Examples compile | 2 | All doc examples valid |
| Examples run | 1 | Examples are executable tests |

---

## Category 4: Documentation (15 Points)

### Rustdoc Coverage (7 pts)

| Coverage | Points | Requirement |
|----------|--------|-------------|
| 100% public API | 7 | All public items documented |
| >= 90% | 5 | Most items documented |
| >= 80% | 3 | Acceptable coverage |
| < 80% | 1 | Needs improvement |

### README Quality (5 pts)

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| Badges | 1 | CI, version, license badges |
| Usage examples | 2 | Quick start code |
| Installation | 1 | Clear install instructions |
| Contributing | 1 | CONTRIBUTING.md exists |

### Changelog Maintenance (3 pts)

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| CHANGELOG.md | 2 | Keep a Changelog format |
| Updated on release | 1 | Current with latest version |

---

## Category 5: Dependency Health (12 Points)

### Dependency Count (5 pts)

| Count | Points | Assessment |
|-------|--------|------------|
| < 20 | 5 | Minimal footprint |
| 20-40 | 4 | Reasonable |
| 40-60 | 2 | Consider reduction |
| > 60 | 0 | Dependency bloat |

### Feature Flags (4 pts)

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| Optional features | 2 | Users can opt-in |
| Default minimal | 1 | Defaults are lean |
| Documented | 1 | Features explained |

### Tree Pruning (3 pts)

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| No unused deps | 2 | `cargo-udeps` clean |
| Minimal duplicates | 1 | Version unification |

---

## Category 6: Performance & Benchmarking (10 Points)

### Criterion Benchmarks (5 pts)

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| Benchmarks exist | 3 | benches/ directory |
| Critical paths covered | 2 | Hot code benchmarked |

### CI Benchmark Workflows (3 pts)

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| Automated benchmarks | 2 | Benchmarks in CI |
| Regression detection | 1 | Historical comparison |

### Custom Harness (2 pts)

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| harness = false | 2 | Criterion integration |

---

## Bonus Category: Formal Verification (8 Points)

| Criterion | Points | Requirement |
|-----------|--------|-------------|
| Kani proofs | 4 | Model checking evidence |
| Prusti contracts | 2 | Verification conditions |
| MIRAI analysis | 2 | Abstract interpretation |

---

## Score Interpretation

| Score Range | Grade | Assessment |
|-------------|-------|------------|
| 190-211 | A+ | Elite project (tokio-level) |
| 170-189 | A | Production-excellent |
| 150-169 | B+ | Production-ready |
| 130-149 | B | Good quality |
| 110-129 | C+ | Acceptable |
| 90-109 | C | Needs improvement |
| < 90 | D/F | Significant work needed |

---

## Calculating Your Score

```bash
# Full score with breakdown
pmat rust-project-score --full --format json

# Category-specific
pmat rust-project-score --category ci-cd
pmat rust-project-score --category testing
pmat rust-project-score --category documentation

# Improvement suggestions
pmat rust-project-score --suggestions
```
