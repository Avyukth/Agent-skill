# Sync and Storage

Guide to git synchronization, JSONL format, and storage architecture.

## Table of Contents

- [Storage Architecture](#storage-architecture)
- [JSONL Format](#jsonl-format)
- [Git Synchronization](#git-synchronization)
- [SQLite Cache](#sqlite-cache)
- [Conflict Resolution](#conflict-resolution)
- [Best Practices](#best-practices)

---

## Storage Architecture

### Dual Storage Model

Beads uses a dual-storage approach:

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER OPERATIONS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   bd create ──┬──▶ SQLite Cache ◀──▶ JSONL Files ◀──▶ Git     │
│   bd update ──┤         │                 │                     │
│   bd close ───┤         │                 │                     │
│   bd list ────┼─────────┘                 │                     │
│   bd sync ────┴───────────────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

| Component | Purpose | Location |
|-----------|---------|----------|
| **JSONL Files** | Git-tracked source of truth | `.beads/*.jsonl` |
| **SQLite Cache** | Fast indexed queries | `~/.cache/beads/` |
| **Git Remote** | Collaboration and backup | Remote repository |

### File Structure

```
project/
├── .beads/
│   ├── config.yaml           # Repository configuration
│   ├── issues.jsonl          # Issue data (git-tracked)
│   ├── interactions.jsonl    # Comments and history
│   ├── metadata.json         # Project metadata
│   ├── last-touched          # Last modification timestamp
│   ├── routes.jsonl          # Multi-repo routing rules
│   └── formulas/             # Workflow definitions
│       ├── shiny.formula.toml
│       └── standard.formula.toml
└── ...
```

---

## JSONL Format

### What is JSONL?

JSON Lines format - one JSON object per line:

```jsonl
{"id":"bd-a1t0","title":"First issue","state":"open",...}
{"id":"bd-a1t0","title":"First issue","state":"closed","closed_at":"2025-01-02T00:00:00Z",...}
{"id":"bd-a1t1","title":"Second issue","state":"open",...}
```

### Why JSONL?

| Benefit | Explanation |
|---------|-------------|
| **Git-friendly** | Line-based changes merge cleanly |
| **Append-only** | Updates add lines, don't modify existing |
| **Streamable** | Process large files incrementally |
| **Human-readable** | Debug by viewing file directly |
| **Conflict-resistant** | Most merges auto-resolve |

### Issue Record Format

Complete issue record:

```json
{
  "id": "bd-a1t0",
  "title": "Fix authentication bug",
  "body": "Description with **markdown** support",
  "state": "open",
  "type": "bug",
  "priority": 1,
  "labels": ["security", "urgent"],
  "author": "alice",
  "assignees": ["bob"],
  "created_at": "2025-01-03T10:00:00Z",
  "updated_at": "2025-01-03T14:30:00Z",
  "closed_at": null,
  "epic_id": null,
  "external_id": null,
  "defer_until": null,
  "due_at": null,
  "tombstone": false,
  "_meta": {
    "version": 2,
    "source": "cli"
  }
}
```

### Append-Only Updates

When updating an issue, a new complete record is appended:

```jsonl
{"id":"bd-a1t0","title":"Original title","state":"open","updated_at":"2025-01-01T00:00:00Z",...}
{"id":"bd-a1t0","title":"Updated title","state":"in_progress","updated_at":"2025-01-02T00:00:00Z",...}
{"id":"bd-a1t0","title":"Updated title","state":"closed","closed_at":"2025-01-03T00:00:00Z",...}
```

The most recent record for each ID is the current state.

### Compaction

Over time, JSONL files grow with historical records. Compaction consolidates:

```bash
# Before compaction (3 records for bd-a1t0)
bd compact --dry-run    # Preview what would be removed

# After compaction (1 record for bd-a1t0, latest only)
bd compact
```

Compaction:
- Keeps only the latest record per issue
- Removes tombstoned (deleted) issues
- Creates a new commit with compacted data
- Preserves git history for auditing

---

## Git Synchronization

### Sync Command

```bash
# Full sync (push and pull)
bd sync

# Check sync status
bd sync --status

# Push only
bd sync --push

# Pull only
bd sync --pull
```

### Sync Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                         BD SYNC FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. Export local changes to JSONL                              │
│   2. Git add .beads/*.jsonl                                     │
│   3. Git commit (if changes)                                    │
│   4. Git pull --rebase                                          │
│   5. Import remote changes to SQLite                            │
│   6. Git push                                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Manual Workflow

If not using `bd sync`, manual workflow:

```bash
# Make changes
bd create "New issue" -t task

# Export to JSONL
bd export -o .beads/issues.jsonl

# Git commit
git add .beads/issues.jsonl
git commit -m "Add new issue"

# Pull remote changes
git pull

# Import any new remote issues
bd import -i .beads/issues.jsonl

# Push
git push
```

### Git Hooks

Automate sync with git hooks:

```bash
# Install hooks
bd hooks install --pre-commit --post-merge

# Creates:
# .git/hooks/pre-commit  - exports JSONL before commit
# .git/hooks/post-merge  - imports JSONL after merge
```

Pre-commit hook example:
```bash
#!/bin/bash
bd export -o .beads/issues.jsonl
git add .beads/issues.jsonl
```

Post-merge hook example:
```bash
#!/bin/bash
bd import -i .beads/issues.jsonl
```

---

## SQLite Cache

### Purpose

SQLite provides fast indexed queries that JSONL can't efficiently support:

| Operation | JSONL | SQLite |
|-----------|-------|--------|
| List all issues | O(n) scan | O(1) index lookup |
| Search text | O(n) scan | FTS5 full-text search |
| Filter by status | O(n) scan | O(log n) index |
| Complex queries | Very slow | Fast SQL |

### Cache Location

```
~/.cache/beads/{repo-hash}/beads.db
```

### Schema Overview

```sql
-- Core issues table
CREATE TABLE issues (
  id TEXT PRIMARY KEY,
  hash_id TEXT,
  title TEXT,
  description TEXT,
  status TEXT,
  priority TEXT,
  -- ... more fields
);

-- Full-text search
CREATE VIRTUAL TABLE issues_fts USING fts5(title, description);

-- Dependencies
CREATE TABLE deps (
  issue_id TEXT,
  depends_on TEXT,
  type TEXT,
  PRIMARY KEY (issue_id, depends_on)
);
```

### Cache Invalidation

The cache is rebuilt when:
- JSONL file is newer than cache
- `bd doctor --fix` is run
- `bd import` is run
- Cache corruption is detected

### Cache Warming

For large projects, warm the cache after clone:

```bash
git clone <repo>
cd <repo>
bd import -i .beads/issues.jsonl  # Populate SQLite cache
```

---

## Conflict Resolution

### Automatic Resolution

Most conflicts auto-resolve because:
- JSONL is append-only (new lines, not modifications)
- Git can merge line additions from different sources

### Conflict Scenarios

| Scenario | Resolution |
|----------|------------|
| Both add new issues | Auto-merges (different lines) |
| Both update same issue | Last writer wins (latest timestamp) |
| One closes, one updates | Both records kept, latest wins |
| Compaction conflicts | Manual merge may be needed |

### Manual Conflict Resolution

If git reports a conflict in `.beads/issues.jsonl`:

```bash
# Option 1: Keep both versions
# Open file, ensure both records are valid JSON lines
git add .beads/issues.jsonl
git rebase --continue

# Option 2: Regenerate from both
bd import -i .beads/issues.jsonl  # Import current
# Manually review bd list output
bd export -o .beads/issues.jsonl  # Export consolidated
git add .beads/issues.jsonl
git rebase --continue
```

### Merge-Slot Gate

Beads provides a serialized merge mechanism for conflict-prone operations:

```bash
# Check if merge slot is available
bd merge-slot check

# Acquire slot for atomic operations
bd merge-slot acquire
# ... make changes ...
bd merge-slot release
```

---

## Best Practices

### Daily Workflow

```bash
# Start of day
git pull
bd import -i .beads/issues.jsonl  # Or: bd sync --pull
bd ready  # See what's available

# During work
bd update <id> --status in_progress
# ... work ...
bd close <id>

# End of day
bd sync  # Or: bd export + git commit + git push
```

### Multi-Agent Setup

```bash
# Configure agent identity
export BD_ACTOR="agent-name"

# Each agent tracks own work
bd update <id> --assignee $BD_ACTOR

# Sync frequently
bd sync  # Prevents conflicts
```

### Performance Tips

1. **Use daemon mode** for faster operations:
   ```bash
   bd daemon start
   ```

2. **Compact periodically** to reduce file size:
   ```bash
   bd compact
   ```

3. **Use `--json`** for agent parsing (faster than parsing terminal output)

4. **Limit query results** for large projects:
   ```bash
   bd list --limit 50
   ```

### Backup Strategy

Since beads data is in git:
- All standard git backup applies
- Push to multiple remotes for redundancy
- JSONL files can be archived independently

---

## Troubleshooting

### Common Issues

**Cache out of sync:**
```bash
bd doctor --fix
# or
bd import -i .beads/issues.jsonl
```

**Large JSONL file:**
```bash
bd compact
```

**Sync conflicts:**
```bash
git status  # Check for conflicts
# Resolve conflicts in .beads/*.jsonl
bd import -i .beads/issues.jsonl
```

**Missing issues after pull:**
```bash
bd import -i .beads/issues.jsonl
```

---

**Related Files:**
- [SKILL.md](../SKILL.md) - Main skill guide
- [entity-model.md](entity-model.md) - Data structures
- [commands-reference.md](commands-reference.md) - CLI commands
