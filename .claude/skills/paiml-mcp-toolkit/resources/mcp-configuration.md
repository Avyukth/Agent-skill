# MCP Server Configuration Guide

Complete guide for configuring Model Context Protocol (MCP) servers with Claude AI.

---

## What is MCP?

The Model Context Protocol (MCP) is an open standard developed by Anthropic that enables AI models to connect with external tools and data sources. Think of it as "USB-C for LLMs" - a universal connector that allows Claude to interact with local tools like PMAT.

### Architecture

```
┌─────────────┐     JSON-RPC 2.0     ┌─────────────┐
│   Claude    │ ◄──────────────────► │ MCP Server  │
│  (Client)   │      (stdio)         │   (PMAT)    │
└─────────────┘                      └─────────────┘
                                            │
                                            ▼
                                     ┌─────────────┐
                                     │  Codebase   │
                                     │  Analysis   │
                                     └─────────────┘
```

---

## Configuration File Locations

| Platform | Path |
|----------|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

---

## Basic Configuration

### Minimal PMAT Setup

```json
{
  "mcpServers": {
    "pmat": {
      "command": "pmat",
      "args": ["mcp"]
    }
  }
}
```

### Full PAIML Ecosystem

```json
{
  "mcpServers": {
    "pmat": {
      "command": "pmat",
      "args": ["mcp"],
      "env": {
        "RUST_LOG": "info",
        "PMAT_CONFIG": "/path/to/.pmat/config.toml"
      }
    },
    "ruchy": {
      "command": "ruchy",
      "args": ["mcp"],
      "env": {
        "RUST_LOG": "warn"
      }
    },
    "depyler": {
      "command": "depyler",
      "args": ["agent", "start", "--foreground"],
      "env": {
        "RUST_LOG": "info"
      }
    },
    "deterministic-agent": {
      "command": "/path/to/deterministic-mcp-agents/target/release/mcp-server",
      "args": [],
      "env": {
        "RUST_LOG": "debug"
      }
    }
  }
}
```

---

## Configuration Options

### Command Configuration

| Field | Type | Description |
|-------|------|-------------|
| `command` | string | Executable to run (must be in PATH or absolute path) |
| `args` | string[] | Command line arguments |
| `env` | object | Environment variables |
| `cwd` | string | Working directory (optional) |

### Environment Variables

```json
{
  "mcpServers": {
    "pmat": {
      "command": "pmat",
      "args": ["mcp"],
      "env": {
        "RUST_LOG": "debug",              // Logging level
        "PMAT_CONFIG": "~/.pmat/config.toml", // Custom config
        "PMAT_CACHE_DIR": "~/.cache/pmat",    // Cache location
        "PMAT_MAX_FILES": "10000",            // File limit
        "PMAT_TIMEOUT": "30"                  // Analysis timeout (seconds)
      }
    }
  }
}
```

---

## PMAT-Specific Configuration

### PMAT Config File (`.pmat/config.toml`)

```toml
[analysis]
# Languages to analyze
languages = ["rust", "typescript", "python"]

# Directories to exclude
exclude = ["target", "node_modules", ".git", "dist"]

# Maximum file size (KB)
max_file_size = 500

[quality_gates]
# TDG minimum grade
min_grade = "B"

# Maximum cyclomatic complexity
max_complexity = 20

# Minimum documentation coverage
min_doc_coverage = 80

# Zero SATD enforcement
zero_satd = true

[scoring]
# Enable Rust-specific scoring
rust_project_score = true

# Categories to evaluate
categories = ["ci-cd", "code-quality", "testing", "documentation", "dependencies"]

[mcp]
# MCP server options
max_concurrent_requests = 10
request_timeout = 60
enable_caching = true
cache_ttl = 300  # 5 minutes
```

---

## Verifying Configuration

### Step 1: Check Binary Availability

```bash
# Verify PMAT is installed
which pmat  # Should return path
pmat --version  # Should show v2.20+

# Verify it can run in MCP mode
echo '{"jsonrpc":"2.0","method":"initialize","id":1,"params":{}}' | pmat mcp --stdio
```

### Step 2: Check Configuration Syntax

```bash
# Validate JSON syntax
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | jq .
```

### Step 3: Restart Claude Desktop

After saving configuration:
1. Quit Claude Desktop completely
2. Reopen Claude Desktop
3. Look for the plug icon (🔌) indicating MCP connection

### Step 4: Test Tool Discovery

In Claude, type `/` to trigger command completion. You should see PMAT tools like:
- `analyze_tdg`
- `repo_score`
- `semantic_search`
- `quality_gate`

---

## Troubleshooting

