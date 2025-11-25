# Code Review Process: Nemawashi (Consensus Building)

## Overview

Code review is **consensus building**, not approval gatekeeping. This document establishes human-centered review practices that balance technical rigor with respect for people, sustainable workloads, and continuous learning.

---

## Philosophy: Toyota Way Review Principles

### Nemawashi (根回し) - Laying the Groundwork

**Definition:** Informal process of building consensus before formal decision-making.

**In Code Review:**
- Discuss problems with all affected parties
- Build mutual understanding before approval
- Make decisions slowly by consensus
- Implement rapidly once decided
- Focus on learning, not blame

### Core Values

1. **Respect for People** - Reviewers and authors are collaborators
2. **Continuous Improvement (Kaizen)** - Every review improves both code and team
3. **Go and See (Genchi Genbutsu)** - Check out and run the code locally
4. **Stop the Line (Jidoka)** - Halt on quality issues, don't paper over problems
5. **Reflection (Hansei)** - Learn from reviews to prevent future issues

---

## Two Senior Engineer Rule

### Requirement

**All production code requires approval from TWO senior engineers** before merging.

### Senior Engineer Definition

A senior engineer meets at least one of:
- **3+ years Rust experience** in production systems
- **Demonstrated mastery** of:
  - Unsafe code and soundness reasoning
  - Concurrent programming and race condition prevention
  - Type system design and trait usage
  - Performance optimization and profiling

### Exceptions

For teams without sufficient senior engineers:
- **One senior + one peer** reviewer acceptable
- **Senior oversight required** for peer-reviewed code (spot checks)
- **Focus on developing seniors** through pairing and mentorship

### Unsafe Specialist

Unsafe code requires **additional approval** from unsafe review group:
- Specialist in Rust memory model
- Understanding of undefined behavior
- Familiar with Miri and formal verification
- Experience with unsafe soundness review

---

## Review Workflow

### 1. Pre-Review (Author Preparation)

**Before creating PR:**

- [ ] **Self-review** - Read your own diff first
- [ ] **Run locally** - All tests pass, no warnings
- [ ] **Check CI** - Automated checks green
- [ ] **Size appropriately** - ~300 lines ideal, 500 max
- [ ] **Write description** - What/why/how clearly explained
- [ ] **Link issues** - Reference related tickets
- [ ] **Run checklist** - Use appropriate checklist from checklists.md

**PR Description Template:**

```markdown
## What

[Brief description of changes]

## Why

[Business context or problem being solved]

## How

[Technical approach taken]

## Testing

- Unit tests: [describe coverage]
- Integration tests: [if applicable]
- Manual testing: [steps performed]

## Review Focus

[Specific areas where you want reviewer attention]
```

### 2. Review Assignment

**Automatic assignment via CODEOWNERS or rotation:**

```
# .github/CODEOWNERS
/src/unsafe/**          @unsafe-review-group
/src/crypto/**          @security-team @unsafe-review-group
/src/**                 @team-senior-engineers
```

**Manual assignment guidelines:**
- **Balance workload** - Spread reviews across team (Heijunka)
- **Domain expertise** - Assign to engineers familiar with area
- **Learning opportunities** - Include junior engineers for mentorship
- **Timely response** - Assign to available engineers

### 3. Reviewer Preparation (Genchi Genbutsu)

**Reviewers MUST:**

1. **Check out locally** - Don't just read on GitHub
   ```bash
   git fetch origin
   git checkout origin/feature-branch
   ```

2. **Run the code** - Verify it works as advertised
   ```bash
   cargo build
   cargo test
   ./target/debug/myapp  # Actually use it
   ```

3. **Review tests** - Examine test coverage and quality
   ```bash
   cargo llvm-cov --html  # Check coverage visually
   ```

4. **Check CI** - Review all automated check results

5. **Understand context** - Read linked issues and related code

**Time allocation:**
- ~15-30 minutes per 300 lines of code
- Complex code may require more time
- Schedule dedicated time, don't squeeze between meetings

### 4. Conducting Review

**Review in this order:**

1. **Safety first** - Memory safety, undefined behavior, security
2. **Correctness** - Logic, error handling, edge cases
3. **Testing** - Coverage, test quality, edge cases
4. **Quality** - Readability, maintainability, documentation
5. **Performance** - Only if relevant to the change

