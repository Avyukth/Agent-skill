# Molecules and Formulas

Structured workflows in Gas Town using the MEOW system.

## Overview

**M**olecular **E**xpression **O**f **W**ork (MEOW) is Gas Town's workflow system.

- **Formulas** define workflow templates (source TOML)
- **Protomolecules** are frozen, reusable templates
- **Molecules** are live, persistent workflows
- **Wisps** are ephemeral molecules (for patrols)

## States of Matter

| Phase | Name | Storage | Behavior |
|-------|------|---------|----------|
| Ice-9 | Formula | `.beads/formulas/` | Source template, composable |
| Solid | Protomolecule | `.beads/` | Frozen template, reusable |
| Liquid | Mol | `.beads/` | Flowing work, persistent |
| Vapor | Wisp | `.beads/` (ephemeral) | Transient, for patrols |

*(Protomolecules are an homage to The Expanse. Ice-9 is a nod to Vonnegut.)*

## Operators

| Operator | From → To | Effect |
|----------|-----------|--------|
| `cook` | Formula → Protomolecule | Expand macros, flatten |
| `pour` | Proto → Mol | Instantiate as persistent |
| `wisp` | Proto → Wisp | Instantiate as ephemeral |
| `squash` | Mol/Wisp → Digest | Condense to permanent record |
| `burn` | Wisp → ∅ | Discard without record |

## Writing Formulas

### Basic Structure

```toml
# .beads/formulas/my-workflow.formula.toml

formula = "my-workflow"
type = "workflow"           # workflow | expansion | aspect
version = 1
description = "My workflow description"

# Variables
[vars.feature]
description = "Feature name"
required = true

[vars.priority]
description = "Priority level"
default = "medium"

# Steps
[[steps]]
id = "step-1"
title = "First step"
description = "Do the first thing"

[[steps]]
id = "step-2"
title = "Second step"
description = "Do the second thing"
needs = ["step-1"]          # Dependencies

[[steps]]
id = "step-3"
title = "Third step"
description = "Do the third thing"
needs = ["step-2"]
```

### Step Dependencies

Steps can depend on other steps:

```toml
[[steps]]
id = "implement"
needs = ["design"]          # Must complete design first

[[steps]]
id = "test"
needs = ["implement"]       # Must complete implement first

[[steps]]
id = "review"
needs = ["test", "docs"]    # Must complete both test and docs
```

### Variables in Templates

Use `{{variable}}` syntax:

```toml
[[steps]]
id = "implement-{{feature}}"
title = "Implement {{feature}}"
description = "Build the {{feature}} feature"
```

## Example Formulas

### Simple Feature Workflow

```toml
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

### Release Workflow

```toml
formula = "release"
description = "Version bump and release workflow"

[vars.version]
description = "Version to release"
required = true

[[steps]]
id = "bump-version"
description = "Update version in version.go and CHANGELOG"

[[steps]]
id = "update-deps"
needs = ["bump-version"]
description = "Run go mod tidy, update go.sum"

[[steps]]
id = "run-tests"
needs = ["update-deps"]
description = "Full test suite"

[[steps]]
id = "build-binaries"
needs = ["run-tests"]
description = "Cross-compile for all platforms"

[[steps]]
id = "create-tag"
needs = ["build-binaries"]
description = "Git tag with version"

[[steps]]
id = "publish-release"
needs = ["create-tag"]
description = "Create GitHub release"
```

### Parallel Steps

Steps without dependencies run in parallel:

```toml
[[steps]]
id = "design"
description = "Design phase"

[[steps]]
id = "frontend"
needs = ["design"]

[[steps]]
id = "backend"
needs = ["design"]

[[steps]]
id = "integrate"
needs = ["frontend", "backend"]  # Waits for both
```

## Formula Composition

### Extending Formulas

```toml
formula = "shiny-enterprise"
extends = ["shiny"]

[[steps]]
id = "security-audit"
needs = ["test"]
description = "Run security scan"

