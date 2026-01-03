---
name: beads
description: Git-native issue tracking for AI agent workflows using beads (bd). Use when managing tasks, tracking issues, creating epics, handling dependencies, syncing with git, running bd commands, working with JSONL exports, using daemon mode, integrating with Linear/Jira, or coordinating multi-agent work. Covers bd init, bd create, bd ready, bd update, bd close, bd list, bd show, bd sync, bd dep, bd epic, bd mol, bd export, bd import, bd doctor, priorities 0-4, issue types (bug, feature, task, epic, chore), dependency tracking, defer/due dates, molecules/formulas, and MCP integration.
---

# Beads Skill

Git-native issue tracking designed for AI agent workflows. Track work with beads; sync via git.

## Purpose

Beads (bd) solves coordination problems for AI-assisted development:

| Without Beads | With Beads |
|---------------|------------|
| Issues in external tools (disconnected) | Issues in git repo (versioned with code) |
| Manual sync between tools | Auto-sync on git push/pull |
| Context lost on compaction | Issues survive agent restarts |
| Work state in agent memory | Work state in git-backed ledger |
| No dependency awareness | Ready queue shows unblocked work |

## When to Use This Skill

This skill activates when you:
- Track issues, bugs, features, or tasks in a project
- Use `bd` CLI commands for issue management
- Work with `.beads/` directory and JSONL files
- Manage dependencies between issues
- Check what work is ready (unblocked)
- Create or manage epics and sub-issues
- Sync beads state with git remote
- Use molecules for multi-step workflows
- Integrate with external trackers (Linear, Jira)

## Quick Start

```bash
# Initialize beads in a project
bd init

# Create an issue
bd create "Fix authentication bug" -t bug -p 1

# Find ready work (no blockers)
bd ready

# Start working on an issue
bd update <id> --status in_progress

# Complete work
bd close <id> --reason "Fixed"

# Sync with git
bd sync
```

## Core Concepts

### Issue Lifecycle

```
┌────────────┐     ┌─────────────┐     ┌────────┐
│   OPEN     │────▶│ IN_PROGRESS │────▶│ CLOSED │
└────────────┘     └─────────────┘     └────────┘
      │                                      ▲
      │         ┌──────────┐                 │
      └────────▶│ DEFERRED │─────────────────┘
                └──────────┘
```

### Issue Types

| Type | Use For |
|------|---------|
| `bug` | Something broken that needs fixing |
| `feature` | New functionality |
| `task` | Work items (tests, docs, refactoring) |
| `epic` | Large features composed of sub-issues |
| `chore` | Maintenance (dependencies, tooling) |

### Priority Levels

| Priority | Meaning | Examples |
|----------|---------|----------|
| `0` (P0) | Critical | Security, data loss, broken builds |
| `1` (P1) | High | Major features, important bugs |
| `2` (P2) | Medium | Nice-to-have, minor bugs |
| `3` (P3) | Low | Polish, optimization |
| `4` (P4) | Backlog | Future ideas |

### Dependency System

| Type | Effect | Use Case |
|------|--------|----------|
| `blocks` | Affects ready queue | Hard dependencies |
| `related` | Informational | Soft relationships |
| `parent-child` | Epic structure | Sub-issues |
| `discovered-from` | Context tracking | Issues found during work |

Only `blocks` dependencies affect `bd ready` output.

## Essential Commands

### Finding Work

```bash
bd ready                           # Show unblocked issues
bd ready --json                    # JSON output for agents
bd ready --include-deferred        # Include future-deferred issues
bd list                            # All issues
bd list --status=open              # Open issues only
bd list --status=in_progress       # Active work
bd show <id>                       # Issue details with deps
```

### Creating & Updating

```bash
# Create issue
bd create "Title" -t task -p 2
bd create "Title" -t bug -p 1 -d "Description"
bd create "Title" --due=+2d --defer=tomorrow

# Update
bd update <id> --status in_progress
bd update <id> --assignee=username
bd update <id> --priority 1
bd update <id> --due=+1w

# Close
bd close <id>
bd close <id> --reason "explanation"
bd close <id1> <id2> <id3>           # Batch close
```

### Dependencies

```bash
bd dep add <issue> <depends-on>      # Add dependency
bd dep add <issue> <blocker> --type blocks
bd dep tree <id>                     # Visualize deps
bd blocked                           # Show blocked issues
```

