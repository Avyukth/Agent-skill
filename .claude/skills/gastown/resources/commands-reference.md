# Gas Town Commands Reference

Complete CLI reference for `gt` and related `bd` commands.

## Town Management

### gt install

Create a new Gas Town workspace.

```bash
gt install [path]            # Create town at path (default: ./gt)
gt install ~/gt --git        # Initialize with git
```

### gt start / gt shutdown

Control Gas Town services.

```bash
gt start                     # Start daemon + agents
gt start --no-mayor          # Start without Mayor session
gt shutdown                  # Graceful shutdown
gt shutdown --force          # Force kill all
```

### gt prime

Enter the Mayor session (primary interface).

```bash
gt prime                     # Enter Mayor tmux session
```

### gt status

Show town overview.

```bash
gt status                    # Town status summary
gt status --json             # JSON output
```

### gt doctor

Health check and auto-repair.

```bash
gt doctor                    # Run all checks
gt doctor --fix              # Auto-repair issues
gt doctor --verbose          # Detailed output
```

### gt version

Show version information.

```bash
gt version
```

## Rig Management

### gt rig add

Add a project to the town.

```bash
gt rig add <name> <git-url>
gt rig add webapp https://github.com/me/webapp.git
gt rig add myapp git@github.com:me/myapp.git
```

### gt rig list

List all rigs.

```bash
gt rig list                  # List rigs
gt rig list --json           # JSON output
```

### gt rig remove

Remove a rig.

```bash
gt rig remove <name>
gt rig remove webapp
```

## Convoy Management

Convoys track batched work across rigs.

### gt convoy create

Create a convoy to track issues.

```bash
gt convoy create "name" <issues...>
gt convoy create "Feature X" gt-abc gt-def
gt convoy create "name" gt-abc --notify         # Notify on landing
gt convoy create "name" gt-abc --notify --human # Notify overseer
```

### gt convoy list

Dashboard of convoys.

```bash
gt convoy list                    # Active convoys
gt convoy list --all              # Include landed
gt convoy list --status=closed    # Only landed
gt convoy list --json             # JSON output
```

### gt convoy status

Show convoy progress.

```bash
gt convoy status                  # Current convoy (if any)
gt convoy status <convoy-id>      # Specific convoy
gt convoy status hq-cv-abc        # By ID
```

### gt convoy add

Add issues to existing convoy.

```bash
gt convoy add <convoy-id> <issues...>
gt convoy add hq-cv-abc gt-xyz
```

### gt convoy check

Check convoy status.

```bash
gt convoy check <convoy-id>       # Detailed check
gt convoy check --stranded        # Find stranded convoys
```

## Work Assignment

### gt sling

Assign work to agents (the unified dispatch command).

```bash
gt sling <bead> <rig>                      # Basic sling
gt sling gt-abc myproject                  # Spawns polecat
gt sling gt-abc myproject --molecule=<proto>  # With workflow
gt sling gt-abc crew                       # To crew member
gt sling formula-name mayor/               # Formula to Mayor
```

### gt hook

Check what's on your hook.

```bash
gt hook                      # What's on MY hook
```

### gt done

Signal work completion.

```bash
gt done                      # Complete current work
gt done <bead>               # Complete specific bead
```

### gt unsling

Remove work from hook.

```bash
gt unsling <bead>            # Remove from hook
```

## Communication

### gt mail inbox

Check mailbox.

```bash
gt mail inbox                # List messages
gt mail inbox --unread       # Only unread
```

### gt mail read

Read a message.

```bash
gt mail read <id>            # Read message
gt mail read --last          # Read most recent
```

### gt mail send

Send a message.

```bash
gt mail send <addr> -s "Subject" -m "Body"
gt mail send mayor/ -s "Status update" -m "Work complete"
gt mail send --human -s "Need help" -m "Stuck on issue"
```

### gt broadcast

Send to multiple recipients.

```bash
gt broadcast -s "Alert" -m "System update"
```

### gt notify

Send notification.

```bash
gt notify <addr> "Message"
gt notify --human "Deployment complete"
```

## Agent Lifecycle

### gt agents

Navigate between agent sessions.