**Feedback Framework:**

Use constructive, specific feedback:

```markdown
# ❌ BAD: Commanding, vague
"Don't use unwrap here."

# ✅ GOOD: Question-based, specific, educational
"I noticed `unwrap()` on line 42. If the config file is missing,
this will panic and crash the service. Could we use `?` to propagate
the error instead? That way callers can handle missing config gracefully.

Example:
let config = load_config().map_err(|e| Error::ConfigLoad(e))?;
"
```

**Severity levels:**

- **MUST FIX** - Safety, correctness, security issues
  - "🛑 MUST FIX: This unsafe block needs a SAFETY comment..."

- **SHOULD FIX** - Best practices, maintainability
  - "💡 SUGGESTION: Consider extracting this into a helper function..."

- **NICE TO HAVE** - Style preferences, minor improvements
  - "💬 NITPICK: We could use `if let` here for slightly cleaner code..."

**Praise good code:**

```markdown
✅ Nice! This error handling is exactly right—clear error types
and proper context propagation.

✅ Excellent! The property-based test here will catch edge cases
I wouldn't have thought of.

✅ This is a great abstraction—the API is intuitive and hard to misuse.
```

### 5. Author Response

**Addressing feedback:**

1. **Acknowledge all comments** - Even if you disagree
2. **Ask clarifying questions** - If feedback unclear
3. **Implement must-fix items** - Safety/correctness first
4. **Discuss alternatives** - For should-fix items
5. **Explain decisions** - Document why you chose an approach

**Handling disagreements:**

- **Assume good intent** - Reviewers want to help
- **Seek to understand** - Ask why they suggest changes
- **Explain your reasoning** - Share your thought process
- **Find compromise** - Often there's a middle ground
- **Escalate respectfully** - If consensus can't be reached, involve tech lead

**Response template:**

```markdown
> Reviewer: Could we use a HashMap instead of Vec for O(1) lookups?

Good catch! I initially used Vec because the dataset is always \u003c10 items,
so linear search is actually faster (better cache locality). I added a
comment explaining this tradeoff and a const assertion that panics at
compile-time if the vec size exceeds 10.

Commit: abc123f
```

### 6. Follow-Up Review

**Reviewers verify:**

- [ ] All must-fix items addressed
- [ ] Should-fix items addressed or discussed
- [ ] New changes don't introduce issues
- [ ] Tests still passing
- [ ] CI checks green

**Approval:**

```markdown
✅ Approved! The refactoring looks great, and the additional tests
give me confidence this is ready. Thanks for the clear explanations
on the HashMap vs Vec decision.
```

### 7. Merge

**Merge requirements:**

- [ ] Two senior engineer approvals
- [ ] All automated checks passing
- [ ] All reviewer feedback addressed
- [ ] No unresolved conversations
- [ ] Squash or rebase to clean history

**Merge commit message:**

```
feat: Add user preference system (#123)

Implements user preference storage and retrieval with type-safe
preference keys and automatic versioning.

- Added PreferenceKey enum for type safety
- Implemented versioned preference migration
- 100% test coverage with property-based tests
- Benchmarks show \u003c1ms preference lookup

Fixes #45
Reviewed-by: @alice @bob
```

---

## Review Turnaround Times

### Target Response Times

- **Normal PR** (non-blocking): Within 24 hours
- **Urgent PR** (blocking work): Within 4 hours
- **Hotfix PR** (production issue): Immediate

### Managing Review Load (Heijunka)

**Avoid overburdening:**

- **Distribute work** - Balance reviews across team
- **Set expectations** - Communicate review capacity
- **Batch small changes** - Group minor fixes
- **Dedicated review time** - Schedule focus time

**If overloaded:**

- Communicate to team: "I'm at capacity, can someone else take this?"
- Defer non-urgent reviews to next day
- Request help from tech lead

---

## PR Size Guidelines

### Ideal Sizes

- **Small PR**: 1-100 lines - Review in \u003c15 minutes
- **Medium PR**: 100-300 lines - Review in 30 minutes
- **Large PR**: 300-500 lines - Review in 1 hour
- **Too Large**: >500 lines - Should be split

