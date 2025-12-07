# Prompt Template Reference

Complete technical reference for Task Master prompt template structure, validation, and usage patterns.

## Table of Contents

- [Template Structure](#template-structure)
- [Parameter Types](#parameter-types)
- [Handlebars Template Syntax](#handlebars-template-syntax)
- [Variant System](#variant-system)
- [Schema Validation](#schema-validation)
- [PromptManager API](#promptmanager-api)

---

## Template Structure

### Required Fields

Every prompt template must include:

```json
{
  "id": "kebab-case-identifier",
  "version": "1.0.0",
  "description": "Clear description of prompt purpose",
  "prompts": {
    "default": {
      "system": "System prompt content",
      "user": "User prompt content"
    }
  }
}
```

### Optional Fields

```json
{
  "metadata": {
    "author": "system",
    "created": "2024-01-01T00:00:00Z",
    "updated": "2024-01-01T00:00:00Z",
    "tags": ["task", "parsing", "initialization"],
    "category": "task|analysis|research|parsing|update|expansion"
  },
  "parameters": {
    /* parameter definitions */
  }
}
```

### Complete Template Example

```json
{
  "id": "my-prompt",
  "version": "1.0.0",
  "description": "Generate structured output from input",
  "metadata": {
    "author": "system",
    "created": "2024-01-01T00:00:00Z",
    "updated": "2024-01-01T00:00:00Z",
    "tags": ["generation", "structured-output"]
  },
  "parameters": {
    "inputData": {
      "type": "string",
      "required": true,
      "description": "The input to process"
    },
    "outputFormat": {
      "type": "string",
      "required": false,
      "default": "json",
      "enum": ["json", "markdown", "plain"],
      "description": "Desired output format"
    },
    "verbose": {
      "type": "boolean",
      "default": false,
      "description": "Enable verbose output"
    }
  },
  "prompts": {
    "default": {
      "system": "You are a helpful assistant that processes input data.",
      "user": "Process the following input:\n\n{{inputData}}\n\nOutput format: {{outputFormat}}"
    }
  }
}
```

---

## Parameter Types

### String Parameters

```json
{
  "paramName": {
    "type": "string",
    "required": true,
    "default": "default value",
    "description": "Parameter description",
    "enum": ["option1", "option2", "option3"],
    "pattern": "^[a-zA-Z][a-zA-Z0-9-]*$"
  }
}
```

**Validation options:**
- `enum`: Restrict to specific values
- `pattern`: Regex validation
- `minLength`/`maxLength`: Length constraints

### Number Parameters

```json
{
  "threshold": {
    "type": "number",
    "required": false,
    "default": 5,
    "minimum": 1,
    "maximum": 10,
    "description": "Complexity threshold (1-10)"
  }
}
```

**Validation options:**
- `minimum`/`maximum`: Value range
- `exclusiveMinimum`/`exclusiveMaximum`: Exclusive bounds

### Boolean Parameters

```json
{
  "useResearch": {
    "type": "boolean",
    "default": false,
    "description": "Enable research mode for latest best practices"
  }
}
```

### Array Parameters

```json
{
  "tasks": {
    "type": "array",
    "required": true,
    "description": "Array of task objects to process"
  },
  "dependencies": {
    "type": "array",
    "default": [],
    "description": "Task dependency IDs"
  }
}
```

### Object Parameters

```json
{
  "task": {
    "type": "object",
    "required": true,
    "description": "The task object to expand"
  },
  "projectInfo": {
    "type": "object",
    "description": "Project information",
    "properties": {
      "root": { "type": "string" },
      "taskCount": { "type": "number" },
      "fileCount": { "type": "number" }
    }
  }
}
```

---

## Handlebars Template Syntax

### Basic Variable Substitution

```handlebars
Hello {{name}}, you have {{count}} tasks.
```

**Nested properties:**
```handlebars
Task: {{task.title}} (ID: {{task.id}})
Project root: {{projectInfo.root}}
```

### Conditional Blocks

**Simple if:**
```handlebars
{{#if useResearch}}
Research current best practices before proceeding.
{{/if}}
```

**If-else:**
```handlebars
{{#if verbose}}
Provide detailed explanations for each step.
{{else}}
Be concise and direct.
{{/if}}
```

**Unless (negation):**
```handlebars
{{#unless skipValidation}}
Validate all inputs before processing.
{{/unless}}
```

### Helper Functions

#### Equality Helper (eq)

```handlebars
{{#if (eq detailLevel "low")}}
Provide brief, focused answers.
{{/if}}

{{#if (eq priority "critical")}}
URGENT: This requires immediate attention.
{{/if}}

{{#if (eq status "pending")}}
Task not yet started.
{{/if}}
```

#### Negation Helper (not)

```handlebars
{{#if (not useResearch)}}
Use standard analysis without research.
{{/if}}

{{#if (not hasSubtasks)}}
This task has no subtasks yet.
{{/if}}
```

#### Greater Than Helper (gt)

```handlebars
{{#if (gt numTasks 0)}}
Generate exactly {{numTasks}} tasks.
{{else}}
Generate an appropriate number of tasks.
{{/if}}

{{#if (gt complexity 5)}}
This is a complex task requiring detailed breakdown.
{{/if}}
```

#### Greater Than or Equal Helper (gte)

```handlebars
{{#if (gte threshold 8)}}
High complexity threshold - use detailed analysis.
{{/if}}

{{#if (gte priority 1)}}
Priority is set.
{{/if}}
```

### Loop Iteration

**Basic each:**
```handlebars
{{#each tasks}}
- Task {{id}}: {{title}}
{{/each}}
```

**With index and special variables:**
```handlebars
{{#each tasks}}
{{@index}}. {{title}}{{#unless @last}}, {{/unless}}
{{/each}}
```

**Special loop variables:**
- `{{@index}}`: Current 0-based index
- `{{@first}}`: True for first item
- `{{@last}}`: True for last item

### JSON Serialization

Use triple braces for raw JSON output:

```handlebars
Analyze these tasks: {{{json tasks}}}

Current task: {{{json task}}}
```

**Important:** Triple braces prevent HTML escaping, required for valid JSON.

### Combining Patterns

```handlebars
{{#if hasCodebaseAnalysis}}
## Codebase Analysis Required

Use the following tools:
1. Glob for file patterns
2. Grep for content search
3. Read for file examination

Project Root: {{projectRoot}}
{{/if}}

{{#if (gt numTasks 0)}}
Generate exactly {{numTasks}} tasks.
{{else}}
Generate an appropriate number of tasks.
{{/if}}

Tasks to analyze:
{{#each tasks}}
- [{{@index}}] {{title}} (Priority: {{priority}})
{{/each}}
```

---

## Variant System

### Basic Variant Structure

```json
{
  "prompts": {
    "default": {
      "system": "Default system prompt",
      "user": "Default user prompt"
    },
    "research": {
      "condition": "useResearch === true",
      "system": "Research-focused system prompt",
      "user": "Research-focused user prompt"
    }
  }
}
```

### Condition Expressions

Conditions are JavaScript expressions evaluated with parameters:

**Boolean conditions:**
```json
"condition": "useResearch === true"
"condition": "appendMode === true"
"condition": "useResearch && !expansionPrompt"
```

**Numeric conditions:**
```json
"condition": "threshold >= 5"
"condition": "numTasks > 0"
"condition": "complexityScore >= 8"
```

**String conditions:**
```json
"condition": "priority === 'high'"
"condition": "detailLevel === 'low'"
```

**Existence checks:**
```json
"condition": "expansionPrompt"
"condition": "gatheredContext"
```

### Variant Selection Order

1. Named variants checked in definition order
2. First matching condition wins
3. `default` used if no conditions match

### Real-World Variant Example

```json
{
  "prompts": {
    "complexity-report": {
      "condition": "expansionPrompt",
      "system": "Use the expansion prompt from complexity report...",
      "user": "{{expansionPrompt}}\n\nGenerate subtasks..."
    },
    "research": {
      "condition": "useResearch === true && !expansionPrompt",
      "system": "Research current best practices...",
      "user": "Research and analyze the task..."
    },
    "default": {
      "system": "Standard task expansion...",
      "user": "Break down this task..."
    }
  }
}
```

### Variant Metadata

Optional metadata for documentation:

```json
{
  "research": {
    "condition": "useResearch === true",
    "system": "...",
    "user": "...",
    "metadata": {
      "description": "Used when research mode is enabled for latest best practices"
    }
  }
}
```

---

## Schema Validation

### Main Template Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Task Master Prompt Template",
  "type": "object",
  "required": ["id", "version", "description", "prompts"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$",
      "description": "Unique kebab-case identifier"
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "description": "Semantic version (X.Y.Z)"
    },
    "description": {
      "type": "string",
      "minLength": 1
    },
    "metadata": { "$ref": "#/definitions/metadata" },
    "parameters": {
      "type": "object",
      "additionalProperties": { "$ref": "#/definitions/parameter" }
    },
    "prompts": {
      "type": "object",
      "properties": {
        "default": { "$ref": "#/definitions/promptVariant" }
      },
      "additionalProperties": { "$ref": "#/definitions/conditionalPromptVariant" }
    }
  }
}
```

### Parameter Schema

```json
{
  "parameter": {
    "type": "object",
    "required": ["type", "description"],
    "properties": {
      "type": {
        "type": "string",
        "enum": ["string", "number", "boolean", "array", "object"]
      },
      "description": { "type": "string", "minLength": 1 },
      "required": { "type": "boolean", "default": false },
      "default": { "description": "Default value" },
      "enum": { "type": "array" },
      "pattern": { "type": "string" },
      "minimum": { "type": "number" },
      "maximum": { "type": "number" }
    }
  }
}
```

### Prompt Variant Schema

```json
{
  "promptVariant": {
    "type": "object",
    "required": ["system", "user"],
    "properties": {
      "system": { "type": "string", "minLength": 1 },
      "user": { "type": "string", "minLength": 1 }
    }
  },
  "conditionalPromptVariant": {
    "allOf": [
      { "$ref": "#/definitions/promptVariant" },
      {
        "properties": {
          "condition": {
            "type": "string",
            "description": "JavaScript expression for variant selection"
          }
        }
      }
    ]
  }
}
```

---

## PromptManager API

### Loading Prompts

```javascript
import { getPromptManager } from '../prompt-manager.js';

const promptManager = getPromptManager();

// Load with parameters
const { systemPrompt, userPrompt, metadata } = promptManager.loadPrompt('add-task', {
  prompt: 'Create a user authentication system',
  newTaskId: 5,
  priority: 'high',
  useResearch: false
});
```

### Variant Selection

```javascript
// Research variant selected automatically
const result = promptManager.loadPrompt('expand-task', {
  useResearch: true,  // Triggers research variant
  task: taskObject,
  subtaskCount: 5
});

// Complexity-report variant when expansionPrompt exists
const result = promptManager.loadPrompt('expand-task', {
  expansionPrompt: "Focus on authentication flow...",
  task: taskObject,
  subtaskCount: 5
});
```

### Validation

```javascript
// Validate all templates
const results = promptManager.validateAllPrompts();
console.log(`Valid: ${results.valid.length}`);
console.log(`Errors: ${results.errors.length}`);

// Individual validation happens on load
try {
  const result = promptManager.loadPrompt('invalid-template', {});
} catch (error) {
  if (error.message.includes('Schema validation failed')) {
    console.error('Template validation error:', error.message);
  }
}
```

### Return Value Structure

```typescript
interface LoadPromptResult {
  systemPrompt: string;  // Rendered system prompt
  userPrompt: string;    // Rendered user prompt
  metadata: {
    templateId: string;
    version: string;
    variant: string;     // Which variant was selected
    parameters: object;  // Parameters used
  };
}
```

---

## Best Practices

### Template Design

1. **Clear IDs**: Use descriptive kebab-case (`parse-prd`, `expand-task`)
2. **Semantic Versioning**: Follow semver for version management
3. **Comprehensive Parameters**: Define all required and optional params
4. **Type Safety**: Use proper types and validation constraints
5. **Clear Descriptions**: Document what each prompt and param does

### Variable Usage

1. **Meaningful Names**: Use descriptive variable names
2. **Consistent Patterns**: Follow established naming conventions
3. **Safe Defaults**: Provide sensible default values
4. **Validation**: Use patterns, enums, and ranges

### Variant Strategy

1. **Simple Conditions**: Keep expressions easy to understand
2. **Clear Purpose**: Each variant should have distinct use case
3. **Fallback Logic**: Always provide default variant
4. **Priority Order**: Put most specific conditions first

---

**Related Resources:**
- [SKILL.md](../SKILL.md) - Main skill guide
- [complete-examples.md](complete-examples.md) - Full working examples
