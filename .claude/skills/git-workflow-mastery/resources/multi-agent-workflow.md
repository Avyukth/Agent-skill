# Multi-Agent Development Workflow

## Table of Contents

1. [Overview](#overview)
2. [Agent Coordination](#agent-coordination)
3. [Branch Management](#branch-management)
4. [Conflict Prevention](#conflict-prevention)
5. [Batch Integration](#batch-integration)
6. [Orchestration Tools](#orchestration-tools)
7. [Monitoring and Metrics](#monitoring-and-metrics)

---

## Overview

### What is Multi-Agent Development?

Multiple AI agents or developers working in parallel on the same codebase, each handling independent features or tasks that converge through a coordinated integration process.

### Key Principles

1. **No Overlapping Features** - Orchestrator assigns disjoint work
2. **Short-Lived Branches** - Hours to days, not weeks
3. **Frequent Synchronization** - Rebase every 2 hours
4. **TDD-First** - Tests before implementation
5. **Small PRs** - 150-250 lines of code
6. **Batch Security** - Hardening happens on integration branch
7. **Feature Flags** - Partial features are toggled off

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATOR                              │
│  • Task assignment via GitHub Issues                            │
│  • Conflict detection                                           │
│  • Batch coordination                                           │
└──────────┬─────────────┬─────────────┬─────────────┬───────────┘
           │             │             │             │
     ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
     │  Agent 1  │ │  Agent 2  │ │  Agent 3  │ │  Agent N  │
     │  Feature  │ │  Bugfix   │ │  Feature  │ │    ...    │
     └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
           │             │             │             │
           └─────────────┴──────┬──────┴─────────────┘
                                │
                    ┌───────────▼───────────┐
                    │    Integration        │
                    │    Branch             │
                    │    (Batch Hardening)  │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │        main           │
                    │    (Production)       │
                    └───────────────────────┘
```

---

## Agent Coordination

### Task Assignment

#### GitHub Issues as Work Units

```markdown
# Issue Template: Agent Task

## Task: [Feature/Bugfix Name]

**Assigned Agent:** agent-1
**Estimated LoC:** 200
**Target Branch:** agent-1-feat-user-auth

### Description
Clear description of what needs to be done.

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] All tests pass

### Files to Modify
- `src/auth/login.ts`
- `src/services/user.ts`

### Dependencies
- None / Depends on #123

### Feature Flag
`feature_user_auth_enabled`
```

#### Assignment Rules

1. **No File Overlap** - Different agents, different files
2. **Clear Boundaries** - Each task has explicit file list
3. **Dependency Order** - Tasks ordered by dependencies
4. **Size Limits** - Max 250 LoC per task
5. **Time Boxes** - Max 24 hours per task

### Communication Protocol

```yaml
# Agent Status Updates
format: "STATUS: {agent-id} | {status} | {branch} | {progress}"

statuses:
  - STARTED: Beginning work on task
  - IN_PROGRESS: Actively developing
  - TESTING: Running tests
  - READY: PR ready for batch
  - BLOCKED: Waiting on dependency
  - CONFLICT: Merge conflict detected

examples:
  - "STATUS: agent-1 | STARTED | agent-1-feat-auth | 0%"
  - "STATUS: agent-2 | READY | agent-2-fix-validation | 100%"
  - "STATUS: agent-3 | CONFLICT | agent-3-feat-profile | 80%"
```

---

## Branch Management

### Branch Naming Convention

```
agent-{id}-{type}-{short-description}

# Examples
agent-1-feat-user-authentication
agent-2-fix-validation-error
agent-3-refactor-api-client
agent-4-test-payment-flow
```

### Agent Workflow Steps

```bash
#!/bin/bash
# agent-workflow.sh

# 1. Initialize
git checkout main
git pull origin main

# 2. Create branch
BRANCH="agent-${AGENT_ID}-feat-${FEATURE_NAME}"
git checkout -b "$BRANCH"

# 3. TDD Loop
while [ "$TESTS_PASSING" != "true" ]; do
    # Write failing test
    # Implement code
    # Run tests
    npm test
done

# 4. Commit with conventional format
git add .
git commit -m "feat(${SCOPE}): ${DESCRIPTION}"

# 5. Push and create draft PR
git push -u origin "$BRANCH"
gh pr create --draft --base integration --title "feat: ${DESCRIPTION}"

# 6. Auto-rebase loop (every 2 hours)
while [ "$PR_STATUS" == "draft" ]; do
    git fetch origin main
    git rebase origin/main || {
        echo "Conflict detected"
        exit 1
    }
    git push --force-with-lease
    sleep 7200  # 2 hours
done

# 7. Mark ready
gh pr ready
gh pr edit --add-label "ready-for-batch"
```

### Rebase Strategy

```bash
# Automatic rebase script
#!/bin/bash
# auto-rebase.sh

set -e

# Fetch latest
git fetch origin main

# Check for conflicts
if ! git rebase origin/main --dry-run 2>/dev/null; then
    echo "CONFLICT: Rebase would cause conflicts"
    # Notify orchestrator
    gh issue comment "$TASK_ISSUE" --body "Agent $AGENT_ID: Conflict detected during rebase"
    exit 1
fi

# Perform rebase
git rebase origin/main

# Force push (safe because branch is agent-owned)
git push --force-with-lease origin "$BRANCH"

echo "SUCCESS: Rebased on latest main"
```

---

## Conflict Prevention

### File Ownership Matrix

```yaml
# .github/agent-ownership.yml
ownership:
  agent-1:
    exclusive:
      - src/auth/**
      - src/services/auth*.ts
    shared:
      - src/types/index.ts  # Append only

  agent-2:
    exclusive:
      - src/api/users/**
      - src/repositories/user*.ts
    shared:
      - src/types/index.ts

  agent-3:
    exclusive:
      - src/components/profile/**
      - src/hooks/useProfile.ts
    shared:
      - src/types/index.ts

rules:
  exclusive: "Only assigned agent may modify"
  shared: "Append-only, coordinate changes"
```

### Conflict Detection

```yaml
# .github/workflows/conflict-detector.yml
name: Conflict Detector

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  detect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check for conflicts with other PRs
        uses: actions/github-script@v7
        with:
          script: |
            const { data: prs } = await github.rest.pulls.list({
              owner: context.repo.owner,
              repo: context.repo.repo,
              state: 'open',
              base: 'integration'
            });

            const currentPR = context.payload.pull_request;
            const currentFiles = await github.rest.pulls.listFiles({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: currentPR.number
            });

            const currentFileSet = new Set(currentFiles.data.map(f => f.filename));

            for (const pr of prs) {
              if (pr.number === currentPR.number) continue;

              const otherFiles = await github.rest.pulls.listFiles({
                owner: context.repo.owner,
                repo: context.repo.repo,
                pull_number: pr.number
              });

              const overlap = otherFiles.data.filter(f =>
                currentFileSet.has(f.filename)
              );

              if (overlap.length > 0) {
                const fileList = overlap.map(f => f.filename).join('\n- ');
                await github.rest.issues.createComment({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: currentPR.number,
                  body: `**Potential Conflict Warning**\n\nPR #${pr.number} modifies the same files:\n- ${fileList}\n\nCoordinate with the other agent to avoid conflicts.`
                });
              }
            }
```

### Shared File Strategies

#### Strategy 1: Append-Only Types

```typescript
// src/types/index.ts - Agents can only ADD, never modify existing

// Agent 1 added:
export interface User {
  id: string;
  name: string;
}

// Agent 2 added (no conflict):
export interface Product {
  id: string;
  price: number;
}

// Agent 3 added (no conflict):
export interface Order {
  id: string;
  userId: string;
  productIds: string[];
}
```

#### Strategy 2: File Partitioning

```
# Instead of one large file, split by feature
src/routes/
  auth.routes.ts      # Agent 1
  users.routes.ts     # Agent 2
  products.routes.ts  # Agent 3
  index.ts            # Auto-generated barrel
```

#### Strategy 3: Feature Flags in Config

```typescript
// src/config/features.ts
export const features = {
  // Agent 1 owns
  userAuth: process.env.FEATURE_USER_AUTH === 'true',

  // Agent 2 owns
  productSearch: process.env.FEATURE_PRODUCT_SEARCH === 'true',

  // Agent 3 owns
  orderHistory: process.env.FEATURE_ORDER_HISTORY === 'true',
};
```

---

## Batch Integration

### Batch Lifecycle

```
1. COLLECTION PHASE (0-48 hours)
   └─ Agents create PRs to integration
   └─ PRs marked "ready-for-batch" when complete
   └─ Auto-rebase keeps PRs current

2. BATCH THRESHOLD (3-7 PRs ready)
   └─ Orchestrator triggers batch merge
   └─ All ready PRs merged to integration

3. HARDENING PHASE (4-24 hours)
   └─ Security scans on integration
   └─ Auto-fix vulnerabilities
   └─ Human review of findings

4. PROMOTION PHASE
   └─ Integration merged to main
   └─ Integration branch deleted
   └─ Agents pull new main
   └─ Cycle restarts
```

### Batch Merge Workflow

```yaml
# .github/workflows/batch-merge.yml
name: Batch Merge

on:
  schedule:
    - cron: '0 */4 * * *'  # Every 4 hours
  workflow_dispatch:

jobs:
  check-batch:
    runs-on: ubuntu-latest
    outputs:
      should_merge: ${{ steps.check.outputs.should_merge }}
      pr_numbers: ${{ steps.check.outputs.pr_numbers }}
    steps:
      - name: Check batch readiness
        id: check
        uses: actions/github-script@v7
        with:
          script: |
            const { data: prs } = await github.rest.pulls.list({
              owner: context.repo.owner,
              repo: context.repo.repo,
              base: 'integration',
              state: 'open'
            });

            const readyPRs = prs.filter(pr =>
              pr.labels.some(l => l.name === 'ready-for-batch')
            );

            const shouldMerge = readyPRs.length >= 3;
            const prNumbers = readyPRs.slice(0, 7).map(p => p.number);

            core.setOutput('should_merge', shouldMerge);
            core.setOutput('pr_numbers', JSON.stringify(prNumbers));

            console.log(`Ready PRs: ${readyPRs.length}`);
            console.log(`Should merge: ${shouldMerge}`);

  merge-batch:
    needs: check-batch
    if: needs.check-batch.outputs.should_merge == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: integration
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Merge PRs
        uses: actions/github-script@v7
        with:
          script: |
            const prNumbers = JSON.parse('${{ needs.check-batch.outputs.pr_numbers }}');

            for (const prNumber of prNumbers) {
              try {
                // Verify PR is still ready
                const { data: pr } = await github.rest.pulls.get({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  pull_number: prNumber
                });

                if (pr.mergeable_state !== 'clean') {
                  console.log(`PR #${prNumber} is not mergeable: ${pr.mergeable_state}`);
                  continue;
                }

                // Merge with squash
                await github.rest.pulls.merge({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  pull_number: prNumber,
                  merge_method: 'squash'
                });

                console.log(`Merged PR #${prNumber}`);

                // Delete branch
                await github.rest.git.deleteRef({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  ref: `heads/${pr.head.ref}`
                });

              } catch (error) {
                console.log(`Failed to merge PR #${prNumber}: ${error.message}`);
              }
            }

      - name: Trigger hardening
        run: gh workflow run batch-security-hardening.yml
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Orchestration Tools

### GitHub Project Board Setup

```yaml
# Project columns
columns:
  - name: Backlog
    description: Tasks not yet assigned

  - name: Assigned
    description: Tasks assigned to agents

  - name: In Progress
    description: Agents actively working

  - name: PR Ready
    description: PRs awaiting batch

  - name: In Batch
    description: PRs in current batch

  - name: Done
    description: Merged to main

# Automation rules
automations:
  - when: issue.labeled('agent-*')
    move_to: Assigned

  - when: pull_request.opened
    move_to: In Progress

  - when: pull_request.labeled('ready-for-batch')
    move_to: PR Ready

  - when: pull_request.merged
    move_to: Done
```

### Orchestrator Dashboard

```yaml
# .github/workflows/dashboard-update.yml
name: Update Dashboard

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate dashboard
        uses: actions/github-script@v7
        with:
          script: |
            const { data: prs } = await github.rest.pulls.list({
              owner: context.repo.owner,
              repo: context.repo.repo,
              state: 'all',
              per_page: 100
            });

            const openPRs = prs.filter(p => p.state === 'open');
            const readyPRs = openPRs.filter(p =>
              p.labels.some(l => l.name === 'ready-for-batch')
            );

            const dashboard = `
            # Agent Dashboard

            **Updated:** ${new Date().toISOString()}

            ## Current Batch Status

            | Metric | Value |
            |--------|-------|
            | Open PRs | ${openPRs.length} |
            | Ready for Batch | ${readyPRs.length} |
            | Batch Threshold | 3-7 |

            ## Agent Status

            ${openPRs.map(pr => `| ${pr.head.ref.split('-')[0]}-${pr.head.ref.split('-')[1]} | ${pr.title} | ${pr.labels.map(l => l.name).join(', ')} |`).join('\n')}
            `;

            // Update dashboard issue or wiki page
            console.log(dashboard);
```

### Agent Health Monitor

```yaml
# .github/workflows/agent-health.yml
name: Agent Health Monitor

on:
  schedule:
    - cron: '0 * * * *'  # Hourly

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Check agent health
        uses: actions/github-script@v7
        with:
          script: |
            const { data: prs } = await github.rest.pulls.list({
              owner: context.repo.owner,
              repo: context.repo.repo,
              state: 'open'
            });

            const now = new Date();
            const alerts = [];

            for (const pr of prs) {
              const updated = new Date(pr.updated_at);
              const hoursStale = (now - updated) / (1000 * 60 * 60);

              // Alert if PR not updated in 4+ hours
              if (hoursStale > 4) {
                alerts.push({
                  pr: pr.number,
                  branch: pr.head.ref,
                  hoursStale: Math.round(hoursStale),
                  status: 'STALE'
                });
              }

              // Alert if PR has conflicts
              if (pr.mergeable_state === 'dirty') {
                alerts.push({
                  pr: pr.number,
                  branch: pr.head.ref,
                  status: 'CONFLICT'
                });
              }
            }

            if (alerts.length > 0) {
              console.log('Alerts:', JSON.stringify(alerts, null, 2));
              // Could send to Slack, email, etc.
            }
```

---

## Monitoring and Metrics

### Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| PR Cycle Time | < 24 hours | > 48 hours |
| Batch Size | 3-7 PRs | < 3 or > 7 |
| Conflict Rate | < 5% | > 10% |
| Rebase Failures | < 2% | > 5% |
| Security Findings | 0 critical | Any critical |
| Agent Utilization | > 80% | < 60% |

### Metrics Collection

```yaml
# .github/workflows/metrics.yml
name: Collect Metrics

on:
  schedule:
    - cron: '0 0 * * *'  # Daily

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - name: Collect PR metrics
        uses: actions/github-script@v7
        with:
          script: |
            const { data: prs } = await github.rest.pulls.list({
              owner: context.repo.owner,
              repo: context.repo.repo,
              state: 'closed',
              per_page: 100
            });

            const mergedPRs = prs.filter(p => p.merged_at);

            // Calculate cycle times
            const cycleTimes = mergedPRs.map(pr => {
              const created = new Date(pr.created_at);
              const merged = new Date(pr.merged_at);
              return (merged - created) / (1000 * 60 * 60); // hours
            });

            const avgCycleTime = cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length;

            console.log(`Average Cycle Time: ${avgCycleTime.toFixed(2)} hours`);
            console.log(`Total Merged PRs: ${mergedPRs.length}`);

      - name: Store metrics
        run: |
          # Store in time-series database or file
          echo "$(date -Iseconds),${AVG_CYCLE_TIME},${TOTAL_PRS}" >> metrics.csv
```

### Dashboard Example

```markdown
# Multi-Agent Development Dashboard

## Current Sprint

| Agent | Active PR | Status | Last Update |
|-------|-----------|--------|-------------|
| agent-1 | #45 | IN_PROGRESS | 2h ago |
| agent-2 | #46 | READY | 30m ago |
| agent-3 | #47 | TESTING | 1h ago |
| agent-4 | - | IDLE | - |

## Batch Status

```
[=========>          ] 4/7 PRs ready
```

Next batch merge: ~2 PRs needed

## This Week

- PRs Merged: 23
- Avg Cycle Time: 18.5 hours
- Conflicts: 2 (4.3%)
- Security Findings: 0 critical, 3 medium (all fixed)

## Agent Performance

| Agent | PRs Completed | Avg Size | Conflict Rate |
|-------|---------------|----------|---------------|
| agent-1 | 8 | 187 LoC | 0% |
| agent-2 | 6 | 234 LoC | 8% |
| agent-3 | 7 | 156 LoC | 0% |
| agent-4 | 2 | 312 LoC | 25% |
```

---

## Quick Reference

### Agent Checklist

```
Starting Work:
□ Pull latest main
□ Check assigned issue
□ Verify no file conflicts
□ Create branch: agent-{id}-{type}-{desc}

During Development:
□ Follow TDD
□ Commit with conventional format
□ Stay under 250 LoC
□ Rebase every 2 hours

Completing Work:
□ All tests pass
□ Self-review complete
□ Open/update PR
□ Add ready-for-batch label
```

### Orchestrator Commands

```bash
# Check batch status
gh pr list --label ready-for-batch

# Trigger batch merge
gh workflow run batch-merge.yml

# Check agent health
gh pr list --json number,title,updatedAt,labels

# View dashboard
gh run view --workflow=dashboard-update.yml
```

---

**Sources**: Research from [OpenAI Swarm](https://github.com/openai/swarm), [Meta AI Engineering](https://engineering.fb.com/), [Microsoft DevDiv](https://devblogs.microsoft.com/)