### Breaking Down Large Changes

**Strategies for splitting:**

1. **Preparatory refactoring** - Extract common code first
2. **Feature flags** - Merge incomplete features behind flags
3. **API then implementation** - Review interface first
4. **Module by module** - One component at a time

**Example sequence:**

```
PR #1: Refactor existing code for new feature (200 lines)
PR #2: Add new API types and interfaces (150 lines)
PR #3: Implement core logic (300 lines)
PR #4: Add integration tests and documentation (200 lines)
```

---

## Special Review Types

### Refactoring Review

**Focus on:**

- [ ] Behavior unchanged (add tests to prove)
- [ ] Performance not regressed
- [ ] No new bugs introduced
- [ ] Improved maintainability

**Verify:**
```bash
# Run before and after benchmarks
cargo bench --bench my_module > before.txt
# Apply refactoring
cargo bench --bench my_module > after.txt
diff before.txt after.txt  # Should be similar
```

### Security-Critical Review

**Enhanced process:**

- [ ] Security team involvement
- [ ] Threat model reviewed
- [ ] Penetration testing considered
- [ ] Third-party audit if high-risk
- [ ] Security checklist fully completed

### Performance-Critical Review

**Additional verification:**

- [ ] Benchmarks included
- [ ] Performance targets documented
- [ ] Profiling data provided
- [ ] Memory usage analyzed
- [ ] No regressions verified

---

## Review Meetings (Optional)

### When to Use Synchronous Review

- **Complex architectural changes** - Whiteboard discussion helpful
- **Learning opportunities** - Junior engineer education
- **Disagreements** - Real-time consensus building
- **Critical deadlines** - Faster feedback loop

### Meeting Structure (30-60 minutes)

1. **Author presents** (10 min) - Walkthrough of changes
2. **Questions** (10 min) - Clarification and understanding
3. **Concerns** (10 min) - Safety, correctness, quality issues
4. **Solutions** (10 min) - Collaborative problem solving
5. **Action items** (5 min) - Document next steps

### Post-Meeting Follow-Up

- Document decisions in PR comments
- Author implements agreed changes
- Async approval after changes made

---

## Constructive Feedback Patterns

### Ask Questions, Don't Command

```markdown
# ❌ Commanding
"Change this to use a BTreeMap."

# ✅ Question-based
"I see you're using a Vec here. Have you considered a BTreeMap for
faster lookups? Or is the dataset small enough that Vec is actually
faster due to cache locality?"
```

### Explain the "Why"

```markdown
# ❌ No context
"Use #[must_use] here."

# ✅ Educational
"Consider adding #[must_use] to this function. Since it returns a Result,
callers should be forced to handle it—otherwise they might think the
operation succeeded when it actually failed silently."
```

### Offer Alternatives

```markdown
# ❌ Single solution
"Use Arc<Mutex<T>> here."

# ✅ Multiple options
"For thread-safe access, you could use:
1. Arc<Mutex<T>> - Simple but blocks on contention
2. Arc<RwLock<T>> - Better if reads >> writes
3. Message passing via channels - Best for this use case since you're
   just coordinating shutdown

I'd lean toward #3 here. Thoughts?"
```

### Frame as Suggestions

```markdown
# ❌ Prescriptive
"You need to add error context here."

# ✅ Suggestive
"💡 Adding error context here might help with debugging. Something like:

.map_err(|e| Error::DatabaseConnection {
    source: e,
    connection_string: sanitize_connection_string(&url),
})

Would make logs more actionable."
```

---

## Handling Difficult Situations

### Repeated Issues

**Instead of frustration:**

```markdown
# ❌ Exasperated
"Again with the unwrap()? We've talked about this."

# ✅ Systematic fix
"I'm noticing unwrap() appears frequently across PRs. Let's add a
Clippy lint to catch this automatically:

#![deny(clippy::unwrap_used)]

This way the compiler will enforce it, and we don't have to remember."
```

**Action:** Create systemic improvements, not just point out issues repeatedly.

### Strong Disagreements

**Escalation path:**

