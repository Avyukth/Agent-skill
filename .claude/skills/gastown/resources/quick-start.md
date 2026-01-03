# Gas Town Quick Start Guide

Complete setup and first workflow in 10 minutes.

## Prerequisites

```bash
# Check prerequisites
go version          # Need 1.23+
git --version       # Need 2.25+
tmux -V             # Need 3.0+ (recommended)
which claude        # Claude Code CLI

# Install beads if missing
go install github.com/steveyegge/beads/cmd/bd@latest
```

## Installation

```bash
# Install Gas Town
go install github.com/steveyegge/gastown/cmd/gt@latest

# Verify installation
gt version
```

## Create Your First Town

```bash
# Create workspace at ~/gt
gt install ~/gt

# Navigate to town
cd ~/gt

# Check health
gt doctor
```

## Add a Project (Rig)

```bash
# Add a project from GitHub
gt rig add myproject https://github.com/you/repo.git

# Verify rig was created
gt rig list

# Check rig structure
ls ~/gt/myproject/
# config.json  .beads/  .repo.git/  mayor/
```

## Start Gas Town

```bash
# Start daemon and services
gt start

# Enter the Mayor session (recommended)
gt prime
```

## Your First Workflow

### Option A: Talk to the Mayor (Recommended)

Inside the Mayor session:

```
You: Help me fix issue #123 in myproject

Mayor: I'll create a convoy to track this work and dispatch a polecat...
       [Creates convoy, slings work, monitors progress]
```

### Option B: CLI Commands

```bash
# Create an issue to track
bd create --title="Fix authentication bug" --type=bug --prefix=mp
# Returns: mp-abc

# Create a convoy to track the work
gt convoy create "Auth fix" mp-abc --notify

# Sling work to a polecat
gt sling mp-abc myproject

# Check progress
gt convoy list
```

## Monitor Progress

```bash
# Dashboard of active convoys
gt convoy list

# Detailed convoy status
gt convoy status hq-cv-xyz

# Navigate between agent sessions
gt agents

# Check specific agent
gt peek myproject/polecats/Toast
```

## Complete Work

When the polecat finishes:

1. It closes the bead (`bd close mp-abc`)
2. Submits to merge queue
3. Convoy auto-lands
4. You get notified (if `--notify` was set)

## Shutdown

```bash
# Graceful shutdown
gt shutdown

# Emergency stop all agents
gt stop --all
```

## Next Steps

1. **Add more projects**: `gt rig add <name> <git-url>`
2. **Learn formulas**: Create multi-step workflows
3. **Set up Witness**: Automatic polecat lifecycle management
4. **Set up Refinery**: Automatic merge queue processing

## Common First Issues

| Problem | Solution |
|---------|----------|
| `gt: command not found` | Add `$GOBIN` to PATH |
| `bd: command not found` | Install beads: `go install github.com/steveyegge/beads/cmd/bd@latest` |
| `tmux not found` | Install tmux: `brew install tmux` or `apt install tmux` |
| Doctor shows errors | Run `gt doctor --fix` for auto-repair |
| Can't enter Mayor | Ensure tmux is running: `gt start` first |

## Shell Completions

Enable tab completion:

```bash
# Bash
source <(gt completion bash)

# Zsh
source <(gt completion zsh)

# Fish
gt completion fish > ~/.config/fish/completions/gt.fish
```

## Directory Structure After Setup

```
~/gt/                           Town root
├── .beads/                     Town-level beads
│   ├── routes.jsonl            Beads routing table
│   ├── issues.jsonl            Town issues (hq-*)
│   └── formulas/               Formula definitions
├── mayor/
│   └── town.json               Town configuration
├── myproject/                  Your rig
│   ├── config.json             Rig identity
│   ├── .beads/ → mayor/rig/.beads
│   ├── .repo.git/              Bare repo
│   ├── mayor/rig/              Mayor's clone
│   ├── polecats/               Ephemeral workers
│   ├── crew/                   Persistent workers
│   ├── witness/                Polecat monitor
│   └── refinery/rig/           Merge queue
```

## Example: Full Workflow

```bash
# 1. Setup (once)
gt install ~/gt
gt rig add webapp https://github.com/me/webapp.git
gt start

# 2. Create work
cd ~/gt
bd create --title="Add dark mode" --type=feature --prefix=wa
# Returns: wa-xyz

# 3. Track with convoy
gt convoy create "Dark mode feature" wa-xyz --notify --human

# 4. Assign to worker
gt sling wa-xyz webapp

# 5. Monitor
gt convoy list
gt peek webapp/polecats/Toast

# 6. When complete
gt convoy status hq-cv-abc  # Shows: LANDED
```
