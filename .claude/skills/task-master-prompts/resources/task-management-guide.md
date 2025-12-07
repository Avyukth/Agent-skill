# Task Management Guide

Complete guide for task CRUD operations: adding tasks, updating tasks, expanding tasks into subtasks, and managing subtask updates.

## Table of Contents

- [Adding Tasks](#adding-tasks)
- [Updating Single Tasks](#updating-single-tasks)
- [Bulk Task Updates](#bulk-task-updates)
- [Expanding Tasks into Subtasks](#expanding-tasks-into-subtasks)
- [Updating Subtasks](#updating-subtasks)
- [Preserving Completed Work](#preserving-completed-work)

---

## Adding Tasks

Create new tasks based on user descriptions with context awareness.

### Parameters

```json
{
  "prompt": {
    "type": "string",
    "required": true,
    "description": "User's task description"
  },
  "newTaskId": {
    "type": "number",
    "required": true,
    "description": "ID for the new task"
  },
  "existingTasks": {
    "type": "array",
    "description": "List of existing tasks for context"
  },
  "gatheredContext": {
    "type": "string",
    "description": "Context gathered from codebase analysis"
  },
  "priority": {
    "type": "string",
    "default": "medium",
    "enum": ["high", "medium", "low"]
  },
  "dependencies": {
    "type": "array",
    "description": "Task dependency IDs"
  },
  "useResearch": {
    "type": "boolean",
    "default": false
  }
}
```

### Output Structure

```json
{
  "title": "Task title goes here",
  "description": "A concise one or two sentence description",
  "details": "Detailed implementation steps, considerations, code examples",
  "testStrategy": "Specific steps to verify correct implementation",
  "dependencies": [1, 3]
}
```

**Important:** Output is a flat object, NOT wrapped in another property.

### Dependency Selection Guidelines

The system prompt provides these principles:

1. Select dependencies based on **logical requirements**
2. Prioritize **semantically related** tasks
3. Consider both **direct and indirect** dependencies
4. Avoid **unnecessary dependencies**
5. Prefer **completed tasks** as dependencies when possible
6. Consider **foundation tasks** (1-5) but don't auto-include
7. **Recent tasks** may be more relevant for newer functionality

### Example Usage

```javascript
const { systemPrompt, userPrompt } = promptManager.loadPrompt('add-task', {
  prompt: 'Add rate limiting to API endpoints',
  newTaskId: 15,
  existingTasks: existingTasksArray,
  gatheredContext: 'Express backend with existing middleware structure',
  priority: 'high',
  useResearch: true
});
```

---

## Updating Single Tasks

Modify existing tasks with new information, supporting full updates and append mode.

### Parameters

```json
{
  "task": {
    "type": "object",
    "required": true,
    "description": "The task to update"
  },
  "taskJson": {
    "type": "string",
    "required": true,
    "description": "JSON string representation of the task"
  },
  "updatePrompt": {
    "type": "string",
    "required": true,
    "description": "Description of changes to apply"
  },
  "appendMode": {
    "type": "boolean",
    "default": false,
    "description": "Whether to append to details or do full update"
  },
  "useResearch": {
    "type": "boolean",
    "default": false
  },
  "currentDetails": {
    "type": "string",
    "default": "(No existing details)",
    "description": "Current task details for context"
  }
}
```

### Variants

**Default Variant:** Full task update
- Returns complete updated task object
- Can modify description, details, testStrategy
- Preserves completed subtasks

**Append Variant:** Append-only mode
- Returns only new text to append
- Does not include original details
- Plain string output (not JSON)

### Update Guidelines

From the system prompt:

1. **NEVER change the title** - Keep exactly as is
2. **Maintain ID, status, dependencies** unless specifically mentioned
3. **Update description, details, testStrategy** to reflect new information
4. **Don't change anything unnecessarily**
5. **Preserve all "done"/"completed" subtasks**
6. **Build upon completed work** rather than rewriting
7. **Add new subtasks** if existing ones need changes (don't modify completed)
8. Use **numeric subtask IDs** (1, 2, 3) not strings ("1", "2", "3")
9. **Sequential IDs from 1** - Don't use parent task ID as prefix

### Output Structure (Default)

```json
{
  "task": {
    "id": 5,
    "title": "Original title preserved",
    "description": "Updated description",
    "status": "in_progress",
    "dependencies": [1, 2],
    "priority": "high",
    "details": "Updated implementation details...",
    "testStrategy": "Updated test strategy...",
    "subtasks": [
      {
        "id": 1,
        "title": "Subtask",
        "status": "done",
        "details": "Original - not modified"
      },
      {
        "id": 2,
        "title": "New subtask",
        "status": "pending",
        "details": "Added based on update"
      }
    ]
  }
}
```

### Output (Append Mode)

Plain string, no JSON wrapper:

```
Added rate limiting configuration using express-rate-limit@7.1.0.
Configuration stored in config/rate-limit.ts with per-endpoint customization.
```

---

## Bulk Task Updates

Update multiple tasks based on new context or global changes.

### Parameters

```json
{
  "tasks": {
    "type": "array",
    "required": true,
    "description": "Array of tasks to update"
  },
  "updatePrompt": {
    "type": "string",
    "required": true,
    "description": "Description of changes to apply"
  },
  "useResearch": {
    "type": "boolean",
    "default": false
  },
  "projectContext": {
    "type": "string",
    "description": "Additional project context"
  }
}
```

### Guidelines

From the system prompt:

1. **Return ALL tasks** in order, not just modified ones
2. **Maintain IDs, statuses, dependencies** unless specifically mentioned
3. **Apply changes thoughtfully** - only what's needed
4. **Preserve completed subtasks** exactly as is
5. **Build on completed work** rather than rewriting
6. **Add new subtasks** for changes to completed work

### Output Structure

```json
{
  "tasks": [
    { "id": 1, "title": "...", "status": "done", /* unchanged */ },
    { "id": 2, "title": "...", "status": "pending", /* updated */ },
    { "id": 3, "title": "...", "status": "pending", /* updated */ }
  ]
}
```

### Use Cases

- **Technology migration**: "Switch from MongoDB to PostgreSQL"
- **Pattern updates**: "Apply new error handling pattern to all services"
- **Scope changes**: "Add authentication requirement to all API tasks"
- **Priority adjustments**: "Increase priority of security-related tasks"

---

## Expanding Tasks into Subtasks

Break down high-level tasks into specific, actionable subtasks.

### Parameters

```json
{
  "subtaskCount": {
    "type": "number",
    "required": true,
    "description": "Number of subtasks to generate"
  },
  "task": {
    "type": "object",
    "required": true,
    "description": "The task to expand"
  },
  "nextSubtaskId": {
    "type": "number",
    "required": true,
    "description": "Starting ID for new subtasks"
  },
  "useResearch": {
    "type": "boolean",
    "default": false
  },
  "expansionPrompt": {
    "type": "string",
    "required": false,
    "description": "Expansion prompt from complexity report"
  },
  "additionalContext": {
    "type": "string",
    "default": ""
  },
  "complexityReasoningContext": {
    "type": "string",
    "default": ""
  }
}
```

### Three Expansion Strategies

**1. Complexity-Report Variant** (highest priority)
- Condition: `expansionPrompt` exists
- Uses guidance from complexity analysis
- Most targeted expansion

**2. Research Variant**
- Condition: `useResearch === true && !expansionPrompt`
- Researches best practices before expansion
- More detailed recommendations

**3. Default Variant**
- Standard task breakdown
- Uses task details and context

### Subtask Output Structure

```json
{
  "subtasks": [
    {
      "id": 1,
      "title": "Set up authentication middleware",
      "description": "Create Express middleware for JWT validation",
      "dependencies": [],
      "details": "Implement using jose library for JWT verification...",
      "status": "pending",
      "testStrategy": "Unit tests for valid/invalid tokens"
    }
  ]
}
```

### Critical ID Rules

The prompts emphasize:

```
CRITICAL: Use sequential IDs starting from {{nextSubtaskId}}.
First subtask id={{nextSubtaskId}}, second id={{nextSubtaskId}}+1, etc.
Do NOT use parent task ID in subtask numbering!
```

### Subtask Field Requirements

| Field | Type | Constraints |
|-------|------|-------------|
| id | number | Sequential from nextSubtaskId |
| title | string | 5-200 characters |
| description | string | Minimum 10 characters |
| dependencies | number[] | Can be empty [] |
| details | string | Minimum 20 characters |
| status | string | Always "pending" |
| testStrategy | string/null | Testing approach |

---

## Updating Subtasks

Append information to subtasks (logging progress, adding findings).

### Parameters

```json
{
  "parentTask": {
    "type": "object",
    "required": true,
    "description": "The parent task context"
  },
  "prevSubtask": {
    "type": "object",
    "required": false,
    "description": "The previous subtask if any"
  },
  "nextSubtask": {
    "type": "object",
    "required": false,
    "description": "The next subtask if any"
  },
  "currentDetails": {
    "type": "string",
    "required": true,
    "default": "(No existing details)"
  },
  "updatePrompt": {
    "type": "string",
    "required": true,
    "description": "User request for what to add"
  }
}
```

### Output Format

**Plain string only** - no JSON wrapper:

```
Implemented rate limiting with the following configuration:
- Global limit: 100 requests per minute
- Auth endpoints: 10 requests per minute
- API key endpoints: 1000 requests per minute

Tested with artillery.io load testing suite.
```

### Guidelines

From system prompt:

1. **Return only new content** - Don't repeat existing details
2. **No timestamps, tags, or formatting** in output
3. **Concise yet complete** - Focus on substance
4. **No conversational fillers** - Don't start with "Here's the update..."
5. **Context-aware** - Consider parent and sibling subtasks

---

## Preserving Completed Work

Critical pattern across all update operations.

### Rules

1. **Never modify "done"/"completed" subtasks**
2. **Build upon completed work** - Reference and extend
3. **Add new subtasks** instead of changing completed ones
4. **Unique IDs** - Don't conflict with existing subtask IDs
5. **Document changes** - If something needs to be undone, add a new subtask that explains what to change

### Example Scenario

Original task with completed subtask:

```json
{
  "id": 5,
  "subtasks": [
    { "id": 1, "title": "Set up database", "status": "done" },
    { "id": 2, "title": "Create API endpoints", "status": "pending" }
  ]
}
```

Update prompt: "Switch from SQL to NoSQL"

Correct approach:

```json
{
  "id": 5,
  "subtasks": [
    { "id": 1, "title": "Set up database", "status": "done" }, // Preserved!
    { "id": 2, "title": "Create API endpoints", "status": "pending" },
    { "id": 3, "title": "Migrate database to MongoDB", "status": "pending",
      "details": "Replace SQLite setup from subtask 1 with MongoDB..." }
  ]
}
```

---

**Related Resources:**
- [SKILL.md](../SKILL.md) - Main skill guide
- [complexity-analysis-guide.md](complexity-analysis-guide.md) - Complexity scoring
- [complete-examples.md](complete-examples.md) - Full examples