### Sync & Collaboration

```bash
bd sync                              # Push/pull with remote
bd sync --status                     # Check sync status
bd export -o .beads/issues.jsonl     # Export to JSONL
bd import -i .beads/issues.jsonl     # Import from JSONL
```

### Project Health

```bash
bd stats                             # Project statistics
bd doctor                            # Health check
bd doctor --fix                      # Auto-repair issues
bd compact                           # Compact JSONL files
```

## Workflow Patterns

### Standard Agent Workflow

```bash
# 1. Find ready work
bd ready

# 2. Claim task
bd update <id> --status in_progress

# 3. Work on it (implement, test, document)

# 4. If you discover issues during work:
bd create "Found bug in X" -t bug -p 1
bd dep add <new-id> <current-id> --type discovered-from

# 5. Complete work
bd close <id> --reason "Implemented"

# 6. Sync before commit
bd sync
```

### Multi-Agent Coordination

```bash
# Agent 1: Create and assign work
bd create "Implement feature A" -t feature -p 1
bd create "Write tests for A" -t task -p 2
bd dep add <test-id> <feature-id>    # Tests depend on feature

# Agent 2: Check available work
bd ready                              # Shows only unblocked items
bd update <id> --status in_progress  # Claim work

# Any agent: Check project status
bd stats
bd list --status=in_progress
```

### Session Handoff Pattern

```bash
# End of session: Record state
bd sync

# New session: Recover context
bd ready                              # What's available
bd list --status=in_progress         # What's claimed
bd show <id>                          # Details of current work
```

## Project Structure

```
project/
├── .beads/
│   ├── config.yaml           # Configuration
│   ├── issues.jsonl          # Issue data (git-tracked)
│   ├── interactions.jsonl    # Comments/history
│   ├── metadata.json         # Project metadata
│   └── formulas/             # Workflow definitions
│       └── *.formula.toml
└── ...
```

## Time-Based Scheduling

```bash
# Due dates
bd create "Task" --due=+6h           # Due in 6 hours
bd create "Task" --due="next monday" # Natural language
bd list --due-before=+2d             # Due within 2 days
bd list --overdue                    # Past due date

# Defer dates (hide from ready queue until)
bd create "Task" --defer=tomorrow
bd update <id> --defer=+1w
bd update <id> --defer=""            # Clear defer (show now)
bd list --deferred                   # Show deferred issues
```

## Navigation Guide

| Need to... | Read this resource |
|------------|-------------------|
| Full command reference | [commands-reference.md](resources/commands-reference.md) |
| Entity model and relationships | [entity-model.md](resources/entity-model.md) |
| Git sync and JSONL format | [sync-and-storage.md](resources/sync-and-storage.md) |
| Molecules and formulas | [molecules-formulas.md](resources/molecules-formulas.md) |
| External integrations | [integrations.md](resources/integrations.md) |
| Troubleshooting | [troubleshooting.md](resources/troubleshooting.md) |

## Pro Tips for Agents

1. **Always use `--json` flags** for programmatic parsing
2. **Check `bd ready` before asking "what next?"** - shows unblocked work
3. **Link discoveries with `discovered-from`** - maintains context
4. **Export before committing** - or use git hooks
5. **Priority 0-1 issues first** - they're more important than 2-4
6. **Use `bd dep tree`** to understand complex dependencies
7. **Batch closes with multiple IDs** - more efficient

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `BD_ACTOR` | Agent identity for attribution |
| `BEADS_DIR` | Override beads directory location |
| `BEADS_NO_DAEMON` | Disable daemon mode |

## Integration with Gas Town

When using Gas Town multi-agent orchestration:

```bash
# Beads provides the control plane
bd ready                    # What work is available
bd create --prefix gp "..." # Route to specific rig
gt sling <bead-id> <rig>   # Dispatch to agent
```

See the [gastown skill](../gastown/SKILL.md) for multi-agent coordination.

## Key Principles

1. **Git-native storage** - Issues are versioned with code
2. **Dependency-aware** - Ready queue shows only unblocked work
3. **Agent-friendly** - JSON output, daemon mode, MCP integration
4. **Survives compaction** - State persists across agent restarts
5. **Offline-first** - Works without network, syncs when available

---

**Skill Status**: Complete beads issue tracking guide
**Line Count**: ~350 lines (within 500-line rule)
**Progressive Disclosure**: 6 resource files for deep dives
