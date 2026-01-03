# Commands Reference

Complete reference for all `bd` (beads) CLI commands.

## Table of Contents

- [Issue Commands](#issue-commands)
- [Dependency Commands](#dependency-commands)
- [Epic Commands](#epic-commands)
- [Sync Commands](#sync-commands)
- [Query Commands](#query-commands)
- [Maintenance Commands](#maintenance-commands)
- [Configuration Commands](#configuration-commands)
- [Daemon Commands](#daemon-commands)
- [Molecule Commands](#molecule-commands)
- [Integration Commands](#integration-commands)

---

## Issue Commands

### bd create

Create a new issue.

```bash
bd create "Title" [flags]

Flags:
  -t, --type string        Issue type: bug, feature, task, epic, chore
  -p, --priority int       Priority: 0-4 (0=critical, 4=backlog)
  -d, --description string Issue description/body
  -l, --labels strings     Comma-separated labels
  --assignee string        Assign to user
  --due string             Due date (+2d, "next monday", etc.)
  --defer string           Defer until date (hide from ready)
  --epic string            Parent epic ID
  --json                   Output JSON for agent parsing

Examples:
  bd create "Fix login bug" -t bug -p 1
  bd create "Add search" -t feature -p 2 -d "Full-text search"
  bd create "Task" --due=+6h --defer=tomorrow
  bd create "Sub-task" --epic bd-123
```

### bd update

Update an existing issue.

```bash
bd update <id> [flags]

Flags:
  --status string          open, in_progress, closed
  --priority int           New priority (0-4)
  --title string           New title
  --description string     New description
  --assignee string        Assign to user
  --labels strings         Replace labels
  --add-labels strings     Add labels
  --remove-labels strings  Remove labels
  --due string             Set due date
  --defer string           Set defer date
  --epic string            Set parent epic
  --json                   Output JSON

Examples:
  bd update bd-123 --status in_progress
  bd update bd-123 --priority 0 --assignee alice
  bd update bd-123 --add-labels urgent,security
  bd update bd-123 --due=+2d --defer=""
```

### bd close

Close one or more issues.

```bash
bd close <id>... [flags]

Flags:
  --reason string          Reason for closing
  --json                   Output JSON

Examples:
  bd close bd-123
  bd close bd-123 --reason "Fixed in commit abc123"
  bd close bd-123 bd-124 bd-125    # Batch close
```

### bd reopen

Reopen a closed issue.

```bash
bd reopen <id> [flags]

Flags:
  --reason string          Reason for reopening
  --json                   Output JSON
```

### bd delete

Delete an issue permanently.

```bash
bd delete <id> [flags]

Flags:
  --force                  Skip confirmation
  --json                   Output JSON
```

---

## Dependency Commands

### bd dep add

Add a dependency between issues.

```bash
bd dep add <issue> <depends-on> [flags]

Flags:
  --type string            blocks, related, parent-child, discovered-from
                          (default: blocks)
  --json                   Output JSON

Examples:
  bd dep add bd-456 bd-123           # bd-456 blocked by bd-123
  bd dep add bd-456 bd-123 --type related
  bd dep add bd-456 bd-123 --type discovered-from
```

### bd dep remove

Remove a dependency.

```bash
bd dep remove <issue> <depends-on> [flags]
```

### bd dep tree

Show dependency tree for an issue.

```bash
bd dep tree <id> [flags]

Flags:
  --direction string       up, down, both (default: both)
  --depth int             Max depth (default: unlimited)
  --json                   Output JSON
```

### bd blocked

Show all blocked issues.

```bash
bd blocked [flags]

Flags:
  --json                   Output JSON
```

---

## Epic Commands

### bd epic create

Create a new epic.

```bash
bd epic create "Title" [flags]

Flags:
  -p, --priority int       Priority (0-4)
  -d, --description string Description
  --json                   Output JSON
```

### bd epic add

Add issues to an epic.

```bash
bd epic add <epic-id> <issue-id>... [flags]
```

### bd epic remove

Remove issues from an epic.

```bash
bd epic remove <epic-id> <issue-id>... [flags]
```

### bd epic show

Show epic with all sub-issues.

```bash
bd epic show <id> [flags]

Flags:
  --json                   Output JSON
```

---

## Sync Commands

### bd sync

Synchronize with git remote.

```bash
bd sync [flags]

Flags:
  --status                 Check sync status only
  --push                   Push changes only
  --pull                   Pull changes only
  --json                   Output JSON
```

### bd export

Export issues to file.

```bash
bd export [flags]

Flags:
  -o, --output string      Output file (default: .beads/issues.jsonl)
  --format string          jsonl, markdown, obsidian (default: jsonl)
  --filter string          Filter expression
  --json                   Output JSON

Examples:
  bd export -o .beads/issues.jsonl
  bd export --format markdown -o docs/issues.md
  bd export --filter "status=open"
```

### bd import

Import issues from file.

```bash
bd import [flags]

Flags:
  -i, --input string       Input file (default: .beads/issues.jsonl)
  --merge                  Merge with existing (default: true)
  --json                   Output JSON
```

---

## Query Commands

### bd ready

Show issues ready to work (no blockers).

```bash
bd ready [flags]

Flags:
  --include-deferred       Include deferred issues
  --limit int              Max results
  --json                   Output JSON (recommended for agents)

Examples:
  bd ready
  bd ready --json
  bd ready --include-deferred --limit 10
```

### bd list

List issues with filtering.

```bash
bd list [flags]

Flags:
  --status string          open, closed, in_progress, deferred
  --type string            bug, feature, task, epic, chore
  --priority string        0-4 or range (0-2)
  --labels strings         Filter by labels
  --assignee string        Filter by assignee
  --author string          Filter by author
  --deferred               Show only deferred issues
  --defer-before string    Deferred before date
  --defer-after string     Deferred after date
  --due-before string      Due before date
  --due-after string       Due after date
  --overdue                Due date in past (not closed)
  --limit int              Max results
  --json                   Output JSON

Examples:
  bd list --status=open
  bd list --status=in_progress --assignee=me
  bd list --priority=0-1 --type=bug
  bd list --due-before=+2d
  bd list --overdue
```

### bd show

Show issue details.

```bash
bd show <id> [flags]

Flags:
  --json                   Output JSON

Examples:
  bd show bd-123
  bd show bd-123 --json
```

### bd search

Full-text search issues.

```bash
bd search <query> [flags]

Flags:
  --limit int              Max results
  --json                   Output JSON

Examples:
  bd search "authentication"
  bd search "login bug" --limit 5
```

---

## Maintenance Commands

### bd stats

Show project statistics.

```bash
bd stats [flags]

Flags:
  --json                   Output JSON

Output includes:
  - Total issues (open/closed)
  - Issues by type
  - Issues by priority
  - Blocked count
  - Recent activity
```

### bd doctor

Check repository health.

```bash
bd doctor [flags]

Flags:
  --fix                    Auto-fix issues
  --json                   Output JSON

Checks:
  - JSONL file integrity
  - SQLite cache consistency
  - Orphan dependencies
  - Missing references
  - Sync status
```

### bd compact

Compact JSONL files.

```bash
bd compact [flags]

Flags:
  --dry-run                Show what would be compacted
  --json                   Output JSON
```

### bd repair

Repair corrupted data.

```bash
bd repair [flags]

Flags:
  --force                  Force repair even if risky
  --json                   Output JSON
```

---

## Configuration Commands

### bd init

Initialize beads in a repository.

```bash
bd init [flags]

Flags:
  --prefix string          Issue ID prefix (default: bd)
  --force                  Reinitialize existing

Creates:
  .beads/config.yaml
  .beads/issues.jsonl
  .beads/metadata.json
```

### bd config

View or update configuration.

```bash
bd config [flags]
bd config set <key> <value>
bd config get <key>

Examples:
  bd config
  bd config set prefix myproj
  bd config get prefix
```

### bd hooks

Manage git hooks.

```bash
bd hooks install [flags]
bd hooks uninstall [flags]

Flags:
  --pre-commit             Install pre-commit hook
  --post-merge             Install post-merge hook
```

---

## Daemon Commands

### bd daemon start

Start background daemon.

```bash
bd daemon start [flags]

Flags:
  --foreground             Run in foreground
  --port int               RPC port
```

### bd daemon stop

Stop background daemon.

```bash
bd daemon stop [flags]
```

### bd daemon status

Check daemon status.

```bash
bd daemon status [flags]

Flags:
  --json                   Output JSON
```

---

## Molecule Commands

### bd mol pour

Create a molecule from protomolecule.

```bash
bd mol pour <proto-id> [flags]

Flags:
  --name string            Molecule name
  --json                   Output JSON
```

### bd mol current

Show current molecule for agent.

```bash
bd mol current [flags]

Flags:
  --json                   Output JSON
```

### bd mol progress

Show molecule execution progress.

```bash
bd mol progress <mol-id> [flags]
```

### bd mol burn

Complete/burn a molecule.

```bash
bd mol burn <mol-id> [flags]
```

### bd formula list

List available formulas.

```bash
bd formula list [flags]
```

### bd cook

Cook formula into protomolecule.

```bash
bd cook <formula-name> [flags]
```

---

## Integration Commands

### bd linear sync

Sync with Linear.app.

```bash
bd linear sync [flags]

Flags:
  --direction string       push, pull, both
  --dry-run                Show what would sync
```

### bd jira import

Import from Jira export.

```bash
bd jira import <file> [flags]
```

---

## Global Flags

These flags work with most commands:

```bash
--json                     Output in JSON format (agent-friendly)
--quiet, -q                Suppress non-essential output
--verbose, -v              Verbose output
--help, -h                 Help for command
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Issue not found |
| 4 | Permission denied |
| 5 | Sync conflict |

---

**Related Files:**
- [SKILL.md](../SKILL.md) - Main skill guide
- [entity-model.md](entity-model.md) - Data structures
- [sync-and-storage.md](sync-and-storage.md) - JSONL and git sync
