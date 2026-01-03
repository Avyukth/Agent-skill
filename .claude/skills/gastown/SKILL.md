---
name: gastown
description: Multi-agent orchestration for Claude Code using Gas Town (gt). Use when coordinating AI agents, managing convoys, slinging work to polecats, running molecules/formulas, using gt commands, managing rigs, witness/refinery agents, beads integration, tmux sessions, agent lifecycle, crew workers, or building multi-agent workflows. Covers gt install, gt start, gt prime, gt convoy, gt sling, gt mail, gt handoff, gt doctor, bd commands, and the Mayor/Witness/Refinery/Polecat role taxonomy.
---

# Gas Town Skill

Multi-agent orchestrator for Claude Code. Track work with convoys; sling to agents.

## Purpose

Gas Town (gt) solves coordination problems when running multiple Claude agents:

| Without Gas Town | With Gas Town |
|------------------|---------------|
| Agents forget work after restart | Work persists on hooks - survives crashes, compaction, restarts |
| Manual coordination | Agents have mailboxes, identities, and structured handoffs |
| 4-10 agents is chaotic | Comfortably scale to 20-30 agents |
| Work state in agent memory | Work state in Beads (git-backed ledger) |

## When to Use This Skill

This skill activates when you:
- Set up or manage a Gas Town workspace
- Create or track convoys for batched work
- Sling work to agents (polecats, crew, etc.)
- Work with molecules and formulas (workflows)
- Manage agent lifecycle (Mayor, Witness, Refinery, Polecat)
- Use `gt` CLI commands
- Integrate with beads (bd) for issue tracking
- Coordinate cross-rig work

## Quick Start

```bash
# Install
go install github.com/steveyegge/gastown/cmd/gt@latest

# Create workspace
gt install ~/gt

# Add a project
gt rig add myproject https://github.com/you/repo.git

# Enter the Mayor's office (recommended interface)
cd ~/gt && gt prime
```

Inside the Mayor session, just ask what you want:
> "Help me fix the authentication bug in myproject"

The Mayor creates convoys, dispatches workers, and coordinates everything.

## Core Concepts

### Town Structure

```
Town (~/gt/)              Your workspace
├── .beads/               Town-level beads (hq-* prefix)
├── mayor/                Mayor config
├── Rig (project)         Container for a git project + its agents
│   ├── .repo.git/        Bare repo (shared by worktrees)
│   ├── mayor/rig/        Mayor's clone (canonical beads)
│   ├── polecats/         Ephemeral workers (spawn → work → disappear)
│   ├── crew/<name>/      Persistent workers (human-controlled)
│   ├── witness/          Monitors workers, handles lifecycle
│   └── refinery/rig/     Merge queue processor
```

### Role Taxonomy

| Role | Scope | Lifecycle | Purpose |
|------|-------|-----------|---------|
| **Mayor** | Town-wide | Singleton, persistent | Global coordinator, cross-rig dispatch |
| **Deacon** | Town-wide | Singleton, daemon | Health check, agent lifecycle, plugins |
| **Witness** | Per-rig | Persistent | Polecat lifecycle, stuck detection, nudging |
| **Refinery** | Per-rig | Persistent | Merge queue processor, PR review |
| **Polecat** | Per-task | Ephemeral | Transient worker with dedicated worktree |
| **Crew** | User-managed | Long-lived | Persistent worker with own clone |

### The Propulsion Principle

> **If your hook has work, RUN IT.**

Agents wake up, check their hook, execute the molecule. No waiting for commands.
Molecules survive crashes - any agent can continue where another left off.

## Essential Commands

### Town Management

```bash
gt install ~/gt              # Create workspace
gt start                     # Start Gas Town (daemon + Mayor)
gt shutdown                  # Graceful shutdown
gt prime                     # Enter Mayor session
gt status                    # Town overview
gt doctor                    # Health check
gt doctor --fix              # Auto-repair
```

### Convoy (Work Tracking Dashboard)

```bash
gt convoy list                          # Dashboard of active convoys
gt convoy create "name" issue-1 issue-2 # Create convoy tracking issues
gt convoy create "name" gt-a --notify   # With notification on landing
gt convoy status [convoy-id]            # Show progress
gt convoy list --all                    # Include landed convoys
```

### Work Assignment (Sling)

```bash
gt sling <bead> <rig>                   # Assign work to polecat
gt sling gt-abc myproject               # Spawns polecat automatically
gt sling gt-xyz <rig> --molecule=<proto> # With workflow template
```

### Communication

```bash
gt mail inbox                           # Check messages
gt mail read <id>                       # Read message
gt mail send <addr> -s "Subject" -m "Body"
gt mail send --human -s "..."           # To overseer
```

### Agent Lifecycle

```bash
gt handoff                   # Request session cycle
gt handoff --shutdown        # Terminate (polecats)
gt peek <agent>              # Check agent health
gt nudge <agent> "message"   # Send message to agent
gt agents                    # List/navigate between sessions
gt <role> attach             # Jump into agent session
```

