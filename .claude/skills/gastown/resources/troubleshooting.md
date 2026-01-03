# Gas Town Troubleshooting

Common issues and solutions.

## Quick Diagnostics

Always start here:

```bash
# Run health check
gt doctor

# Auto-repair
gt doctor --fix

# Verbose output
gt doctor --verbose
```

## Installation Issues

### `gt: command not found`

**Cause**: Binary not in PATH

**Solution**:
```bash
# Check GOBIN
echo $GOBIN
# Default: ~/go/bin

# Add to PATH in ~/.bashrc or ~/.zshrc
export PATH=$PATH:$(go env GOBIN)

# Or install to standard location
go install github.com/steveyegge/gastown/cmd/gt@latest
```

### `bd: command not found`

**Cause**: Beads not installed

**Solution**:
```bash
go install github.com/steveyegge/beads/cmd/bd@latest
```

### `tmux not found`

**Cause**: tmux not installed

**Solution**:
```bash
# macOS
brew install tmux

# Ubuntu/Debian
sudo apt install tmux

# Check version (need 3.0+)
tmux -V
```

## Town Issues

### Doctor Shows Errors

Run auto-repair first:

```bash
gt doctor --fix
```

Common fixes:
- Missing directories: Creates them
- Invalid config: Resets to defaults
- Orphaned worktrees: Cleans up

### Can't Enter Mayor Session

**Cause**: Gas Town not started

**Solution**:
```bash
# Start Gas Town first
gt start

# Then enter Mayor
gt prime
```

### Town Root Not Detected

**Cause**: Not in town directory

**Solution**:
```bash
# Navigate to town root
cd ~/gt

# Or set explicitly
export GT_TOWN_ROOT=~/gt
```

## Rig Issues

### Rig Add Fails

**Cause**: Git URL invalid or auth issues

**Solution**:
```bash
# Check git URL works
git ls-remote https://github.com/you/repo.git

# For SSH, ensure key is loaded
ssh-add -l

# Try with explicit auth
gt rig add myproject git@github.com:you/repo.git
```

### Beads Prefix Mismatch

**Cause**: Issue prefix doesn't match rig

**Solution**:
```bash
# Check rig config
cat ~/gt/myproject/config.json | jq .beads.prefix

# Check routes
cat ~/gt/.beads/routes.jsonl

# Use correct prefix
bd create --prefix=mp "Task"
```

### Missing Beads Directory

**Cause**: Symlink or redirect broken

**Solution**:
```bash
# Check symlink
ls -la ~/gt/myproject/.beads

# Should point to mayor's clone
# ~/gt/myproject/.beads -> ~/gt/myproject/mayor/rig/.beads
```

## Agent Issues

### Stuck Worker

**Cause**: Agent unresponsive or in error state

**Solution**:
```bash
# Check status
gt peek myproject/polecats/Toast

# Send nudge
gt nudge myproject/polecats/Toast "Continue work"

# If still stuck, kill
gt session stop myproject/polecats/Toast
```

### Agent in Wrong Directory

**Cause**: Working in wrong cwd

**Solution**:
```bash
# Check doctor
gt doctor

# Agent should be in its home directory
# Polecat: ~/gt/<rig>/polecats/<name>/
# Crew: ~/gt/<rig>/crew/<name>/
```

### Context Full / Need Handoff

**Cause**: Agent context limit reached

**Solution**:
```bash
# From agent
gt handoff

# Manager will cycle session
# New session reads handoff mail
```

### Polecat Won't Terminate

**Cause**: Shutdown request not processed

**Solution**:
```bash
# From polecat
gt handoff --shutdown

# If stuck, force kill
gt session stop myproject/polecats/Toast

# Witness should clean up worktree
```

## Convoy Issues

### Convoy Not Tracking Issues

**Cause**: Issues not in convoy

**Solution**:
```bash
# Check convoy contents
gt convoy status hq-cv-xyz

# Add missing issues
gt convoy add hq-cv-xyz gt-abc
```

