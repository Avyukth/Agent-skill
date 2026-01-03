# Integrations

Guide to external tool integrations with beads.

## Table of Contents

- [MCP Integration](#mcp-integration)
- [Linear Integration](#linear-integration)
- [Jira Integration](#jira-integration)
- [Git Hooks](#git-hooks)
- [Claude Code Integration](#claude-code-integration)
- [Gas Town Integration](#gas-town-integration)

---

## MCP Integration

### Overview

Beads provides an MCP (Model Context Protocol) server for AI tool integration:

```
┌─────────────────────────────────────────────────────────────────┐
│                        MCP ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐     MCP Protocol     ┌─────────────┐              │
│   │ Claude  │◀────────────────────▶│ beads-mcp   │              │
│   │  Code   │                      │   server    │              │
│   └─────────┘                      └──────┬──────┘              │
│                                           │                     │
│                                           │ bd commands         │
│                                           ▼                     │
│                                    ┌─────────────┐              │
│                                    │  beads CLI  │              │
│                                    └─────────────┘              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Installation

```bash
# Install beads-mcp from PyPI
pip install beads-mcp
# or
uv pip install beads-mcp
```

### Configuration

Add to Claude Code settings:

```json
{
  "mcp": {
    "servers": {
      "beads": {
        "command": "beads-mcp",
        "args": ["--path", "/path/to/project"]
      }
    }
  }
}
```

### Available Tools

The MCP server exposes beads commands as tools:

| Tool | Description |
|------|-------------|
| `beads_list` | List issues with filtering |
| `beads_show` | Show issue details |
| `beads_create` | Create new issue |
| `beads_update` | Update issue |
| `beads_close` | Close issue |
| `beads_ready` | Show ready work |
| `beads_search` | Full-text search |
| `beads_stats` | Project statistics |

### Usage in Claude

```
User: "What issues are ready to work on?"
Claude: [calls beads_ready tool]
→ Returns list of unblocked issues

User: "Create a bug for the login issue"
Claude: [calls beads_create with type=bug]
→ Creates and returns new issue ID
```

---

## Linear Integration

### Overview

Sync issues bidirectionally with Linear.app:

```
┌─────────────────────────────────────────────────────────────────┐
│                    LINEAR SYNC ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐      REST/GraphQL     ┌──────────────┐           │
│   │ Linear   │◀─────────────────────▶│  bd linear   │           │
│   │   API    │                       │    sync      │           │
│   └──────────┘                       └──────┬───────┘           │
│                                             │                   │
│                                             ▼                   │
│   LINEAR-123  ◀────────────────────▶  bd-a1t0                  │
│   (external)                          (local)                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Setup

```bash
# Set Linear API token
export LINEAR_API_KEY="lin_api_..."

# Configure team/project mapping
bd config set linear.team_id "TEAM-ID"
bd config set linear.project_id "PROJECT-ID"
```

### Commands

```bash
# Full sync (both directions)
bd linear sync

# Push local changes to Linear
bd linear sync --direction push

# Pull Linear changes to local
bd linear sync --direction pull

# Dry run (show what would sync)
bd linear sync --dry-run

# Check sync status
bd linear status
```

### Field Mapping

| Beads Field | Linear Field |
|-------------|--------------|
| `title` | `title` |
| `body` | `description` |
| `state` | `state` (mapped) |
| `priority` | `priority` (mapped) |
| `labels` | `labels` |
| `assignees` | `assignees` |
| `external_id` | `id` |

### Conflict Resolution

When both sides change:

```bash
# Show conflicts
bd linear sync --show-conflicts

# Resolve with local version
bd linear resolve <id> --prefer local

# Resolve with Linear version
bd linear resolve <id> --prefer remote
```

---

## Jira Integration

### Overview

Import/export issues with Jira:

### Import from Jira

```bash
# Export from Jira first (CSV or JSON)
# Then import:
bd jira import jira-export.csv

# With field mapping
bd jira import jira-export.json --map-file mapping.yaml
```

### Field Mapping File

```yaml
# mapping.yaml
fields:
  summary: title
  description: body
  issuetype: type
  priority: priority
  status: state
  labels: labels

type_mapping:
  Bug: bug
  Story: feature
  Task: task
  Epic: epic

priority_mapping:
  Highest: 0
  High: 1
  Medium: 2
  Low: 3
  Lowest: 4

status_mapping:
  "To Do": open
  "In Progress": in_progress
  Done: closed
```

### Export to Jira

```bash
# Export beads issues for Jira import
bd jira export -o jira-import.csv

# With filter
bd jira export --filter "status=open" -o jira-import.csv
```

### Jira Scripts

Example scripts in `examples/jira-import/`:

```bash
# Convert Jira export to beads JSONL
python jira2jsonl.py jira-export.json > .beads/issues.jsonl

# Convert beads JSONL to Jira format
python jsonl2jira.py .beads/issues.jsonl > jira-import.json
```

---

## Git Hooks

### Overview

Automate sync with git hooks:

```
┌─────────────────────────────────────────────────────────────────┐
│                      GIT HOOKS FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   pre-commit  ──▶  bd export  ──▶  git add .beads/              │
│                                                                  │
│   post-merge  ──▶  bd import  ──▶  Update SQLite cache          │
│                                                                  │
│   post-checkout ──▶ bd import ──▶  Update SQLite cache          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Installation

```bash
# Install all hooks
bd hooks install

# Install specific hooks
bd hooks install --pre-commit
bd hooks install --post-merge
bd hooks install --post-checkout
```

### Pre-Commit Hook

Automatically exports issues before commit:

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Export beads issues to JSONL
bd export -o .beads/issues.jsonl

# Stage the export
git add .beads/issues.jsonl

exit 0
```

### Post-Merge Hook

Automatically imports after merge:

```bash
#!/bin/bash
# .git/hooks/post-merge

# Import any new issues from merge
bd import -i .beads/issues.jsonl

exit 0
```

### Post-Checkout Hook

Sync cache after branch switch:

```bash
#!/bin/bash
# .git/hooks/post-checkout

# Only on branch switch (not file checkout)
if [ "$3" = "1" ]; then
  bd import -i .beads/issues.jsonl
fi

exit 0
```

### Manual Hook Scripts

Located in `examples/git-hooks/`:

```
examples/git-hooks/
├── pre-commit
├── post-merge
├── post-checkout
└── README.md
```

---

## Claude Code Integration

### Overview

Beads integrates with Claude Code for AI-assisted development:

### Environment Setup

```bash
# Set agent identity for attribution
export BD_ACTOR="claude-code"

# Point to beads directory (optional)
export BEADS_DIR="/path/to/project/.beads"
```

### CLAUDE.md Integration

Add to project CLAUDE.md:

```markdown
## Issue Tracking

We use beads (bd) for issue tracking.

### Quick Reference

\`\`\`bash
bd ready           # Find ready work
bd show <id>       # Issue details
bd update <id> --status in_progress  # Claim work
bd close <id>      # Complete work
bd sync            # Sync with git
\`\`\`

### Workflow

1. Check `bd ready` before asking "what next?"
2. Claim work: `bd update <id> --status in_progress`
3. If you discover issues: `bd create "Found bug" -t bug`
4. Complete: `bd close <id>`
5. Sync: `bd sync`
```

### MCP + Claude Code

With MCP configured, Claude can use beads directly:

```
User: "Show me what work is available"
Claude: [MCP call to beads_ready]
→ Lists unblocked issues

User: "Start working on bd-a1t0"
Claude: [MCP call to beads_update, status=in_progress]
→ Claims the issue
```

---

## Gas Town Integration

### Overview

Gas Town uses beads as its control plane:

```
┌─────────────────────────────────────────────────────────────────┐
│                  GAS TOWN + BEADS ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐      ┌─────────┐      ┌─────────┐                │
│   │  Mayor  │      │ Witness │      │ Refinery│                │
│   └────┬────┘      └────┬────┘      └────┬────┘                │
│        │                │                │                      │
│        │     ┌──────────┴────────┐       │                      │
│        └────▶│    beads (bd)     │◀──────┘                      │
│              │   Control Plane   │                              │
│              └──────────┬────────┘                              │
│                         │                                       │
│              ┌──────────┼──────────┐                           │
│              ▼          ▼          ▼                           │
│         ┌────────┐ ┌────────┐ ┌────────┐                       │
│         │Polecat │ │Polecat │ │Polecat │                       │
│         │  #1    │ │  #2    │ │  #3    │                       │
│         └────────┘ └────────┘ └────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Beads Routing

Gas Town routes beads commands by issue prefix:

```bash
bd show gp-xyz    # Routes to greenplace rig's beads
bd show hq-abc    # Routes to town-level beads
bd show wyv-123   # Routes to wyvern rig's beads
```

### Convoy Tracking

Convoys track batched work across beads:

```bash
# Create convoy tracking beads issues
gt convoy create "Feature X" bd-a1t0 bd-a1t1 bd-a1t2

# Dispatch to agents
gt sling bd-a1t0 myproject

# Monitor progress
gt convoy list
gt convoy status convoy-123
```

### Hook Integration

Beads provides the hook for agent propulsion:

```bash
# Agent checks hook
gt hook           # Returns bonded molecule/work

# Agent works
bd mol current    # Current step
# ... execute step ...
bd mol advance    # Progress
```

### Environment Variables

| Variable | Gas Town Use |
|----------|--------------|
| `BD_ACTOR` | Agent identity (polecat-1, etc.) |
| `BEADS_DIR` | Shared beads database |
| `BEADS_NO_DAEMON` | Required for worktree polecats |

### Cross-Rig Work

```bash
# Option 1: Create in target rig
bd create --prefix gp "Fix bug in greenplace"

# Option 2: Route existing issue
# (defined in ~/gt/.beads/routes.jsonl)
```

---

## Integration Examples

### Example: Full Pipeline

```bash
# 1. Issues synced from Linear
bd linear sync --pull

# 2. Agent picks up work
bd ready
bd update bd-a1t0 --status in_progress

# 3. Work is done, discoveries logged
bd create "Found edge case" -t bug -p 2
bd dep add bd-new bd-a1t0 --type discovered-from

# 4. Close original issue
bd close bd-a1t0

# 5. Sync back to Linear and git
bd linear sync --push
bd sync
```

### Example: Team Workflow

```bash
# Developer creates issue
bd create "Add search feature" -t feature -p 1

# Push to git for team visibility
bd sync

# AI agent picks up
export BD_ACTOR="claude-code-agent"
bd update bd-a1t0 --status in_progress

# Creates sub-tasks
bd create "Implement search API" -t task --epic bd-a1t0
bd create "Add search UI" -t task --epic bd-a1t0

# Syncs for other agents
bd sync
```

---

**Related Files:**
- [SKILL.md](../SKILL.md) - Main skill guide
- [commands-reference.md](commands-reference.md) - CLI commands
- [../gastown/SKILL.md](../gastown/SKILL.md) - Gas Town orchestration