```bash
gt agents                    # List/select agents (interactive)
gt agents --list             # List only
gt agents --json             # JSON output
```

### gt handoff

Request session cycle.

```bash
gt handoff                   # Request cycle (context-aware)
gt handoff --shutdown        # Terminate (for polecats)
gt handoff --reason "Context full"
```

### gt peek

Check agent health.

```bash
gt peek <agent>              # Check status
gt peek myproject/polecats/Toast
gt peek witness              # Peek at rig witness
```

### gt nudge

Send message to agent.

```bash
gt nudge <agent> "message"
gt nudge myproject/polecats/Toast "Check issue gt-xyz"
```

### gt <role> attach

Jump into agent session.

```bash
gt mayor attach              # Attach to Mayor
gt witness attach            # Attach to Witness
gt refinery attach           # Attach to Refinery
```

### gt session stop

Stop a specific session.

```bash
gt session stop <rig>/<agent>
gt session stop myproject/polecats/Toast
```

### gt escalate

Escalate an issue.

```bash
gt escalate "topic"              # Default: MEDIUM
gt escalate -s CRITICAL "msg"    # Urgent
gt escalate -s HIGH "msg"        # Important
gt escalate -m "Details..."      # With body
```

### gt seance

Discover predecessor sessions.

```bash
gt seance                        # List discoverable sessions
gt seance --talk <id>            # Talk to predecessor
gt seance --talk <id> -p "Where is X?"  # One-shot question
```

## Molecule Operations (gt)

### gt mol current

What molecule should I work on.

```bash
gt mol current               # Current molecule step
```

### gt mol progress

Show molecule execution progress.

```bash
gt mol progress <id>         # Progress of molecule
```

### gt mol attach / detach

Manage molecule attachment.

```bash
gt mol attach <bead> <mol>   # Pin molecule to bead
gt mol detach <bead>         # Unpin molecule
gt mol attach-from-mail <id> # Attach from mail
```

### gt mol burn / squash

Complete molecule lifecycle.

```bash
gt mol burn                  # Burn attached molecule
gt mol squash                # Squash to digest
gt mol step done <step>      # Complete a step
```

## Polecat Management

### gt polecat

Manage polecats.

```bash
gt polecat list              # List polecats
gt polecat spawn <rig>       # Spawn new polecat
gt polecat kill <name>       # Kill polecat
```

## Crew Management

### gt crew

Manage crew workers.

```bash
gt crew list                 # List crew members
gt crew add <rig> <name>     # Add crew member
gt crew remove <rig> <name>  # Remove crew member
gt crew cycle <rig> <name>   # Cycle crew session
```

## Emergency Commands

### gt stop

Emergency stop.

```bash
gt stop --all                # Kill all sessions
gt stop --rig <name>         # Kill rig sessions
```

## Beads Commands (bd)

### Work Discovery

```bash
bd ready                     # Work with no blockers
bd ready --json              # JSON output
bd list                      # All issues
bd list --status=open        # Open issues
bd list --status=in_progress # Active work
```

### Issue Operations

```bash
bd show <id>                 # Show issue details
bd create --title="..." --type=task
bd create --title="..." --type=bug --priority=1
bd update <id> --status=in_progress
bd update <id> --assignee=joe
bd close <id>                # Close single issue
bd close <id1> <id2> ...     # Close multiple
bd close <id> --reason="Done"
```

### Dependencies

```bash
bd dep add <child> <parent>  # child depends on parent
bd blocked                   # Show blocked issues
```

### Formulas and Molecules

```bash
bd formula list              # Available formulas
bd formula show <name>       # Formula details
bd cook <formula>            # Formula → Protomolecule
bd mol list                  # Available protos
bd mol show <id>             # Proto details
bd mol pour <proto>          # Create persistent mol
bd mol wisp <proto>          # Create ephemeral wisp
bd mol bond <proto> <parent> # Attach to parent
bd mol squash <id>           # Condense to digest
bd mol burn <id>             # Discard wisp
```

### Sync

```bash
bd sync                      # Push/pull changes
bd sync --status             # Check sync status
```

### Statistics

```bash
bd stats                     # Project statistics
```
