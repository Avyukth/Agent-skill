# Troubleshooting

Common issues and solutions for beads.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Common Issues](#common-issues)
- [Sync Problems](#sync-problems)
- [Cache Issues](#cache-issues)
- [Performance Issues](#performance-issues)
- [Integration Problems](#integration-problems)
- [Recovery Procedures](#recovery-procedures)

---

## Quick Diagnostics

### Health Check

Run the doctor command first:

```bash
bd doctor
```

Output categories:
- **OK** - All checks passed
- **WARN** - Minor issues, still functional
- **ERROR** - Problems requiring attention

### Auto-Fix

```bash
bd doctor --fix
```

Automatically resolves:
- Cache inconsistencies
- Orphan dependencies
- Missing metadata
- Sync status issues

### Status Commands

```bash
# Check sync status
bd sync --status

# Check project stats
bd stats

# Check daemon status
bd daemon status
```

---

## Common Issues

### "Issue not found"

**Symptom:** `bd show <id>` or `bd update <id>` returns "not found"

**Causes:**
1. Issue doesn't exist
2. Cache out of sync
3. Wrong issue ID format

**Solutions:**

```bash
# Verify issue exists in JSONL
grep "<id>" .beads/issues.jsonl

# Rebuild cache
bd import -i .beads/issues.jsonl

# Check correct ID format
bd list --json | grep -i "<partial-id>"
```

### "No beads repository found"

**Symptom:** Commands fail with "not a beads repository"

**Causes:**
1. Not in a beads-enabled directory
2. `.beads/` directory missing or corrupted

**Solutions:**

```bash
# Check for .beads directory
ls -la .beads/

# Initialize if missing
bd init

# Reinitialize if corrupted
bd init --force
```

### "Permission denied"

**Symptom:** Commands fail with permission errors

**Causes:**
1. File permissions on .beads/
2. Lock file issues
3. Daemon socket permissions

**Solutions:**

```bash
# Fix directory permissions
chmod -R u+rw .beads/

# Remove stale lock
rm -f .beads/.lock

# Restart daemon
bd daemon stop
bd daemon start
```

### "JSON parse error"

**Symptom:** Import or export fails with JSON errors

**Causes:**
1. Corrupted JSONL file
2. Invalid JSON in record
3. Encoding issues

**Solutions:**

```bash
# Validate JSONL syntax
cat .beads/issues.jsonl | while read line; do
  echo "$line" | jq . > /dev/null || echo "Invalid: $line"
done

# Find problematic lines
grep -n "^" .beads/issues.jsonl | while read line; do
  num=$(echo "$line" | cut -d: -f1)
  content=$(echo "$line" | cut -d: -f2-)
  echo "$content" | jq . > /dev/null 2>&1 || echo "Line $num is invalid"
done
```

---

## Sync Problems

### "Sync conflict"

**Symptom:** `bd sync` fails with conflict message

**Causes:**
1. Concurrent edits to same issue
2. Diverged git branches
3. Unmerged changes

**Solutions:**

```bash
# Check git status
git status

# If merge conflict in JSONL:
# 1. Open file and resolve conflicts
# 2. Ensure each line is valid JSON
git add .beads/issues.jsonl
git commit -m "Resolve beads conflict"

# Rebuild cache
bd import -i .beads/issues.jsonl
```

### "Unable to push"

**Symptom:** `bd sync` push fails

**Causes:**
1. Remote has new commits
2. Branch protection rules
3. Authentication issues

**Solutions:**

```bash
# Pull first
bd sync --pull

# Then push
bd sync --push

# Or use git directly
git pull --rebase origin main
bd sync --push
```

### "Issues missing after pull"

**Symptom:** Issues existed before pull, now missing

**Causes:**
1. Cache not updated after pull
2. JSONL file was reset
3. Merge overwrote local changes

**Solutions:**

```bash
# Reimport JSONL
bd import -i .beads/issues.jsonl

# Check if issues in JSONL
grep -c "\"id\":" .beads/issues.jsonl

# Check git history
git log --oneline .beads/issues.jsonl
```

---

## Cache Issues

### "Cache out of date"

**Symptom:** `bd list` shows different issues than JSONL file

**Causes:**
1. Import not run after external change
2. Cache corruption
3. Multiple processes writing

**Solutions:**

```bash
# Force reimport
bd import -i .beads/issues.jsonl

# Or rebuild via doctor
bd doctor --fix
```

### "Cache corruption"

**Symptom:** Queries return garbage or errors

**Causes:**
1. Interrupted write operation
2. Disk space issues
3. SQLite corruption

**Solutions:**

```bash
# Remove and rebuild cache
rm ~/.cache/beads/*
bd import -i .beads/issues.jsonl

# Verify cache location
bd config get cache_dir
```

### "Slow queries"

**Symptom:** `bd list` or `bd search` takes long time

**Causes:**
1. Large JSONL file without compaction
2. Missing indexes
3. Daemon not running

**Solutions:**

```bash
# Compact JSONL file
bd compact

# Start daemon for faster queries
bd daemon start

# Check JSONL size
wc -l .beads/issues.jsonl
```

---

## Performance Issues

### "Commands are slow"

**Symptom:** All bd commands take several seconds

**Causes:**
1. Daemon not running
2. Large uncompacted files
3. Complex dependency graphs

**Solutions:**

```bash
# Enable daemon
bd daemon start

# Compact files
bd compact

# Check file sizes
ls -la .beads/
```

### "Daemon won't start"

**Symptom:** `bd daemon start` fails or daemon exits

**Causes:**
1. Port conflict
2. Lock file exists
3. Permission issues

**Solutions:**

```bash
# Check if already running
bd daemon status

# Force stop
bd daemon stop --force

# Remove stale files
rm -f .beads/.daemon.lock
rm -f .beads/.daemon.sock

# Start with logging
bd daemon start --foreground
```

### "High memory usage"

**Symptom:** bd processes consuming excessive memory

**Causes:**
1. Very large JSONL files
2. Many active molecules
3. Cache warming

**Solutions:**

```bash
# Compact to reduce size
bd compact

# Restart daemon
bd daemon stop
bd daemon start
```

---

## Integration Problems

### Linear: "Authentication failed"

**Symptom:** `bd linear sync` fails with auth error

**Solutions:**

```bash
# Verify token is set
echo $LINEAR_API_KEY

# Re-set token
export LINEAR_API_KEY="lin_api_..."

# Test connection
bd linear status
```

### MCP: "Server not responding"

**Symptom:** Claude can't connect to beads MCP

**Solutions:**

```bash
# Check MCP server is running
ps aux | grep beads-mcp

# Test manually
beads-mcp --help

# Check Claude settings
cat ~/.config/claude-code/settings.json | jq .mcp
```

### Git hooks: "Hook not running"

**Symptom:** Changes not exported on commit

**Solutions:**

```bash
# Check hook exists
ls -la .git/hooks/pre-commit

# Check hook is executable
chmod +x .git/hooks/pre-commit

# Reinstall hooks
bd hooks install --force
```

---

## Recovery Procedures

### Full Recovery from JSONL

If SQLite cache is lost or corrupted:

```bash
# Remove cache
rm -rf ~/.cache/beads/

# Reimport from JSONL
bd import -i .beads/issues.jsonl

# Verify
bd stats
bd list --limit 5
```

### Recovery from Git History

If JSONL was accidentally modified:

```bash
# View file history
git log --oneline .beads/issues.jsonl

# Restore from specific commit
git checkout <commit-hash> -- .beads/issues.jsonl

# Reimport
bd import -i .beads/issues.jsonl
```

### Recovery from Backup

If .beads/ directory was deleted:

```bash
# If git-tracked, restore
git checkout HEAD -- .beads/

# Or from backup
cp -r /backup/.beads ./

# Rebuild cache
bd import -i .beads/issues.jsonl
```

### Factory Reset

Complete reset (WARNING: destroys all beads data):

```bash
# Remove beads directory
rm -rf .beads/

# Remove cache
rm -rf ~/.cache/beads/

# Reinitialize
bd init
```

---

## Debug Mode

### Enable Verbose Output

```bash
# Verbose mode
bd -v list

# Extra verbose
bd -vv list
```

### Debug Environment

```bash
# Enable debug logging
export BD_DEBUG=1

# Run command
bd list

# Check logs
cat ~/.cache/beads/debug.log
```

### Report Issues

If problems persist:

```bash
# Gather diagnostics
bd doctor --json > doctor-report.json
bd stats --json > stats-report.json

# Include in bug report along with:
# - Go version: go version
# - OS: uname -a
# - Beads version: bd version
```

---

## Quick Reference

| Symptom | First Try |
|---------|-----------|
| Issue not found | `bd import -i .beads/issues.jsonl` |
| Slow commands | `bd daemon start` |
| Sync fails | `bd sync --status` then fix git |
| Cache issues | `bd doctor --fix` |
| Permission denied | Check file permissions |
| Integration fails | Check credentials/config |

---

**Related Files:**
- [SKILL.md](../SKILL.md) - Main skill guide
- [commands-reference.md](commands-reference.md) - CLI commands
- [sync-and-storage.md](sync-and-storage.md) - Sync architecture
