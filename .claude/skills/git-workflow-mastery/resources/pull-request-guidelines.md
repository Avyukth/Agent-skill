# Pull Request Guidelines

## Table of Contents

1. [PR Size Guidelines](#pr-size-guidelines)
2. [PR Templates](#pr-templates)
3. [Review Process](#review-process)
4. [Merge Strategies](#merge-strategies)
5. [Stacked PRs](#stacked-prs)
6. [Draft PRs](#draft-prs)

---

## PR Size Guidelines

### Size Ratings

| Lines Changed | Rating | Review Time | Approval Rate |
|---------------|--------|-------------|---------------|
| 1-50 | Excellent | 10-15 min | 95% first pass |
| 50-150 | Very Good | 15-30 min | 85% first pass |
| 150-250 | Good | 30-60 min | 70% first pass |
| 250-400 | Acceptable | 1-2 hours | 50% first pass |
| 400-500 | Needs Split | 2-4 hours | 30% first pass |
| 500+ | Too Large | Don't submit | Split required |

### Why Small PRs?

**Research shows:**
- PRs under 200 lines have **40% fewer defects**
- Review quality drops **50% after 400 lines**
- Large PRs take **exponentially longer** to review
- Small PRs merge **2-3x faster**

### Splitting Large PRs

#### By Layer

```
Original: Full feature (800 lines)

Split into:
1. PR #1: Database schema + migrations (150 lines)
2. PR #2: Repository layer (200 lines)
3. PR #3: Service layer (200 lines)
4. PR #4: API endpoints (150 lines)
5. PR #5: Frontend components (100 lines)
```

#### By Functionality

```
Original: User management feature (600 lines)

Split into:
1. PR #1: User creation (200 lines)
2. PR #2: User update (150 lines)
3. PR #3: User deletion (100 lines)
4. PR #4: User listing + search (150 lines)
```

#### By Refactor vs Feature

```
Original: Feature + refactor (500 lines)

Split into:
1. PR #1: Refactoring only (200 lines)
2. PR #2: New feature (300 lines)
```

---

## PR Templates

### Standard Template

```markdown
## Summary

Brief description of what this PR does (1-2 sentences).

## Type of Change

- [ ] `feat`: New feature
- [ ] `fix`: Bug fix
- [ ] `refactor`: Code refactoring
- [ ] `docs`: Documentation
- [ ] `test`: Tests
- [ ] `chore`: Maintenance
- [ ] `perf`: Performance improvement

## Related Issues

Closes #123
Related to #456

## Changes Made

- Added X functionality
- Modified Y behavior
- Removed Z dependency

## Test Plan

- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Edge cases covered

## Screenshots (if applicable)

| Before | After |
|--------|-------|
| image  | image |

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings/errors
- [ ] PR is appropriately sized (< 250 lines)

## Additional Notes

Any context, caveats, or follow-up work needed.
```

### Bug Fix Template

```markdown
## Bug Description

Brief description of the bug being fixed.

## Root Cause

What caused this bug?

## Solution

How does this PR fix the issue?

## Reproduction Steps (Before Fix)

1. Step 1
2. Step 2
3. Observe bug

## Verification (After Fix)

1. Step 1
2. Step 2
3. Bug no longer occurs

## Test Coverage

- [ ] Regression test added
- [ ] Related tests updated
- [ ] Manual verification done

## Related Issues

Fixes #123
```

### Feature Template

```markdown
## Feature Description

What new functionality does this add?

## User Story

As a [user type], I want [feature] so that [benefit].

## Implementation Details

### Architecture Decision

Brief explanation of approach chosen.

### Key Changes

1. Component A: Description
2. Component B: Description

## Feature Flag

- Flag name: `feature_xyz_enabled`
- Default: `false`
- Rollout plan: Staged 10% → 50% → 100%

## Test Plan

### Unit Tests
- [ ] Test case 1
- [ ] Test case 2

### Integration Tests
- [ ] End-to-end flow

### Manual Testing
- [ ] Scenario 1
- [ ] Scenario 2

## Documentation

- [ ] README updated
- [ ] API docs updated
- [ ] User guide updated

## Rollback Plan

How to disable/rollback if issues arise.
```

### Refactor Template

```markdown
## Refactor Summary

What is being refactored and why?

## Motivation

- Current problem
- Technical debt addressed
- Future benefits

## Approach

Brief description of refactoring strategy.

## Changes

### Before
```code
Old implementation
```

### After
```code
New implementation
```

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Risk 1 | Mitigation 1 |

## Verification

- [ ] All existing tests pass
- [ ] No behavior changes
- [ ] Performance unchanged or improved
- [ ] No new warnings

## Follow-up

Any cleanup or future work needed.
```

---

## Review Process

### Reviewer Guidelines

#### Before Reviewing

1. **Understand context** - Read description, linked issues
2. **Check PR size** - Request split if > 400 lines
3. **Set time aside** - Don't review in fragments

#### During Review

**Code Quality**
- [ ] Logic is correct
- [ ] Edge cases handled
- [ ] Error handling present
- [ ] No security vulnerabilities
- [ ] Performance acceptable

**Style & Standards**
- [ ] Follows project conventions
- [ ] Consistent naming
- [ ] Appropriate comments
- [ ] No dead code

**Testing**
- [ ] Tests are meaningful
- [ ] Coverage adequate
- [ ] Edge cases tested
- [ ] Mocks appropriate

**Documentation**
- [ ] Public APIs documented
- [ ] Complex logic explained
- [ ] README updated if needed

#### Review Comments

**Be Constructive**
```
❌ "This is wrong"
✅ "Consider using X here because Y. Here's an example: ..."

❌ "Why would you do this?"
✅ "I'm curious about this approach. What led to this decision over Z?"
```

**Use Prefixes**
```
[nit] Minor style suggestion, not blocking
[suggestion] Recommended improvement, not required
[question] Seeking clarification
[blocking] Must be addressed before merge
[praise] Highlighting good code
```

**Provide Examples**
```markdown
[suggestion] Consider extracting this into a helper function:

```typescript
// Instead of:
const result = items.filter(i => i.active).map(i => i.name);

// Consider:
const getActiveNames = (items: Item[]) =>
  items.filter(i => i.active).map(i => i.name);

const result = getActiveNames(items);
```

This improves testability and reusability.
```

### Author Guidelines

#### Before Requesting Review

1. **Self-review first** - Read your own diff
2. **Run all checks** - Tests, lint, type check
3. **Add context** - Description, screenshots, notes
4. **Keep it small** - Split if needed

#### Responding to Feedback

```
✅ Good Responses:
- "Good catch, fixed in abc1234"
- "I chose X because Y, but I see your point. Changed to Z."
- "Can you clarify what you mean by...?"

❌ Poor Responses:
- "It works fine"
- "I don't have time for this"
- (No response at all)
```

#### Response Timeline

| Review Type | Expected Response |
|-------------|-------------------|
| Blocking | Within 4 hours |
| Suggestion | Within 24 hours |
| Question | Within 24 hours |
| Nit | At your discretion |

---

## Merge Strategies

### Merge Commit

```bash
git merge --no-ff feature-branch
```

**Creates:**
```
main: ───●───●───●───M───
                    /
feature: ───●───●───●
```

**Use When:**
- Preserving full history
- Audit requirements
- Tracking feature branches

### Squash Merge

```bash
git merge --squash feature-branch
git commit -m "feat: complete feature X"
```

**Creates:**
```
main: ───●───●───●───S───

feature: ───●───●───● (preserved but disconnected)
```

**Use When:**
- Clean linear history preferred
- Many small WIP commits in PR
- Single logical change

### Rebase Merge

```bash
git rebase main feature-branch
git checkout main
git merge feature-branch
```

**Creates:**
```
main: ───●───●───●───●───●───●
                     (replayed commits)
```

**Use When:**
- Linear history required
- Each commit is meaningful
- CI passes for each commit

### Strategy Decision Tree

```
Are individual commits meaningful?
├─ NO → Squash
└─ YES → Do you need merge commit for audit?
         ├─ YES → Merge commit
         └─ NO → Rebase
```

### GitHub Settings

```yaml
# Recommended repository settings
merge_commit: false      # Disable merge commits
squash_merge: true       # Enable squash (default)
rebase_merge: true       # Enable for advanced users
auto_merge: true         # Enable auto-merge on approval
delete_branch: true      # Auto-delete after merge
```

---

## Stacked PRs

### What Are Stacked PRs?

Multiple dependent PRs that build on each other, reviewed in parallel.

### Structure

```
main
 │
 └─ PR #1: Base changes (merged first)
     │
     └─ PR #2: Builds on PR #1
         │
         └─ PR #3: Builds on PR #2
```

### Workflow

```bash
# Create first branch
git checkout -b stack/part-1 main
# Make changes
git commit -m "feat: part 1 of feature"
git push origin stack/part-1
# Open PR #1: base → main

# Create second branch from first
git checkout -b stack/part-2 stack/part-1
# Make changes
git commit -m "feat: part 2 of feature"
git push origin stack/part-2
# Open PR #2: stack/part-2 → stack/part-1

# After PR #1 merges
git checkout stack/part-2
git rebase main
git push --force-with-lease origin stack/part-2
# Update PR #2: base → main
```

### Tools

- **Graphite** - Stacked PR management
- **gh-stack** - GitHub CLI extension
- **git-branchless** - Advanced Git workflows

### When to Use

- Large features that can't be split independently
- Sequential changes with dependencies
- Parallel review of related work
- Team wants to review early

---

## Draft PRs

### Purpose

- **Early feedback** - Get input before completion
- **Visibility** - Show work in progress
- **CI validation** - Run checks during development
- **Documentation** - Track approach decisions

### Workflow

```bash
# Create draft PR early
git checkout -b feature/new-thing
git commit -m "wip: initial structure"
git push origin feature/new-thing
# Open as Draft PR on GitHub

# Continue work
git commit -m "wip: add core logic"
git push

# Ready for review
# Click "Ready for review" on GitHub
# Or use CLI: gh pr ready
```

### Draft PR Description Template

```markdown
## WIP: Feature Name

⚠️ **This is a draft PR - not ready for review**

### Status

- [x] Initial structure
- [x] Core logic
- [ ] Error handling
- [ ] Tests
- [ ] Documentation

### Questions/Feedback Needed

1. Should we use approach A or B for X?
2. Is this the right place for Y?

### TODO Before Ready

- Add unit tests
- Handle edge case Z
- Update API docs

---
*Will mark ready when checklist complete*
```

### Best Practices

1. **Open early** - Within first hour of work
2. **Update regularly** - Push at least daily
3. **Communicate status** - Keep checklist updated
4. **Request specific feedback** - Ask targeted questions
5. **Mark ready promptly** - Don't leave in draft too long

---

## Quick Reference

### PR Checklist

```
Before Opening:
□ Code complete and tested
□ Self-review done
□ PR size < 250 lines
□ Description filled out
□ Related issues linked

During Review:
□ Respond to feedback promptly
□ Push fixes in separate commits
□ Re-request review after changes

Before Merge:
□ All checks passing
□ Required approvals obtained
□ Conflicts resolved
□ Branch up to date
```

### Review Shorthand

```
LGTM - Looks Good To Me (approve)
PTAL - Please Take A Look (request review)
WIP  - Work In Progress
RFC  - Request For Comments
IMO  - In My Opinion
IIRC - If I Recall Correctly
TIL  - Today I Learned
```

---

**Sources**: [Google Engineering Practices](https://google.github.io/eng-practices/review/), [GitHub Docs](https://docs.github.com/en/pull-requests), [Conventional Comments](https://conventionalcomments.org/)