# Modify submit to need security-audit
[[steps]]
id = "submit"
needs = ["security-audit"]
```

### Aspects (Cross-Cutting Concerns)

```toml
[compose]
aspects = ["security-audit", "performance-check"]
```

### Macro Expansion

```toml
[[compose.expand]]
target = "implement"
with = "implementation-checklist"
```

## Using Formulas

### Workflow

```bash
# 1. List available formulas
bd formula list

# 2. Cook into protomolecule
bd cook shiny

# 3. Pour into molecule (persistent)
bd mol pour shiny --var feature=auth

# 4. Create convoy and sling
gt convoy create "Auth feature" gt-xyz
gt sling gt-xyz myproject

# 5. Monitor progress
gt convoy list
```

### What Happens

1. **Cook** expands the formula into a protomolecule
2. **Pour** creates a molecule with steps as beads
3. **Worker executes** each step, closing beads as it goes
4. **Crash recovery**: Worker restarts, reads molecule, continues

### Crash Recovery

If a polecat crashes after completing `run-tests`:

```
1. New polecat spawns
2. Reads molecule state
3. Sees run-tests is closed
4. Continues from build-binaries
```

## Molecule Commands

### Beads Operations (bd)

Data operations on molecules:

```bash
# Formulas
bd formula list              # Available formulas
bd formula show <name>       # Formula details
bd cook <formula>            # Formula → Proto

# Molecules
bd mol list                  # Available protos
bd mol show <id>             # Proto details
bd mol pour <proto>          # Create mol
bd mol wisp <proto>          # Create wisp
bd mol bond <proto> <parent> # Attach to parent
bd mol squash <id>           # Condense to digest
bd mol burn <id>             # Discard wisp
```

### Agent Operations (gt)

Operations from agent perspective:

```bash
# Hook management
gt hook                      # What's on MY hook
gt mol current               # What should I work on
gt mol progress <id>         # Execution progress
gt mol attach <bead> <mol>   # Pin molecule to bead
gt mol detach <bead>         # Unpin molecule

# Lifecycle (operates on attached molecule)
gt mol burn                  # Burn attached
gt mol squash                # Squash attached
gt mol step done <step>      # Complete a step
```

## Patrol Molecules

Infrastructure agents (Deacon, Witness, Refinery) run patrol loops:

| Agent | Patrol Molecule | Responsibility |
|-------|-----------------|----------------|
| **Deacon** | `mol-deacon-patrol` | Agent lifecycle, plugins, health |
| **Witness** | `mol-witness-patrol` | Monitor polecats, nudge stuck |
| **Refinery** | `mol-refinery-patrol` | Process merge queue, review PRs |

### Patrol Loop

```
1. bd mol wisp mol-<role>-patrol   # Create ephemeral
2. Execute steps
3. bd mol squash (or burn)
4. Loop
```

## Plugin Molecules

Plugins are molecules with special labels:

```json
{
  "id": "mol-security-scan",
  "labels": ["template", "plugin", "witness", "tier:haiku"]
}
```

Patrol molecules bond plugins dynamically:

```bash
bd mol bond mol-security-scan $PATROL_ID --var scope="$SCOPE"
```

## Best Practices

### Formula Design

1. **Keep steps atomic** - Each step should be completable independently
2. **Clear dependencies** - Explicit `needs` for ordering
3. **Descriptive IDs** - Steps become beads, IDs matter
4. **Document variables** - Required vs optional, defaults

### Molecule Usage

1. **Pour for persistent work** - Features, releases
2. **Wisp for ephemeral work** - Patrols, one-off checks
3. **Squash for history** - Create permanent record
4. **Burn for cleanup** - Discard routine wisps

### Crash Recovery

- Molecules survive crashes by design
- Any agent can continue any molecule
- State is in beads, not agent memory
- Close steps as you complete them

## Debugging

```bash
# Show molecule state
bd mol show <id>

# Show what's current for agent
gt mol current

# Show progress
gt mol progress <id>

# Check beads for step status
bd show <step-bead-id>
```
