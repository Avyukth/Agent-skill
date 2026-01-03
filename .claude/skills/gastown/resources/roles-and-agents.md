# Gas Town Roles and Agents

Understanding the agent taxonomy and how different roles interact.

## Role Overview

Gas Town has two categories of roles: **Infrastructure Roles** (manage the system) and **Worker Roles** (do project work).

### Infrastructure Roles

| Role | Scope | Lifecycle | Purpose |
|------|-------|-----------|---------|
| **Mayor** | Town-wide | Singleton, persistent | Global coordinator at town root |
| **Deacon** | Town-wide | Singleton, daemon | Background supervisor ([watchdog chain](../docs/watchdog-chain.md)) |
| **Witness** | Per-rig | One per rig, persistent | Polecat lifecycle manager |
| **Refinery** | Per-rig | One per rig, persistent | Merge queue processor |

### Worker Roles

| Role | Scope | Lifecycle | Purpose |
|------|-------|-----------|---------|
| **Polecat** | Per-task | Ephemeral, Witness-managed | Worker with own worktree |
| **Crew** | User-managed | Long-lived, persistent | Worker with own clone |
| **Dog** | Infrastructure | Very short, Deacon-managed | Helper for system tasks |

## The Mayor

The Mayor is your primary interface to Gas Town. It's Claude Code with full context about your workspace, projects, and agents.

### Responsibilities

- Cross-rig coordination
- Work dispatch via convoys and sling
- Overseer communication
- Strategic decision making

### Identity

```
Location: ~/gt/mayor/
Session: gt mayor attach
Identity: mayor/
```

### Using the Mayor

```bash
# Enter Mayor session
gt prime

# Inside Mayor, just ask:
# "Create a convoy for issues 123 and 456"
# "What's the status of my work?"
# "Help me fix the auth bug in webapp"
```

## The Deacon

Background daemon that supervises the entire town. Runs continuously.

### Responsibilities

- Agent lifecycle management
- Health checks (watchdog chain)
- Plugin execution
- System-level tasks via Dogs

### Identity

```
Location: ~/gt/deacon/
Process: Background daemon
Helpers: deacon/dogs/
```

### Dogs

Dogs are NOT workers. They're Deacon helpers for infrastructure tasks:

- **Boot**: Triages Deacon health on daemon tick
- Future: log rotation, health checks, etc.

## The Witness

Per-rig agent that monitors polecats.

### Responsibilities

- Monitor polecat health
- Detect stuck workers
- Nudge unresponsive polecats
- Recycle completed polecats
- Manage worktree lifecycle

### Identity

```
Location: ~/gt/<rig>/witness/
Session: gt witness attach
Identity: <rig>/witness
```

### Patrol Loop

```
1. bd mol wisp mol-witness-patrol
2. Check all polecats
3. Nudge stuck ones
4. Recycle completed ones
5. bd mol squash (or burn)
6. Loop
```

## The Refinery

Per-rig agent that manages the merge queue.

### Responsibilities

- Process merge queue
- Review PRs
- Run integration tests
- Merge approved changes

### Identity

```
Location: ~/gt/<rig>/refinery/rig/
Session: gt refinery attach
Identity: <rig>/refinery
Worktree: On main branch
```

## Polecats

Ephemeral workers that spawn, do work, and disappear.

### Lifecycle

```
1. gt sling <bead> <rig>     # Spawns polecat
2. Polecat works on bead
3. Completes work
4. bd mol squash             # Create digest
5. Submit to merge queue
6. gt handoff --shutdown     # Request termination
7. Witness kills session
8. Witness removes worktree
```

### Identity

```
Location: ~/gt/<rig>/polecats/<name>/
Session: Named after spawn (Toast, Maple, etc.)
Identity: <rig>/polecats/<name>
Worktree: On feature branch
```

### When to Use

- Discrete, well-defined tasks
- Batch work (tracked via convoys)
- Parallelizable work
- Work that benefits from supervision

## Crew

Persistent workers managed by humans.

### Lifecycle

- Created manually by human
- Long-lived (days, weeks, months)
- Human controls lifecycle
- No automatic monitoring

### Identity

```
Location: ~/gt/<rig>/crew/<name>/
Session: Named by human
Identity: <rig>/crew/<name>
Clone: Full git clone
```

### When to Use

- Exploratory work
- Long-running projects
- Work requiring human judgment
- Direct control needed

## Crew vs Polecats

| Aspect | Crew | Polecat |
|--------|------|---------|
| **Lifecycle** | Persistent (user controls) | Transient (Witness controls) |
| **Monitoring** | None | Witness watches, nudges |
| **Work assignment** | Human-directed | Slung via `gt sling` |
| **Git state** | Pushes to main directly | Works on branch |
| **Cleanup** | Manual | Automatic on completion |
| **Identity** | `<rig>/crew/<name>` | `<rig>/polecats/<name>` |

## Cross-Rig Work

When an agent needs to work in another rig:

### Option 1: Worktrees (Preferred)

Create a worktree in the target rig. Identity preserved.

```bash
# gastown/crew/joe needs to fix a beads bug
gt worktree beads
# Creates ~/gt/beads/crew/gastown-joe/
# Identity: gastown/crew/joe (preserved)
```

### Option 2: Dispatch to Local Workers

For work that should be owned by the target rig:

```bash
bd create --prefix beads "Fix auth bug"
gt convoy create "Auth fix" bd-xyz
gt sling bd-xyz beads
# Work owned by beads rig
```

### When to Use Which

| Scenario | Approach |
|----------|----------|
| You need to fix something quick | Worktree |
| Work should appear in YOUR CV | Worktree |
| Work should be done by target rig | Dispatch |
| Infrastructure/system task | Let Deacon handle |

## Identity and Attribution

All work is attributed to the actor who performed it:

```
Git commits:      Author: gastown/crew/joe <owner@example.com>
Beads issues:     created_by: gastown/crew/joe
Events:           actor: gastown/crew/joe
```

Identity is preserved even when working cross-rig:
- `gastown/crew/joe` working in `~/gt/beads/crew/gastown-joe/`
- Commits still attributed to `gastown/crew/joe`

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `BD_ACTOR` | Agent identity for attribution |
| `GT_ROLE` | Agent role type |
| `GT_RIG` | Rig name for rig-level agents |
| `GT_POLECAT` | Polecat name (polecats only) |

## The Propulsion Principle

All agents follow the same core principle:

> **If you find something on your hook, YOU RUN IT.**

This applies regardless of role:
- The hook IS your assignment
- Execute immediately without waiting
- Molecules survive crashes
- Any agent can continue any molecule
