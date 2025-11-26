# Rebase vs Merge Decision Guide

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Decision Framework](#decision-framework)
3. [Scenarios](#scenarios)
4. [Commands Reference](#commands-reference)
5. [Conflict Resolution](#conflict-resolution)
6. [Team Policies](#team-policies)

---

## Core Concepts

### Git Merge

Creates a new commit that combines changes from two branches, preserving full history.

```
Before merge:
main:    A───B───C
              \
feature:       D───E

After merge:
main:    A───B───C───────M
              \         /
feature:       D───E───┘
```

**Characteristics:**
- Non-destructive operation
- Preserves complete history
- Creates merge commits
- Shows when branches diverged/converged
- Safe for shared branches

### Git Rebase

Moves commits to a new base, rewriting history for a linear progression.

```
Before rebase:
main:    A───B───C
              \
feature:       D───E

After rebase:
main:    A───B───C
                  \
feature:           D'───E'
```

**Characteristics:**
- Rewrites commit history
- Creates linear history
- No merge commits
- Cleaner git log
- Dangerous for shared branches

### Interactive Rebase

Edit, squash, reorder, or drop commits during rebase.

```bash
git rebase -i HEAD~3

# Opens editor with:
pick abc1234 First commit
pick def5678 Second commit
pick ghi9012 Third commit

# Commands:
# p, pick = use commit
# r, reword = use commit, edit message
# e, edit = use commit, stop for amending
# s, squash = meld into previous commit
# f, fixup = like squash, discard message
# d, drop = remove commit
```

---

## Decision Framework

### Primary Decision Tree

```
Is the branch shared with other developers?
│
├─ YES ──────────────────────────────────────→ Use MERGE
│   (Force pushing would break their work)
│
└─ NO → Is this PR under active review with inline comments?
        │
        ├─ YES → Are you making reviewer-requested changes?
        │        │
        │        ├─ YES ──────────────────────→ Use MERGE
        │        │   (Preserves comment context)
        │        │
        │        └─ NO → Is review almost done?
        │                 │
        │                 ├─ YES ────────────→ Use MERGE
        │                 └─ NO ─────────────→ Use REBASE
        │
        └─ NO → Do you want clean, linear history?
                 │
                 ├─ YES ─────────────────────→ Use REBASE
                 └─ NO ──────────────────────→ Use MERGE
```

### Quick Rules

| Situation | Recommendation |
|-----------|----------------|
| Updating feature branch with main | Rebase |
| Merging feature into main | Merge (or squash) |
| Shared branch with collaborators | Merge only |
| PR with active review comments | Merge |
| Cleaning up local commits | Interactive rebase |
| Combining multiple PRs | Merge |
| Hotfix to production | Merge |

### The Golden Rule

> **Never rebase commits that have been pushed and shared with others.**

If someone has based work on your commits and you rebase, their repository will have commits that no longer exist in yours, causing serious coordination problems.

---

## Scenarios

### Scenario 1: Keeping Feature Branch Updated

**Situation:** You're working on a feature branch and main has new commits.

**Recommended:** Rebase (if branch is private)

```bash
# On feature branch
git fetch origin
git rebase origin/main

# If conflicts, resolve then:
git add .
git rebase --continue

# Force push (only if private branch!)
git push --force-with-lease origin feature-branch
```

**Why Rebase:**
- Keeps history linear
- Your commits stay on top
- Easier to review
- Clean merge later

**Alternative (Merge):**
```bash
git fetch origin
git merge origin/main
```

Use merge if:
- Branch is shared
- You want to preserve the merge point

---

### Scenario 2: Merging Feature into Main

**Situation:** Feature is complete, approved, ready to merge.

**Recommended:** Squash merge (via GitHub)

```bash
# GitHub UI: "Squash and merge"

# Or CLI:
git checkout main
git merge --squash feature-branch
git commit -m "feat: complete user authentication"
git push origin main
```

**Why Squash:**
- Single commit for feature
- Clean main history
- WIP commits hidden
- Easy to revert if needed

**Alternative (Merge commit):**
```bash
git checkout main
git merge --no-ff feature-branch
git push origin main
```

Use merge commit if:
- Audit trail required
- Multiple logical commits worth preserving

---

### Scenario 3: PR Under Active Review

**Situation:** Reviewers have left inline comments on specific lines.

**Recommended:** Merge (to update from main)

```bash
git checkout feature-branch
git fetch origin
git merge origin/main
git push origin feature-branch
```

**Why Merge:**
- Preserves line numbers
- Comments stay in context
- Reviewers see incremental changes
- Less confusing for everyone

**After Review Complete:**
```bash
# Clean up with interactive rebase before final merge
git rebase -i HEAD~5  # squash fixup commits
git push --force-with-lease origin feature-branch
# Then squash merge to main
```

---

### Scenario 4: Collaborative Branch

**Situation:** Multiple developers working on same branch.

**Recommended:** Merge only, never rebase

```bash
# Always merge to get updates
git fetch origin
git merge origin/shared-branch

# Never do this:
# git rebase origin/shared-branch  # DANGEROUS!
```

**Why Merge Only:**
- Rebase rewrites history
- Others' local copies become invalid
- Duplicate commits appear
- Can lose work

**Coordination Tips:**
- Communicate before force operations
- Use feature flags for parallel work
- Keep shared branches short-lived
- Consider splitting into individual branches

---

### Scenario 5: Cleaning Up Local Commits

**Situation:** You have messy local commits before pushing.

**Recommended:** Interactive rebase

```bash
# Before pushing, clean up last 5 commits
git rebase -i HEAD~5

# In editor, combine related commits:
pick abc1234 feat: add user model
squash def5678 fix: typo in user model
squash ghi9012 fix: add missing field
pick jkl3456 feat: add user controller
fixup mno7890 fix: lint error

# Result: 2 clean commits instead of 5
```

**Common Cleanups:**
```bash
# Squash fixup commits
squash/fixup

# Reword unclear messages
reword

# Reorder commits logically
# Just move lines in editor

# Drop accidental commits
drop
```

---

### Scenario 6: Resolving Conflicts

**During Merge:**
```bash
git merge feature-branch
# CONFLICT in file.ts

# Resolve conflicts in editor
# Look for <<<<<<<, =======, >>>>>>>

git add file.ts
git commit  # Completes merge
```

**During Rebase:**
```bash
git rebase main
# CONFLICT in file.ts

# Resolve conflicts in editor
git add file.ts
git rebase --continue

# If you want to abort:
git rebase --abort
```

**Key Difference:**
- Merge: Resolve once
- Rebase: May resolve same conflict multiple times (per commit)

---

## Commands Reference

### Merge Commands

```bash
# Standard merge (creates merge commit)
git merge feature-branch

# No fast-forward (always create merge commit)
git merge --no-ff feature-branch

# Fast-forward only (fail if not possible)
git merge --ff-only feature-branch

# Squash merge (combine all commits)
git merge --squash feature-branch

# Abort conflicted merge
git merge --abort
```

### Rebase Commands

```bash
# Standard rebase
git rebase main

# Interactive rebase
git rebase -i HEAD~5
git rebase -i main

# Continue after conflict
git rebase --continue

# Skip problematic commit
git rebase --skip

# Abort rebase
git rebase --abort

# Rebase preserving merge commits
git rebase --rebase-merges main
```

### Push After Rebase

```bash
# Safe force push (recommended)
git push --force-with-lease origin branch

# Force push (use carefully!)
git push --force origin branch

# Never force push to:
# - main/master
# - develop
# - shared branches
```

### Recovery Commands

```bash
# Undo last merge
git reset --hard HEAD~1

# Find lost commits after rebase
git reflog
git checkout <sha>

# Restore branch to remote state
git fetch origin
git reset --hard origin/branch-name
```

---

## Conflict Resolution

### Understanding Conflict Markers

```
<<<<<<< HEAD (or current branch)
Your changes
=======
Their changes
>>>>>>> feature-branch (or incoming)
```

### Resolution Strategies

**Keep Ours:**
```bash
git checkout --ours file.ts
git add file.ts
```

**Keep Theirs:**
```bash
git checkout --theirs file.ts
git add file.ts
```

**Manual Resolution:**
1. Open file in editor
2. Remove conflict markers
3. Keep/combine desired changes
4. `git add file.ts`

### VS Code Conflict Resolution

```
Accept Current Change    (keep yours)
Accept Incoming Change   (keep theirs)
Accept Both Changes      (keep both)
Compare Changes          (side by side)
```

### Reducing Conflicts

1. **Rebase frequently** - Don't let branch diverge far
2. **Small PRs** - Less chance of overlap
3. **Communicate** - Know who's working where
4. **Feature flags** - Parallel work without conflicts
5. **Clear ownership** - Avoid simultaneous file edits

---

## Team Policies

### Suggested Team Policy

```markdown
# Git Merge/Rebase Policy

## Branch Updates
- Private branches: Rebase onto main
- Shared branches: Merge only
- During review: Merge for updates

## Merging to Main
- Default: Squash merge
- Multiple logical commits: Merge commit
- Always via PR, never direct push

## Force Pushing
- Allowed: Private feature branches
- Required: Use --force-with-lease
- Forbidden: main, develop, release/*

## Conflict Resolution
- Resolver: PR author
- Deadline: 24 hours
- Help: Tag reviewer if stuck
```

### Branch Protection Settings

```yaml
# GitHub branch protection for main
main:
  required_pull_request_reviews:
    required_approving_review_count: 1
  required_status_checks:
    strict: true  # Requires branch up to date
  allow_force_pushes: false
  allow_deletions: false
```

---

## Quick Reference Card

```
┌────────────────────────────────────────────────┐
│              REBASE vs MERGE                    │
├────────────────────────────────────────────────┤
│                                                │
│  MERGE when:                                   │
│  ✓ Branch is shared with others               │
│  ✓ PR has active review comments              │
│  ✓ Merging feature → main                     │
│  ✓ You need audit trail                       │
│                                                │
│  REBASE when:                                  │
│  ✓ Updating private branch from main          │
│  ✓ Cleaning up local commits                  │
│  ✓ You want linear history                    │
│  ✓ Before opening PR                          │
│                                                │
│  NEVER REBASE:                                 │
│  ✗ Commits already pushed & shared            │
│  ✗ main/master/develop branches               │
│  ✗ During active PR review                    │
│                                                │
│  RECOVERY:                                     │
│  git reflog → find lost commits               │
│  git reset --hard HEAD~1 → undo merge         │
│  git rebase --abort → cancel rebase           │
│                                                │
└────────────────────────────────────────────────┘
```

---

**Sources**: [Atlassian Merging vs Rebasing](https://www.atlassian.com/git/tutorials/merging-vs-rebasing), [Git Documentation](https://git-scm.com/docs), [DataCamp Git Guide](https://www.datacamp.com/blog/git-merge-vs-git-rebase)
