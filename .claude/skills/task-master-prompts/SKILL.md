---
name: task-master-prompts
description: Comprehensive guide for AI-powered task management prompt engineering. Use when creating task breakdown prompts, parsing PRDs into tasks, expanding tasks into subtasks, analyzing task complexity, updating tasks with new context, generating research queries, or building prompt templates with Handlebars syntax. Covers JSON schema validation, variant selection, parameter types, template variables, conditional logic (if/each/json helpers), complexity scoring, research mode integration, and codebase analysis patterns. Essential for building LLM-driven project management and task automation systems.
---

# Task Master Prompts

## Purpose

This skill provides comprehensive guidance for building AI-powered task management systems using structured prompt templates. It covers the complete lifecycle of task management prompts: from parsing PRDs into actionable tasks, through complexity analysis, to task expansion and updates.

The prompt management system enables:
- **Centralized prompt storage** with JSON schema validation
- **Variant support** for different contexts (research mode, complexity levels)
- **Template variables** with Handlebars syntax for dynamic generation
- **Codebase analysis integration** for context-aware task generation

## When to Use This Skill

This skill activates when you:
- Design prompt templates for AI task management
- Parse Product Requirements Documents (PRDs) into tasks
- Break down tasks into subtasks (task expansion)
- Analyze task complexity for prioritization
- Update tasks with new context or requirements
- Build research-augmented task workflows
- Implement Handlebars template syntax in prompts
- Configure JSON schema validation for prompts
- Integrate codebase analysis with task generation

## Core Concepts

### Prompt Template Architecture

Each prompt template is a JSON file with structured components:

```json
{
  "id": "unique-identifier",
  "version": "1.0.0",
  "description": "What this prompt does",
  "metadata": { "author": "system", "tags": ["category"] },
  "parameters": { /* typed parameters with validation */ },
  "prompts": {
    "default": { "system": "...", "user": "..." },
    "variant-name": { "condition": "...", "system": "...", "user": "..." }
  }
}
```

### The Eight Core Prompts

| Prompt | Purpose | Key Parameters |
|--------|---------|----------------|
| **parse-prd** | Convert PRD to structured tasks | numTasks, prdContent, research |
| **add-task** | Generate new task from description | prompt, newTaskId, priority |
| **expand-task** | Break task into subtasks | subtaskCount, task, expansionPrompt |
| **update-task** | Modify single task | task, updatePrompt, appendMode |
| **update-tasks** | Bulk update multiple tasks | tasks, updatePrompt |
| **update-subtask** | Append info to subtask | parentTask, updatePrompt |
| **analyze-complexity** | Score task complexity 1-10 | tasks, threshold |
| **research** | Context-aware research queries | query, detailLevel |

### Parameter Types and Validation

```json
{
  "paramName": {
    "type": "string|number|boolean|array|object",
    "required": true,
    "default": "value",
    "enum": ["option1", "option2"],
    "pattern": "^[a-z]+$",
    "minimum": 1,
    "maximum": 100,
    "description": "Parameter description"
  }
}
```

### Template Variable Syntax (Handlebars)

**Basic substitution:**
```handlebars
Generate {{numTasks}} tasks starting from ID {{nextId}}
```

**Conditionals:**
```handlebars
{{#if useResearch}}Research best practices before...{{/if}}
{{#if (not useResearch)}}Use standard analysis...{{/if}}
```

**Equality comparison:**
```handlebars
{{#if (eq detailLevel "high")}}Provide exhaustive detail{{/if}}
{{#if (eq priority "critical")}}URGENT: {{/if}}
```

**Numeric comparison:**
```handlebars
{{#if (gt numTasks 0)}}exactly {{numTasks}}{{else}}an appropriate number of{{/if}}
{{#if (gte threshold 5)}}High complexity threshold{{/if}}
```

**Loops:**
```handlebars
{{#each tasks}}
- Task {{@index}}: {{title}}{{#unless @last}}\n{{/unless}}
{{/each}}
```

**JSON serialization (triple braces):**
```handlebars
Analyze these tasks: {{{json tasks}}}
```

## Quick Start

### Creating a Task Generation Prompt

1. **Define the JSON structure** with id, version, description
2. **Specify parameters** with types and validation rules
3. **Create system prompt** with role and output format
4. **Create user prompt** with context injection
5. **Add variants** for different modes (research, complexity)

### Essential Output Structures

**Task object:**
```json
{
  "id": "number",
  "title": "string",
  "description": "string",
  "status": "pending|in_progress|done",
  "dependencies": "number[]",
  "priority": "high|medium|low",
  "details": "string",
  "testStrategy": "string"
}
```

