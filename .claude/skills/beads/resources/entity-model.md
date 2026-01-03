# Entity Model

Complete reference for beads data structures and relationships.

## Table of Contents

- [Core Entities](#core-entities)
- [Relationships](#relationships)
- [Entity Diagrams](#entity-diagrams)
- [Field Reference](#field-reference)

---

## Core Entities

### Issue

The central work item entity.

```json
{
  "id": "bd-a1t0",
  "title": "Fix authentication bug",
  "body": "Detailed description...",
  "state": "open",
  "type": "bug",
  "priority": 1,
  "labels": ["security", "urgent"],
  "author": "alice",
  "assignees": ["bob"],
  "created_at": "2025-01-03T10:00:00Z",
  "updated_at": "2025-01-03T14:30:00Z",
  "closed_at": null,
  "epic_id": "bd-epic-1",
  "external_id": "LINEAR-123",
  "defer_until": null,
  "due_at": "2025-01-05T17:00:00Z",
  "tombstone": false
}
```

### Comment

Interactions on issues.

```json
{
  "id": "comment-xyz",
  "issue_id": "bd-a1t0",
  "body": "Comment content...",
  "author": "alice",
  "created_at": "2025-01-03T11:00:00Z",
  "updated_at": "2025-01-03T11:00:00Z"
}
```

### Label

Categorization tags.

```json
{
  "name": "security",
  "color": "#FF0000",
  "description": "Security-related issues"
}
```

### Epic

Container for related issues.

```json
{
  "id": "bd-epic-1",
  "title": "Authentication Overhaul",
  "description": "Epic overview...",
  "state": "open",
  "issue_ids": ["bd-a1t0", "bd-a1t1", "bd-a1t2"]
}
```

### Dependency

Relationship between issues.

```json
{
  "source_id": "bd-a1t1",
  "target_id": "bd-a1t0",
  "type": "blocks"
}
```

### Template

Predefined issue structure.

```json
{
  "name": "bug-report",
  "title_template": "[Bug] {title}",
  "body_template": "## Description\n{description}\n\n## Steps to Reproduce\n{steps}",
  "default_labels": ["bug"],
  "required_fields": ["description", "steps"]
}
```

### Molecule

Grouped workflow unit.

```json
{
  "id": "mol-xyz",
  "name": "Feature X Implementation",
  "proto_id": "proto-shiny",
  "issues": ["bd-a1t0", "bd-a1t1"],
  "current_step": "implement",
  "state": "active",
  "created_at": "2025-01-03T10:00:00Z"
}
```

### Formula

Workflow definition template.

```toml
# .beads/formulas/shiny.formula.toml
formula = "shiny"
description = "Design before code, review before ship"

[[steps]]
id = "design"
description = "Architecture planning"

[[steps]]
id = "implement"
needs = ["design"]

[[steps]]
id = "test"
needs = ["implement"]

[[steps]]
id = "submit"
needs = ["test"]
```

---

## Relationships

### Relationship Types

| Relationship | Type | Description |
|--------------|------|-------------|
| Epic → Issue | One-to-Many | Epic contains multiple issues |
| Issue → Comment | One-to-Many | Issue has multiple comments |
| Issue ↔ Label | Many-to-Many | Issues can have multiple labels |
| Issue ↔ Issue (Dep) | Many-to-Many | Blocking relationships |
| Molecule → Issue | Many-to-Many | Molecules group issues |
| Template → Issue | One-to-Many | Templates create issues |
| Formula → Molecule | One-to-Many | Formulas instantiate molecules |

### Dependency Types

| Type | Effect | Use Case |
|------|--------|----------|
| `blocks` | Affects `bd ready` | Hard dependencies |
| `related` | Informational | Soft relationships |
| `parent-child` | Epic structure | Sub-issue relationships |
| `discovered-from` | Context tracking | Issues found during work |

### Relationship Rules

1. **Circular dependencies** are detected and prevented
2. Only `blocks` affects the ready queue
3. Deleting an issue removes its dependencies
4. Epic deletion doesn't delete child issues (unlinks them)

---

## Entity Diagrams

### Domain Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BEADS DOMAIN MODEL                             │
└─────────────────────────────────────────────────────────────────────────┘

                          ┌──────────────┐
                          │    Epic      │
                          │              │
                          │ - id         │
                          │ - title      │
                          │ - state      │
                          └──────┬───────┘
                                 │
                                 │ 1:N (contains)
                                 ▼
┌──────────────┐         ┌──────────────┐          ┌──────────────┐
│   Formula    │         │    Issue     │          │   Template   │
│              │ creates │              │   uses   │              │
│ - name       │────────▶│ - id         │◀─────────│ - name       │
│ - steps      │         │ - title      │          │ - body       │
│ - conditions │         │ - body       │          │ - labels     │
└──────────────┘         │ - state      │          └──────────────┘
                         │ - type       │
                         │ - priority   │
                         │ - labels     │
                         │ - author     │
                         │ - created_at │
                         └──────┬───────┘
                                │
        ┌───────────────────────┼───────────────────────────┐
        │                       │                           │
        │ 1:N                   │ N:N                       │ N:M
        ▼                       ▼                           ▼
┌──────────────┐         ┌──────────────┐          ┌──────────────┐
│   Comment    │         │  Dependency  │          │    Label     │
│              │         │              │          │              │
│ - id         │         │ - source_id  │          │ - name       │
│ - issue_id   │         │ - target_id  │          │ - color      │
│ - body       │         │ - type       │          │ - description│
│ - author     │         │              │          │              │
└──────────────┘         └──────────────┘          └──────────────┘

                         ┌──────────────┐
                         │   Molecule   │
                         │              │
                         │ - id         │
                         │ - issues[]   │
                         │ - state      │
                         │ - step       │
                         └──────────────┘
```

### State Machine

```
                    ┌────────────────────────────────┐
                    │                                │
                    ▼                                │
              ┌──────────┐                           │
  create ───▶│   OPEN   │──── close ────┐           │
              └────┬─────┘               │           │
                   │                     │           │
          in_progress                    │           │
                   │                     │           │
                   ▼                     ▼           │
          ┌─────────────┐         ┌──────────┐      │
          │ IN_PROGRESS │──close─▶│  CLOSED  │      │
          └──────┬──────┘         └────┬─────┘      │
                 │                     │            │
            defer│                     │reopen      │
                 │                     │            │
                 ▼                     │            │
          ┌──────────┐                 │            │
          │ DEFERRED │─────────────────┴────────────┘
          └──────────┘
                 │
         undefer (or date passes)
                 │
                 └──────▶ OPEN
```

---

## Field Reference

### Issue Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | auto | Unique ID (e.g., bd-a1t0) |
| `title` | string | yes | Issue title/summary |
| `body` | string | no | Detailed description |
| `state` | enum | auto | open, in_progress, closed, deferred |
| `type` | enum | yes | bug, feature, task, epic, chore |
| `priority` | int | no | 0-4 (default: 2) |
| `labels` | []string | no | Assigned labels |
| `author` | string | auto | Creator identity |
| `assignees` | []string | no | Assigned users |
| `created_at` | timestamp | auto | Creation time |
| `updated_at` | timestamp | auto | Last modification |
| `closed_at` | timestamp | auto | When closed |
| `epic_id` | string | no | Parent epic reference |
| `external_id` | string | no | External tracker ID |
| `defer_until` | timestamp | no | Hide until this time |
| `due_at` | timestamp | no | Due date |
| `estimate` | string | no | Time/effort estimate |
| `tombstone` | bool | auto | Soft-delete marker |

### ID Format

Issue IDs follow the pattern: `{prefix}-{hash}`

- **prefix**: Configurable (default: `bd`)
- **hash**: 4-character alphanumeric hash

Examples: `bd-a1t0`, `myproj-x2y3`, `hq-abc1`

### Priority Levels

| Value | Name | Meaning |
|-------|------|---------|
| 0 | P0 | Critical - Security, data loss, broken builds |
| 1 | P1 | High - Major features, important bugs |
| 2 | P2 | Medium - Nice-to-have, minor bugs |
| 3 | P3 | Low - Polish, optimization |
| 4 | P4 | Backlog - Future ideas |

### State Transitions

| From | To | Trigger |
|------|-----|---------|
| (new) | open | bd create |
| open | in_progress | bd update --status in_progress |
| open | closed | bd close |
| open | deferred | bd update --defer |
| in_progress | closed | bd close |
| in_progress | open | bd update --status open |
| closed | open | bd reopen |
| deferred | open | Date passes or bd update --defer="" |

---

## Storage Architecture

### File Structure

```
.beads/
├── config.yaml           # Repository configuration
├── issues.jsonl          # Issue records (append-only)
├── interactions.jsonl    # Comments and history
├── metadata.json         # Project metadata
├── last-touched          # Timestamp tracking
├── mq/                   # Message queue (per-issue snapshots)
│   └── bd-*.json
└── formulas/             # Workflow definitions
    └── *.formula.toml
```

### JSONL Format

Each line in `.beads/issues.jsonl` is a complete issue record:

```jsonl
{"id":"bd-a1t0","title":"First issue","state":"open","created_at":"2025-01-01T00:00:00Z",...}
{"id":"bd-a1t0","title":"First issue (updated)","state":"closed","closed_at":"2025-01-02T00:00:00Z",...}
{"id":"bd-a1t1","title":"Second issue","state":"open",...}
```

Key properties:
- **Append-only**: Updates append new records
- **Git-friendly**: Easy merging of concurrent changes
- **Compactable**: `bd compact` removes redundant entries
- **SQLite cache**: Fast queries from indexed cache

---

**Related Files:**
- [SKILL.md](../SKILL.md) - Main skill guide
- [commands-reference.md](commands-reference.md) - CLI commands
- [sync-and-storage.md](sync-and-storage.md) - Git integration