### Connection Failed

**Symptoms**: No plug icon, tools not available

**Solutions**:

1. **Check PATH**:
```bash
# Add cargo bin to PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Verify
which pmat
```

2. **Use absolute path**:
```json
{
  "mcpServers": {
    "pmat": {
      "command": "/Users/username/.cargo/bin/pmat",
      "args": ["mcp"]
    }
  }
}
```

3. **Check permissions**:
```bash
chmod +x ~/.cargo/bin/pmat
```

### Server Crashes

**Symptoms**: Connection drops, errors in Claude

**Solutions**:

1. **Enable debug logging**:
```json
{
  "mcpServers": {
    "pmat": {
      "command": "pmat",
      "args": ["mcp", "--verbose"],
      "env": {
        "RUST_LOG": "debug"
      }
    }
  }
}
```

2. **Check log output**:
```bash
# Run manually to see errors
RUST_LOG=debug pmat mcp 2>&1 | tee pmat-debug.log
```

3. **Increase timeout**:
```json
{
  "env": {
    "PMAT_TIMEOUT": "120"
  }
}
```

### Tools Not Working

**Symptoms**: Tools visible but return errors

**Solutions**:

1. **Check project structure**:
```bash
# PMAT needs a valid project
pmat diagnose --project .
```

2. **Verify Cargo.toml exists** (for Rust projects):
```bash
ls Cargo.toml
```

3. **Check permissions**:
```bash
# Ensure PMAT can read files
ls -la src/
```

### Memory Issues

**Symptoms**: Slow response, timeouts on large projects

**Solutions**:

1. **Limit scope**:
```toml
# .pmat/config.toml
[analysis]
exclude = ["target", "node_modules", ".git", "dist", "vendor"]
max_file_size = 200  # KB
```

2. **Use incremental analysis**:
```bash
pmat analyze --incremental
```

3. **Increase limits**:
```json
{
  "env": {
    "PMAT_MAX_FILES": "5000",
    "PMAT_MEMORY_LIMIT": "2048"  // MB
  }
}
```

---

## Advanced Configuration

### Multiple Projects

```json
{
  "mcpServers": {
    "pmat-project-a": {
      "command": "pmat",
      "args": ["mcp"],
      "cwd": "/path/to/project-a",
      "env": {
        "PMAT_CONFIG": "/path/to/project-a/.pmat/config.toml"
      }
    },
    "pmat-project-b": {
      "command": "pmat",
      "args": ["mcp"],
      "cwd": "/path/to/project-b",
      "env": {
        "PMAT_CONFIG": "/path/to/project-b/.pmat/config.toml"
      }
    }
  }
}
```

### Custom Agents

```json
{
  "mcpServers": {
    "custom-review-agent": {
      "command": "/path/to/my-agent/target/release/review-agent",
      "args": ["--mode", "mcp"],
      "env": {
        "AGENT_CONFIG": "/path/to/agent-config.toml",
        "RUST_LOG": "info"
      }
    }
  }
}
```

### Conditional Configuration

Use shell scripts for conditional logic:

```bash
#!/bin/bash
# ~/bin/pmat-smart

# Detect project type
if [ -f "Cargo.toml" ]; then
    exec pmat mcp --preset rust
elif [ -f "package.json" ]; then
    exec pmat mcp --preset node
else
    exec pmat mcp
fi
```

```json
{
  "mcpServers": {
    "pmat": {
      "command": "/Users/username/bin/pmat-smart",
      "args": []
    }
  }
}
```

---

## Security Considerations

### Principle of Least Privilege

- Only expose necessary tools
- Use project-specific configs
- Avoid running as root

### Sensitive Data

```toml
# .pmat/config.toml
[security]
# Don't analyze these paths
sensitive_paths = [".env", "secrets/", "*.key", "*.pem"]

# Don't send to AI context
exclude_from_context = ["credentials.json", ".npmrc", ".pypirc"]
```

### Audit Logging

```toml
[logging]
# Log all MCP requests
audit_log = true
audit_log_path = "~/.pmat/audit.log"
```

---

## Performance Tuning

### Caching

```toml
[cache]
enabled = true
directory = "~/.cache/pmat"
ttl = 300  # 5 minutes
max_size = "500MB"
```

### Parallel Processing

```toml
[performance]
parallel_analysis = true
max_threads = 8
batch_size = 100
```

### Incremental Analysis

```toml
[incremental]
enabled = true
track_changes = true
baseline_file = ".pmat/baseline.json"
```

---

## Related Resources

- [PMAT GitHub](https://github.com/paiml/paiml-mcp-agent-toolkit)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
