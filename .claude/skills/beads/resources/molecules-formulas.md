# Molecules and Formulas

Guide to structured workflows in beads.

## Table of Contents

- [Overview](#overview)
- [Formulas](#formulas)
- [Molecules](#molecules)
- [Lifecycle (MEOW)](#lifecycle-meow)
- [Commands](#commands)
- [Examples](#examples)

---

## Overview

Molecules and formulas enable structured, multi-step workflows:

| Concept | What It Is | Purpose |
|---------|------------|---------|
| **Formula** | Workflow template | Define reusable step sequences |
| **Protomolecule** | Frozen template | Snapshot of formula for execution |
| **Molecule** | Active workflow | Running instance with state |
| **Wisp** | Ephemeral workflow | Transient, for patrols/checks |

### Why Use Molecules?

| Without Molecules | With Molecules |
|-------------------|----------------|
| Agents forget multi-step work | Steps survive crashes/restarts |
| Manual step tracking | Automatic step progression |
| Ad-hoc workflows | Repeatable, documented processes |
| Lost context on compaction | State persists in beads |

---

## Formulas

### What is a Formula?

A formula is a TOML file defining a workflow template:

```toml
# .beads/formulas/shiny.formula.toml
formula = "shiny"
description = "Design before code, review before ship"
version = "1.0"

[[steps]]
id = "design"
description = "Think about architecture"
advice = "Consider edge cases and error handling"

[[steps]]
id = "implement"
description = "Write the code"
needs = ["design"]

[[steps]]
id = "test"
description = "Write and run tests"
needs = ["implement"]

[[steps]]
id = "submit"
description = "Create PR for review"
needs = ["test"]
```

### Formula Fields

| Field | Type | Description |
|-------|------|-------------|
| `formula` | string | Unique name identifier |
| `description` | string | Human-readable description |
| `version` | string | Version number |
| `steps` | []Step | Ordered step definitions |

### Step Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique step identifier |
| `description` | string | What this step accomplishes |
| `needs` | []string | Dependencies (other step IDs) |
| `advice` | string | Guidance for executing step |
| `condition` | string | Optional condition expression |
| `range` | Range | For iteration over items |

### Step Dependencies

Steps can depend on other steps:

```toml
[[steps]]
id = "implement"
needs = ["design"]  # Can't start until design is done

[[steps]]
id = "test"
needs = ["implement"]

[[steps]]
id = "docs"
needs = ["implement"]  # Parallel with test

[[steps]]
id = "submit"
needs = ["test", "docs"]  # Waits for both
```

Dependency graph:
```
design ──▶ implement ──┬──▶ test ──┐
                       │           │
                       └──▶ docs ──┴──▶ submit
```

### Formula Location

```
.beads/formulas/
├── shiny.formula.toml      # Design-first workflow
├── standard.formula.toml   # Basic workflow
├── hotfix.formula.toml     # Emergency fix workflow
└── review.formula.toml     # Code review workflow
```

---

## Molecules

### What is a Molecule?

A molecule is an active instance of a formula workflow:

```json
{
  "id": "mol-abc123",
  "name": "Feature X Implementation",
  "proto_id": "proto-shiny-001",
  "formula": "shiny",
  "issues": ["bd-a1t0", "bd-a1t1"],
  "current_step": "implement",
  "completed_steps": ["design"],
  "state": "active",
  "created_at": "2025-01-03T10:00:00Z",
  "updated_at": "2025-01-03T14:30:00Z"
}
```

### Molecule States

| State | Meaning |
|-------|---------|
| `pending` | Created but not started |
| `active` | Currently being executed |
| `paused` | Temporarily stopped |
| `completed` | All steps finished |
| `burned` | Terminated/cancelled |

### Molecule vs Issues

| Aspect | Issues | Molecules |
|--------|--------|-----------|
| Scope | Single work item | Multi-step workflow |
| Lifecycle | Open → Closed | Pending → Active → Complete |
| State | Status only | Step progression |
| Persistence | Always | Can be ephemeral (wisps) |

---

## Lifecycle (MEOW)

The molecule lifecycle follows the MEOW pattern:

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOLECULE LIFECYCLE (MEOW)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│   │   ICE-9     │────▶│    SOLID    │────▶│   LIQUID    │       │
│   │  (Formula)  │cook │(Protomol)   │pour │ (Molecule)  │       │
│   └─────────────┘     └─────────────┘     └─────────────┘       │
│         ▲                                       │               │
│         │                                       │ burn          │
│         │                                       ▼               │
│         │                               ┌─────────────┐         │
│         │                               │    VAPOR    │         │
│         └───────────────────────────────│   (Wisp)    │         │
│                                         └─────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Phases

| Phase | Name | Storage | Behavior |
|-------|------|---------|----------|
| **Ice-9** | Formula | `.beads/formulas/` | Source template, reusable |
| **Solid** | Protomolecule | `.beads/` | Frozen snapshot, immutable |
| **Liquid** | Molecule | `.beads/` | Active workflow, persistent |
| **Vapor** | Wisp | `.beads/` (ephemeral) | Transient, for patrols |

### Phase Transitions

```bash
# Ice-9 → Solid: Cook formula into protomolecule
bd cook shiny
# Creates: proto-shiny-001

# Solid → Liquid: Pour into persistent molecule
bd mol pour proto-shiny-001 --name "Feature X"
# Creates: mol-abc123

# Solid → Vapor: Create ephemeral wisp
bd mol wisp proto-shiny-001
# Creates: wisp-xyz (auto-cleaned)

# Liquid → Burned: Complete/terminate molecule
bd mol burn mol-abc123
```

---

## Commands

### Formula Commands

```bash
# List available formulas
bd formula list

# Show formula details
bd formula show shiny

# Create/cook protomolecule from formula
bd cook shiny
bd cook shiny --name "Feature X Proto"
```

### Molecule Commands

```bash
# Create molecule from protomolecule
bd mol pour <proto-id>
bd mol pour <proto-id> --name "Feature X"

# Create ephemeral wisp
bd mol wisp <proto-id>

# Show current molecule (for agent)
bd mol current
bd mol current --json

# List all molecules
bd mol list
bd mol list --state active

# Show molecule details
bd mol show <mol-id>

# Show execution progress
bd mol progress <mol-id>

# Bond issues to molecule
bd mol bond <mol-id> <issue-id>

# Advance to next step
bd mol advance <mol-id>

# Complete/terminate molecule
bd mol burn <mol-id>
bd mol burn <mol-id> --reason "Completed successfully"
```

### Agent Workflow Commands

```bash
# Check what's on my hook
gt hook              # Gas Town command

# Get current molecule work
bd mol current --json

# Progress through steps
bd mol advance <mol-id>
```

---

## Examples

### Example 1: Shiny Workflow

Define a design-first workflow:

```toml
# .beads/formulas/shiny.formula.toml
formula = "shiny"
description = "Design before code, review before ship"

[[steps]]
id = "think"
description = "Analyze requirements and constraints"
advice = "Read existing code, understand the domain"

[[steps]]
id = "design"
description = "Create architecture plan"
needs = ["think"]
advice = "Document in DESIGN.md or issue comments"

[[steps]]
id = "implement"
description = "Write the code"
needs = ["design"]

[[steps]]
id = "test"
description = "Write and run tests"
needs = ["implement"]

[[steps]]
id = "review"
description = "Self-review and cleanup"
needs = ["test"]

[[steps]]
id = "submit"
description = "Create PR"
needs = ["review"]
```

Use it:

```bash
# Create proto
bd cook shiny

# Start molecule for a feature
bd mol pour proto-shiny-001 --name "Add user auth"

# Bond related issues
bd mol bond mol-abc123 bd-a1t0 bd-a1t1

# Work through steps
bd mol current  # Shows: think
# ... do thinking work ...
bd mol advance mol-abc123

bd mol current  # Shows: design
# ... create design ...
bd mol advance mol-abc123

# Continue until complete
bd mol burn mol-abc123 --reason "Feature shipped"
```

### Example 2: Hotfix Workflow

Fast-track for emergencies:

```toml
# .beads/formulas/hotfix.formula.toml
formula = "hotfix"
description = "Emergency fix with minimal ceremony"

[[steps]]
id = "identify"
description = "Confirm and understand the bug"

[[steps]]
id = "fix"
description = "Implement minimal fix"
needs = ["identify"]

[[steps]]
id = "verify"
description = "Test the fix works"
needs = ["fix"]

[[steps]]
id = "deploy"
description = "Ship immediately"
needs = ["verify"]
```

### Example 3: Review Patrol (Wisp)

Ephemeral check workflow:

```toml
# .beads/formulas/review-patrol.formula.toml
formula = "review-patrol"
description = "Quick code review checklist"

[[steps]]
id = "security"
description = "Check for security issues"

[[steps]]
id = "performance"
description = "Check for performance issues"

[[steps]]
id = "style"
description = "Check code style"

[[steps]]
id = "report"
description = "Summarize findings"
needs = ["security", "performance", "style"]
```

Use as wisp (auto-cleaned after):

```bash
bd mol wisp proto-review-patrol-001
# Execute patrol steps
# Wisp auto-expires after completion
```

---

## Best Practices

### Formula Design

1. **Keep steps atomic** - Each step should be completable independently
2. **Clear dependencies** - Only add `needs` for true dependencies
3. **Meaningful advice** - Help agents understand what to do
4. **Version your formulas** - Track changes over time

### Molecule Usage

1. **Bond related issues** - Group work items together
2. **Use wisps for checks** - Don't pollute with temporary workflows
3. **Burn completed molecules** - Clean up when done
4. **Check `bd mol current`** - Know what you should work on

### Integration with Gas Town

```bash
# Mayor creates molecule and dispatches
bd cook shiny
bd mol pour proto-shiny-001 --name "Feature X"
bd mol bond mol-abc123 bd-a1t0
gt sling bd-a1t0 myproject

# Polecat picks up work, follows molecule
bd mol current  # Shows current step
# ... work ...
bd mol advance mol-abc123
```

---

**Related Files:**
- [SKILL.md](../SKILL.md) - Main skill guide
- [commands-reference.md](commands-reference.md) - CLI commands
- [../gastown/SKILL.md](../gastown/SKILL.md) - Multi-agent orchestration