### Stranded Convoy

**Cause**: All issues closed but convoy not landed

**Solution**:
```bash
# Find stranded convoys
gt convoy check --stranded

# Force check convoy
gt convoy check hq-cv-xyz
```

### No Notification on Landing

**Cause**: `--notify` not set or mail issue

**Solution**:
```bash
# Convoys need --notify flag
gt convoy create "name" issue-1 --notify

# Check mail
gt mail inbox
```

## Molecule Issues

### Formula Not Found

**Cause**: Formula not in formulas directory

**Solution**:
```bash
# List available formulas
bd formula list

# Check formulas directory
ls ~/.beads/formulas/
ls ~/gt/.beads/formulas/
```

### Molecule Step Stuck

**Cause**: Step not advancing

**Solution**:
```bash
# Check current step
gt mol current

# Check step dependencies
bd mol show <mol-id>

# Complete step manually
gt mol step done <step-id>
```

### Wisp Not Burning

**Cause**: Wisp still attached

**Solution**:
```bash
# Burn explicitly
bd mol burn <wisp-id>

# Or from agent
gt mol burn
```

## Git Issues

### Worktree Conflicts

**Cause**: Multiple worktrees on same branch

**Solution**:
```bash
# List worktrees
git -C ~/gt/myproject/.repo.git worktree list

# Remove orphaned worktrees
git -C ~/gt/myproject/.repo.git worktree prune
```

### Dirty Git State

**Cause**: Uncommitted changes blocking operations

**Solution**:
```bash
# Check status
git status

# Commit or stash
git add -A && git commit -m "WIP"
# or
git stash

# Then retry operation
```

### Push Rejected

**Cause**: Remote has changes

**Solution**:
```bash
# Pull first
git pull --rebase

# Then push
git push
```

## Communication Issues

### Mail Not Delivered

**Cause**: Invalid address or mail queue issue

**Solution**:
```bash
# Check address format
# Valid: mayor/, witness, myproject/polecats/Toast

# Check mail directly
ls ~/gt/.beads/mail/

# Force sync
bd sync
```

### Nudge Not Working

**Cause**: tmux send-keys issue

**Solution**:
```bash
# Always use gt nudge, not raw tmux
gt nudge <agent> "message"

# Never use:
# tmux send-keys -t session "message"
```

## Performance Issues

### Slow Operations

**Cause**: Large beads database or many worktrees

**Solution**:
```bash
# Sync and compact
bd sync

# Clean old convoys
gt convoy list --status=closed  # Review
# (Manual cleanup as needed)

# Prune worktrees
git -C ~/gt/myproject/.repo.git worktree prune
```

### Too Many Agents

**Cause**: Polecats not cleaning up

**Solution**:
```bash
# Check polecat count
gt polecat list

# Witness should clean up
gt peek myproject/witness

# Force cleanup
gt session stop --rig myproject
```

## Common Mistakes

1. **Using dogs for user work**
   - Dogs are Deacon helpers, NOT workers
   - Use crew or polecats for work

2. **Confusing crew with polecats**
   - Crew: persistent, human-managed
   - Polecats: transient, Witness-managed

3. **Working in wrong directory**
   - Gas Town uses cwd for identity
   - Stay in your home directory

4. **Waiting for confirmation when hooked**
   - The hook IS your assignment
   - Execute immediately

5. **Creating worktrees when dispatch is better**
   - If work should be owned by target rig, dispatch
   - Use worktrees when YOU own the work

## Getting Help

```bash
# Command help
gt help
gt <command> --help

# Version info
gt version

# Doctor report for bug reports
gt doctor --verbose > doctor-report.txt
```

## Debug Flags

```bash
# Beads routing debug
BD_DEBUG_ROUTING=1 bd show <id>

# Verbose git operations
GIT_TRACE=1 gt rig add ...
```