### Beads Integration

```bash
bd ready                     # Work with no blockers
bd list --status=in_progress # Active work
bd show <id>                 # Issue details
bd create --title="..." --type=task
bd update <id> --status=in_progress
bd close <id>
bd sync                      # Push/pull changes
```

## Workflows

### Full Stack (Recommended)

```bash
gt start                               # Start Gas Town
cd ~/gt && gt prime                    # Enter Mayor session

# Inside Mayor session:
# "Create a convoy for issues 123 and 456 in myproject"
# "What's the status of my work?"

# Or CLI commands:
gt convoy create "Feature X" issue-123 issue-456
gt sling issue-123 myproject           # Spawns polecat
gt convoy list                         # Dashboard
```

### Minimal (No Tmux)

```bash
gt convoy create "Fix bugs" issue-123
gt sling issue-123 myproject
claude --resume                        # Agent reads mail, runs work
gt convoy list                         # Check progress
```

## Molecules and Formulas

Formulas define structured workflows. Cook them, sling them to agents.

### Basic Formula

```toml
# .beads/formulas/shiny.formula.toml
formula = "shiny"
description = "Design before code, review before ship"

[[steps]]
id = "design"
description = "Think about architecture"

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

### Formula Lifecycle (MEOW)

| Phase | Name | Storage | Behavior |
|-------|------|---------|----------|
| Ice-9 | Formula | `.beads/formulas/` | Source template |
| Solid | Protomolecule | `.beads/` | Frozen template |
| Liquid | Mol | `.beads/` | Flowing work, persistent |
| Vapor | Wisp | `.beads/` (ephemeral) | Transient, for patrols |

### Formula Commands

```bash
# Beads operations (data)
bd formula list              # Available formulas
bd cook <formula>            # Formula → Protomolecule
bd mol pour <proto>          # Create persistent mol
bd mol wisp <proto>          # Create ephemeral wisp

# Agent operations
gt hook                      # What's on MY hook
gt mol current               # What should I work on next
gt mol progress <id>         # Execution progress
```

## Navigation Guide

| Need to... | Read this resource |
|------------|-------------------|
| Get started quickly | [quick-start.md](resources/quick-start.md) |
| Full command reference | [commands-reference.md](resources/commands-reference.md) |
| Understand agent roles | [roles-and-agents.md](resources/roles-and-agents.md) |
| Work with molecules/formulas | [molecules-formulas.md](resources/molecules-formulas.md) |
| Debug common issues | [troubleshooting.md](resources/troubleshooting.md) |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `BD_ACTOR` | Agent identity for attribution |
| `BEADS_DIR` | Point to shared beads database |
| `BEADS_NO_DAEMON` | Required for worktree polecats |
| `GT_TOWN_ROOT` | Override town root detection |
| `GT_ROLE` | Agent role type |
| `GT_RIG` | Rig name for rig-level agents |

## Beads Routing

Gas Town routes beads commands based on issue ID prefix:

```bash
bd show gp-xyz    # Routes to greenplace rig's beads
bd show hq-abc    # Routes to town-level beads
bd show wyv-123   # Routes to wyvern rig's beads
```

Routes defined in `~/gt/.beads/routes.jsonl`.

## Common Patterns

### Creating and Tracking Work

```bash
# Create convoy, assign work
gt convoy create "Feature X" gt-abc gt-def --notify
gt sling gt-abc myproject
gt sling gt-def myproject

# Monitor progress
gt convoy list
gt convoy status hq-cv-xyz
```

### Cross-Rig Work

```bash
# Option 1: Worktrees (you own the work)
gt worktree beads  # Creates ~/gt/beads/crew/gastown-joe/

# Option 2: Dispatch (target rig owns work)
bd create --prefix beads "Fix bug"
gt convoy create "Fix" bd-xyz
gt sling bd-xyz beads
```

### Agent Session Cycling

```bash
# Agent notices context filling
gt handoff                   # Sends mail to self
# Manager kills/restarts session
# New session reads handoff mail, continues
```

## Key Principles

1. **Hook-driven execution** - If work is on your hook, run it immediately
2. **Beads as control plane** - All state is git-backed issues
3. **Convoy for visibility** - Track batched work across rigs
4. **Sling for assignment** - Unified dispatch to any agent type
5. **Molecules for workflows** - Multi-step work survives crashes

## Prerequisites

- **Go 1.23+** - [go.dev/dl](https://go.dev/dl/)
- **Git 2.25+** - for worktree support
- **beads (bd)** - [github.com/steveyegge/beads](https://github.com/steveyegge/beads)
- **tmux 3.0+** - recommended for full experience
- **Claude Code CLI** - [claude.ai/code](https://claude.ai/code)

---

**Skill Status**: Complete Gas Town orchestration guide
**Line Count**: ~300 lines (within 500-line rule)
**Progressive Disclosure**: 5 resource files for deep dives