**Subtask object:**
```json
{
  "id": "number (sequential from nextSubtaskId)",
  "title": "string (5-200 chars)",
  "description": "string (min 10 chars)",
  "dependencies": "number[]",
  "details": "string (min 20 chars)",
  "status": "pending",
  "testStrategy": "string|null"
}
```

**Complexity analysis:**
```json
{
  "taskId": "number",
  "taskTitle": "string",
  "complexityScore": "1-10",
  "recommendedSubtasks": "number",
  "expansionPrompt": "string",
  "reasoning": "string"
}
```

## Variant Selection Strategy

Variants allow different prompts based on runtime conditions:

```json
{
  "prompts": {
    "default": { /* fallback */ },
    "research": {
      "condition": "useResearch === true",
      "system": "Research-focused prompt...",
      "user": "..."
    },
    "complexity-report": {
      "condition": "expansionPrompt",
      "system": "Use expansion guidance...",
      "user": "..."
    }
  }
}
```

**Selection order:**
1. Check named variants with matching conditions (highest priority)
2. Fall back to `default` variant
3. Conditions are JavaScript expressions evaluated with parameters

## Codebase Analysis Integration

Enable context-aware task generation with codebase analysis:

```json
{
  "hasCodebaseAnalysis": {
    "type": "boolean",
    "default": false,
    "description": "Whether codebase analysis is available"
  },
  "projectRoot": {
    "type": "string",
    "default": "",
    "description": "Project root path for context"
  }
}
```

**In user prompt:**
```handlebars
{{#if hasCodebaseAnalysis}}
## IMPORTANT: Codebase Analysis Required

You have access to powerful codebase analysis tools:
1. Use the Glob tool to explore project structure
2. Use the Grep tool to search existing implementations
3. Use the Read tool to examine key files

Project Root: {{projectRoot}}
{{/if}}
```

## Research Mode Pattern

Enable AI to research current best practices:

**System prompt addition:**
```handlebars
{{#if research}}
Before breaking down the PRD:
1. Research latest technologies and frameworks
2. Identify potential technical challenges
3. Consider industry standards (solving LLM training cutoff)
4. Evaluate alternative approaches
5. Include specific library versions
{{/if}}
```

**Benefits:**
- Overcomes LLM knowledge cutoff limitations
- Provides current library versions
- Includes industry best practices
- More accurate implementation guidance

## Navigation Guide

| Need to... | Read this resource |
|------------|-------------------|
| Understand template structure | [prompt-template-reference.md](resources/prompt-template-reference.md) |
| Parse PRDs into tasks | [prd-parsing-guide.md](resources/prd-parsing-guide.md) |
| Manage task CRUD operations | [task-management-guide.md](resources/task-management-guide.md) |
| Analyze task complexity | [complexity-analysis-guide.md](resources/complexity-analysis-guide.md) |
| See complete examples | [complete-examples.md](resources/complete-examples.md) |

## Key Principles

### From Production Experience

1. **Sequential IDs** - Always use `nextId`/`nextSubtaskId` for predictable numbering
2. **Preserve Completed Work** - Never modify subtasks marked as "done"
3. **Dependency Ordering** - Tasks can only depend on lower ID tasks
4. **Atomic Updates** - Each prompt should produce one specific output type
5. **Append vs Replace** - Support both full updates and append-only modes

### From Prompt Engineering Best Practices

1. **Explicit Output Format** - Define exact JSON structure expected
2. **Role Assignment** - System prompts establish AI expertise
3. **Context Injection** - User prompts provide dynamic data
4. **Guardrails** - Include validation rules in prompts
5. **Research Integration** - Optional mode for current information

## Common Anti-Patterns

**Avoid:**
- Mixing multiple output types in one prompt
- Hardcoding task IDs instead of using parameters
- Missing `default` variant in prompts
- Overcomplicated condition expressions
- Duplicating context across prompts

**Prefer:**
- Single-purpose prompts with clear outputs
- Parameterized IDs for sequential generation
- Always providing `default` fallback
- Simple boolean or equality conditions
- Shared context via `gatheredContext` parameter

## Schema Validation

All templates validate against JSON Schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "required": ["id", "version", "description", "prompts"],
  "properties": {
    "id": { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
    "description": { "type": "string", "minLength": 1 },
    "parameters": { "type": "object" },
    "prompts": {
      "properties": {
        "default": { "$ref": "#/definitions/promptVariant" }
      }
    }
  }
}
```

## Related Skills

- **prd** - PRD creation and specification
- **backend-dev-guidelines** - Task implementation patterns
- **c4-architecture** - System design for task breakdown

---

**Skill Status**: Complete comprehensive guide
**Line Count**: <500 lines (following 500-line rule)
**Progressive Disclosure**: 5 resource files for deep dives
**Coverage**: Full prompt template lifecycle from creation to usage
