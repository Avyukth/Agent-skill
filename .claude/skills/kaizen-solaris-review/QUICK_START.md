# Kaizen-Solaris Code Review System - Quick Start

## For Teams (30-Minute Setup)

### Step 1: Read Core Documents (15 min)

**Must read:**
- [SKILL.md](SKILL.md) - Scan the core philosophy and checklists
- [README.md](README.md) - Understand the overview

**Pick one resource based on immediate need:**
- Reviewing unsafe code? → [memory-safety.md](resources/memory-safety.md)
- Setting up tests? → [testing-strategy.md](resources/testing-strategy.md)
- Starting reviews? → [review-process.md](resources/review-process.md)

### Step 2: Set Up CI/CD (10 min)

**Add to `.github/workflows/review.yml`:**

```yaml
name: Code Review Checks
on: [pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable

      # Zero warnings policy
      - name: Check warnings
        run: cargo clippy --all-features -- -D warnings

      # Format check
      - name: Check format
        run: cargo fmt --check

      # Tests
      - name: Run tests
        run: cargo test --all-features

      # Coverage (optional but recommended)
      - name: Coverage
        run: |
          cargo install cargo-llvm-cov
          cargo llvm-cov --fail-under-lines 80

      # Security
      - name: Security audit
        run: |
          cargo install cargo-audit
          cargo audit
```

### Step 3: Configure Tools (5 min)

**Add to `Cargo.toml`:**

```toml
[lints.clippy]
all = "warn"
pedantic = "warn"
cargo = "warn"
nursery = "warn"
```

**Add to project root `.clippy.toml`:**

```toml
# Deny unsafe by default
unsafe-code = "forbid"
```

### Step 4: Create PR Template

**Create `.github/PULL_REQUEST_TEMPLATE.md`:**

```markdown
## Description
[What does this PR do?]

## Checklist

### Safety
- [ ] No unsafe code OR unsafe properly documented with SAFETY comments
- [ ] No unwrap/expect in production code
- [ ] All tests passing
- [ ] Zero compiler/clippy warnings

### Testing
- [ ] Unit tests added/updated
- [ ] Coverage ≥90% for new code
- [ ] Property-based tests (if applicable)

### Quality
- [ ] Code formatted with rustfmt
- [ ] Documentation complete
- [ ] Functions ≤60 lines
```

---

## For Reviewers (5-Minute Checklist)

### Before You Review

1. **Check out locally** (don't just read on GitHub)
   ```bash
   git fetch origin
   git checkout pr/123
   cargo test
   ```

2. **Run the code** - Verify it works as advertised

### While Reviewing

**Priority order:**

1. **Safety first** 🛡️
   - [ ] No unsafe without SAFETY comments
   - [ ] No unwrap in production
   - [ ] Input validation present

2. **Correctness** ✅
   - [ ] Logic sound
   - [ ] Error handling comprehensive
   - [ ] Edge cases covered

3. **Testing** 🧪
   - [ ] Tests exist and pass
   - [ ] Coverage ≥90%
   - [ ] Error paths tested

4. **Quality** ✨
   - [ ] Zero warnings
   - [ ] Documentation complete
   - [ ] Functions reasonably sized

### Provide Feedback

**Use this template:**

```markdown
# 🛑 MUST FIX (blocks merge)
- Line 42: Unsafe code needs SAFETY comment explaining...
- Line 67: Unwrap will panic if config missing, use `?` instead

# 💡 SUGGESTIONS (nice to have)
- Line 123: Consider extracting this into helper function
- Line 234: Could use `if let` for cleaner code

# ✅ PRAISE (acknowledge good work)
- Nice property-based test on line 156!
- Great error handling pattern throughout
```

---

## For Authors (5-Minute Pre-Submit)

### Before Creating PR

**Run this checklist:**

```bash
# 1. Format
cargo fmt

# 2. Lint
cargo clippy --all-features -- -D warnings

# 3. Test
cargo test --all-features

# 4. Coverage (if you have cargo-llvm-cov)
cargo llvm-cov --fail-under-lines 90

# 5. Security
cargo audit
```

### PR Size

**Ideal:** ~300 lines
**Maximum:** 500 lines

**Too big?** Split into multiple PRs:
1. Refactoring prep
2. API changes
3. Implementation
4. Tests + docs

### Writing Description

**Template:**

```markdown
## What
[One sentence: what does this change?]

## Why
[Business context or problem being solved]

## How
[Technical approach taken]

## Testing
- Unit tests: [coverage %]
- Manual testing: [steps you performed]

## Review Focus
[What specifically do you want reviewers to check?]
```

---

## Emergency Reference Card

**Print this and keep at your desk:**

```
┌─────────────────────────────────────────────┐
│ KAIZEN-SOLARIS REVIEW ESSENTIALS            │
├─────────────────────────────────────────────┤
│ MUST FIX (Zero Tolerance):                  │
│ □ Unsafe without SAFETY comments            │
│ □ Unwrap/expect in production               │
│ □ Failing tests                             │
│ □ Compiler/clippy warnings                  │
│ □ cargo-audit vulnerabilities               │
│                                             │
│ QUALITY (Standards):                        │
│ □ 90%+ coverage for new code                │
│ □ Functions ≤60 lines                       │
│ □ All public APIs documented                │
│                                             │
│ PROCESS (Respect):                          │
│ □ Review within 24 hours                    │
│ □ PRs ≤500 lines                            │
│ □ Ask questions, don't command              │
│ □ Explain "why" in feedback                 │
└─────────────────────────────────────────────┘
```

---

## First Week Goals

### Day 1: Setup
- [ ] Read SKILL.md
- [ ] Configure CI/CD
- [ ] Add Clippy lints

### Day 2-3: First Reviews
- [ ] Use safety checklist
- [ ] Practice constructive feedback
- [ ] Check out code locally (Genchi Genbutsu)

### Day 4-5: Improvement
- [ ] Track review metrics
- [ ] Hold first team Hansei (15 min)
- [ ] Identify one process improvement

### Week End: Retrospective
- [ ] What went well?
- [ ] What was difficult?
- [ ] What will we adjust?

---

## Getting Help

**Questions about:**
- Memory safety → [memory-safety.md](resources/memory-safety.md)
- Testing → [testing-strategy.md](resources/testing-strategy.md)
- Review process → [review-process.md](resources/review-process.md)
- Continuous improvement → [continuous-improvement.md](resources/continuous-improvement.md)
- Specific checklists → [checklists.md](resources/checklists.md)

**Philosophy questions:**
- Read the [README.md](README.md) "Philosophy in Practice" section

---

## Success Looks Like

**Week 1:**
- CI catching issues automatically
- Zero warning policy enforced
- Reviews happening within 24 hours

**Month 1:**
- Coverage at 90%+
- Review process smooth
- Team finding rhythm

**Quarter 1:**
- Zero defect culture established
- Regular Kaizen sessions
- Measurable improvements in metrics

---

**Remember:** Start small, improve continuously. Excellence is a journey, not a destination.

**始めましょう (Let's begin)** 🚀
