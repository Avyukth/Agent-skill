# PRD Parsing Guide

Complete guide for parsing Product Requirements Documents (PRDs) into structured, actionable development tasks using AI-powered prompts.

## Table of Contents

- [Overview](#overview)
- [The parse-prd Prompt](#the-parse-prd-prompt)
- [Task Generation Guidelines](#task-generation-guidelines)
- [Research Mode Integration](#research-mode-integration)
- [Codebase Analysis](#codebase-analysis)
- [Output Structure](#output-structure)
- [Best Practices](#best-practices)

---

## Overview

PRD parsing transforms unstructured product requirements into a structured list of development tasks. The process:

1. **Analyzes** the PRD content for requirements
2. **Generates** logical, dependency-aware tasks
3. **Assigns** priorities and test strategies
4. **Optionally researches** current best practices

### Key Principles

- **Preserve PRD requirements** - Never discard explicit specifications
- **Fill gaps** - Infer missing implementation details
- **Logical ordering** - Dependencies flow from lower to higher IDs
- **Atomic tasks** - Each task represents one unit of work

---

## The parse-prd Prompt

### Core Parameters

```json
{
  "numTasks": {
    "type": "number",
    "required": true,
    "description": "Target number of tasks to generate"
  },
  "nextId": {
    "type": "number",
    "required": true,
    "description": "Starting ID for tasks"
  },
  "prdContent": {
    "type": "string",
    "required": true,
    "description": "Content of the PRD file"
  },
  "prdPath": {
    "type": "string",
    "required": true,
    "description": "Path to the PRD file"
  },
  "defaultTaskPriority": {
    "type": "string",
    "default": "medium",
    "enum": ["high", "medium", "low"],
    "description": "Default priority for generated tasks"
  },
  "research": {
    "type": "boolean",
    "default": false,
    "description": "Enable research mode for latest best practices"
  }
}
```

### System Prompt Structure

The system prompt establishes the AI as a PRD analysis specialist:

```handlebars
You are an AI assistant specialized in analyzing Product Requirements Documents
(PRDs) and generating a structured, logically ordered, dependency-aware and
sequenced list of development tasks in JSON format.

{{#if research}}
Before breaking down the PRD into tasks, you will:
1. Research and analyze the latest technologies, libraries, frameworks
2. Identify potential technical challenges, security concerns
3. Consider current industry standards and evolving trends
4. Evaluate alternative implementation approaches
5. Include specific library versions and implementation guidance
6. Always aim for the most direct path to implementation
{{/if}}

Analyze the provided PRD content and generate
{{#if (gt numTasks 0)}}approximately {{numTasks}}{{else}}an appropriate number of{{/if}}
top-level development tasks.
```

### User Prompt Structure

```handlebars
{{#if hasCodebaseAnalysis}}
## IMPORTANT: Codebase Analysis Required

Before generating tasks:
1. Use the Glob tool to explore the project structure
2. Use the Grep tool to search for existing implementations
3. Use the Read tool to examine key files

Project Root: {{projectRoot}}
{{/if}}

Here's the Product Requirements Document (PRD) to break down into
{{#if (gt numTasks 0)}}approximately {{numTasks}}{{else}}an appropriate number of{{/if}}
tasks, starting IDs from {{nextId}}:

{{prdContent}}

IMPORTANT: Your response must be a JSON object with a "tasks" property
containing an array of task objects.
```

---

## Task Generation Guidelines

### Task Structure

Each generated task must include:

```json
{
  "id": 1,
  "title": "Set up project infrastructure",
  "description": "Initialize the project with required tooling and structure",
  "status": "pending",
  "dependencies": [],
  "priority": "high",
  "details": "1. Initialize npm project\n2. Configure TypeScript\n3. Set up linting...",
  "testStrategy": "Verify project builds successfully and linting passes"
}
```

### Ordering Principles

1. **Setup tasks first** (IDs 1-3)
   - Project initialization
   - Core dependencies
   - Configuration

2. **Core functionality next** (IDs 4-8)
   - Main features from PRD
   - Database schemas
   - API endpoints

3. **Advanced features later** (IDs 9+)
   - Secondary features
   - Optimizations
   - Polish

### Dependency Rules

- Tasks can ONLY depend on lower ID tasks
- Dependency array contains task IDs: `[1, 3]`
- Empty array `[]` means no dependencies
- Avoid circular dependencies

### Priority Assignment

| Priority | Criteria |
|----------|----------|
| `high` | Core functionality, blocking dependencies |
| `medium` | Important features, non-blocking |
| `low` | Nice-to-have, optimizations |

---

## Research Mode Integration

When `research: true`, the AI researches current best practices before task generation.

### Benefits

1. **Overcomes training cutoff** - Gets current library versions
2. **Industry standards** - Follows 2024+ best practices
3. **Security awareness** - Identifies potential vulnerabilities
4. **Better recommendations** - Specific, actionable guidance

### Research Guidelines (Added to System Prompt)

```
Before breaking down the PRD into tasks, you will:
1. Research and analyze the latest technologies, libraries, frameworks,
   and best practices appropriate for this project
2. Identify potential technical challenges, security concerns, or
   scalability issues not explicitly mentioned
3. Consider current industry standards and evolving trends relevant
   to this project
4. Evaluate alternative implementation approaches and recommend
   the most efficient path
5. Include specific library versions, helpful APIs, and concrete
   implementation guidance based on your research
6. Always aim to provide the most direct path to implementation
```

### Research Mode Task Details

When research is enabled, task details should include:

```json
{
  "details": "## Implementation\n\n1. Install dependencies:\n   - express@4.18.2\n   - zod@3.22.4\n   - prisma@5.7.0\n\n2. Configure with current best practices:\n   - Use ESM modules\n   - Enable strict TypeScript\n   - Configure proper error boundaries\n\n## Security Considerations\n- Implement rate limiting\n- Use helmet for security headers\n- Validate all inputs with Zod"
}
```

---

## Codebase Analysis

Enable with `hasCodebaseAnalysis: true` for context-aware task generation.

### When to Use

- Existing project with established patterns
- Brownfield development
- Feature additions to existing codebase

### Analysis Instructions

```handlebars
{{#if hasCodebaseAnalysis}}
## IMPORTANT: Codebase Analysis Required

You have access to powerful codebase analysis tools. Before generating tasks:

1. Use the Glob tool to explore the project structure
   (e.g., "**/*.js", "**/*.json", "**/README.md")
2. Use the Grep tool to search for existing implementations, patterns,
   and technologies
3. Use the Read tool to examine key files like package.json, README.md,
   and main entry points
4. Analyze the current state of implementation to understand what exists

Based on your analysis:
- Identify what components/features are already implemented
- Understand the technology stack, frameworks, and patterns in use
- Generate tasks that build upon the existing codebase
- Ensure tasks align with the project's current architecture

Project Root: {{projectRoot}}
{{/if}}
```

### Benefits

- Avoids duplicating existing functionality
- Follows established patterns
- More accurate dependencies
- Better integration with existing code

---

## Output Structure

### Expected Response Format

```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Initialize project structure",
      "description": "Set up the foundational project structure with required tooling",
      "status": "pending",
      "dependencies": [],
      "priority": "high",
      "details": "...",
      "testStrategy": "..."
    }
  ],
  "metadata": {
    "prdPath": "/path/to/prd.md",
    "generatedAt": "2024-01-01T00:00:00Z",
    "taskCount": 10,
    "researchUsed": true
  }
}
```

### Field Requirements

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| id | number | Yes | Sequential from nextId |
| title | string | Yes | Descriptive, concise |
| description | string | Yes | 1-2 sentences |
| status | string | Yes | Always "pending" |
| dependencies | number[] | Yes | Valid task IDs |
| priority | string | Yes | high/medium/low |
| details | string | Yes | Implementation guidance |
| testStrategy | string | Yes | Validation approach |

---

## Best Practices

### PRD Requirements Preservation

```
CRITICAL: If the PRD contains specific requirements for libraries,
database schemas, frameworks, tech stacks, or any other implementation
details, STRICTLY ADHERE to these requirements and do not discard them.
```

### Gap Filling

Focus on filling gaps the PRD leaves unspecified:
- Error handling approaches
- Testing strategies
- Performance considerations
- Security measures

### Complexity Scaling

```handlebars
{{#if (gt numTasks 0)}}
Unless complexity warrants otherwise, create exactly {{numTasks}} tasks.
{{else}}
Create an appropriate number of tasks based on PRD complexity.
{{/if}}
```

### Task Details Quality

Good details include:
- Step-by-step implementation guidance
- Specific file paths or locations
- Code patterns to follow
- Library/framework specifics
- Edge cases to handle

### Test Strategy Quality

Good test strategies include:
- Specific test types (unit, integration, e2e)
- Key scenarios to verify
- Expected behaviors
- Edge cases to test

---

## Example: Complete PRD Parse

### Input

```javascript
const result = promptManager.loadPrompt('parse-prd', {
  numTasks: 10,
  nextId: 1,
  prdContent: `
# User Authentication System

## Overview
Build a secure user authentication system with JWT tokens.

## Requirements
- User registration with email verification
- Login with email/password
- Password reset functionality
- JWT-based session management
- Role-based access control (admin, user)

## Technical Requirements
- Use bcrypt for password hashing
- PostgreSQL database
- Express.js backend
`,
  prdPath: '/docs/auth-prd.md',
  defaultTaskPriority: 'medium',
  research: true,
  hasCodebaseAnalysis: true,
  projectRoot: '/Users/dev/myproject'
});
```

### Expected Output (Simplified)

```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Set up database schema for authentication",
      "description": "Create PostgreSQL schema with users, roles, and sessions tables",
      "status": "pending",
      "dependencies": [],
      "priority": "high",
      "details": "Create Prisma schema with:\n- User model (id, email, password, verified)\n- Role model (id, name)\n- Session model for JWT tracking\n\nUse bcrypt@5.1.1 for password hashing.",
      "testStrategy": "Verify migrations run successfully. Test unique constraints."
    },
    {
      "id": 2,
      "title": "Implement user registration endpoint",
      "description": "Create POST /auth/register with email verification",
      "status": "pending",
      "dependencies": [1],
      "priority": "high",
      "details": "...",
      "testStrategy": "..."
    }
  ]
}
```

---

**Related Resources:**
- [SKILL.md](../SKILL.md) - Main skill guide
- [task-management-guide.md](task-management-guide.md) - Task CRUD operations
- [complete-examples.md](complete-examples.md) - Full examples