1. **Discuss in PR** - Try to reach understanding
2. **Synchronous chat** - Real-time conversation
3. **Review meeting** - Face-to-face consensus building
4. **Tech lead decision** - Final call if no consensus
5. **Document outcome** - Record decision and reasoning

### Time Pressure vs Quality

**When deadline looms:**

```markdown
# ❌ Skip review
"Just merge it, we'll fix it later."

# ✅ Risk-based triage
"Given the deadline, let's focus on the must-fix items (safety,
correctness) and create follow-up tickets for the should-fix items
(refactoring, additional tests).

Must fix before merge:
- [ ] Remove unwrap() on line 42
- [ ] Add input validation for API endpoint

Can defer to follow-up:
- [ ] Extract helper function (ticket #234)
- [ ] Add property-based tests (ticket #235)"
```

**Never compromise on safety or correctness.**

---

## Review Metrics & Improvement

### Track These Metrics

- **Review turnaround time** - Median time from PR to approval
- **Review comments per PR** - Trend over time
- **Defect escape rate** - Bugs found in production
- **Rework rate** - How often PRs need major changes
- **Review distribution** - Load balance across team

### Monthly Review Retrospective

**Questions to ask:**

1. What slowed down reviews this month?
2. What helped reviews go smoothly?
3. Are we catching bugs effectively?
4. Is review feedback constructive?
5. Are junior engineers learning?
6. Is workload sustainable?

### Continuous Improvement Actions

Based on metrics and retrospectives:

- Update review checklists
- Add automated checks
- Improve CI pipeline
- Adjust team processes
- Invest in training

---

## Tools & Automation

### GitHub/GitLab Configuration

**Branch protection rules:**
```yaml
required_reviews: 2
dismiss_stale_reviews: true
require_code_owner_reviews: true
required_status_checks:
  - ci/test
  - ci/lint
  - ci/security
```

**CODEOWNERS:**
```
# Require specific reviewers for sensitive areas
/src/unsafe/**        @unsafe-specialists
/src/security/**      @security-team
Cargo.lock            @dependency-team
```

### Automated Review Tools

**Pre-commit hooks:**
```bash
#!/bin/bash
# .git/hooks/pre-commit
cargo fmt --check || exit 1
cargo clippy -- -D warnings || exit 1
cargo test --quiet || exit 1
```

**CI checks:**
```yaml
# .github/workflows/review.yml
- name: Format check
  run: cargo fmt --check

- name: Lint
  run: cargo clippy --all-features -- -D warnings

- name: Tests
  run: cargo test --all-features

- name: Coverage
  run: cargo llvm-cov --fail-under-lines 90

- name: Security audit
  run: cargo audit

- name: Dependency check
  run: cargo deny check
```

---

## Review Anti-Patterns to Avoid

### ❌ Rubber Stamping

Approving without actually reviewing.

**Fix:** Allocate proper time, check out and run code.

### ❌ Nitpicking Without Automation

Spending review time on formatting or style.

**Fix:** Automate with rustfmt and clippy. Focus human review on logic.

### ❌ Blocking on Preferences

"I would have done it differently" without technical justification.

**Fix:** Distinguish between must-fix and nice-to-have. Respect author autonomy.

### ❌ Review Fatigue

Rushing through reviews due to overload.

**Fix:** Limit WIP, balance load, schedule dedicated review time.

### ❌ Harsh Tone

"This code is terrible" or "What were you thinking?"

**Fix:** Assume good intent, ask questions, be constructive.

---

## Summary: Review Excellence

1. **Consensus building** - Nemawashi, not gatekeeping
2. **Two senior approvals** - Ensure quality and knowledge sharing
3. **Check out locally** - Genchi Genbutsu (go and see)
4. **Constructive feedback** - Questions, alternatives, explanations
5. **Timely reviews** - \u003c24 hours for normal PRs
6. **Appropriate sizing** - ~300 lines ideal, 500 max
7. **Stop the line** - Jidoka on safety/correctness issues
8. **Continuous improvement** - Kaizen through retrospectives
9. **Sustainable workload** - Heijunka (level the work)
10. **Respect for people** - Collaborative, not adversarial

**Remember:** Code review is a conversation between colleagues working toward a shared goal—excellent software and excellent engineers. The process should build both.
