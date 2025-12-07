# Complexity Analysis Guide

Complete guide for analyzing task complexity and generating expansion recommendations to determine which tasks need breakdown into subtasks.

## Table of Contents

- [Overview](#overview)
- [The analyze-complexity Prompt](#the-analyze-complexity-prompt)
- [Complexity Scoring](#complexity-scoring)
- [Expansion Recommendations](#expansion-recommendations)
- [Codebase-Aware Analysis](#codebase-aware-analysis)
- [Integration with Task Expansion](#integration-with-task-expansion)

---

## Overview

Complexity analysis evaluates tasks to determine:

1. **Complexity score** (1-10) for each task
2. **Recommended subtask count** for expansion
3. **Expansion prompts** to guide subtask generation
4. **Reasoning** explaining the assessment

This enables intelligent task management:
- Prioritize complex tasks for breakdown
- Skip simple tasks that don't need expansion
- Provide targeted expansion guidance

---

## The analyze-complexity Prompt

### Parameters

```json
{
  "tasks": {
    "type": "array",
    "required": true,
    "description": "Array of tasks to analyze"
  },
  "gatheredContext": {
    "type": "string",
    "default": "",
    "description": "Additional project context"
  },
  "threshold": {
    "type": "number",
    "default": 5,
    "minimum": 1,
    "maximum": 10,
    "description": "Complexity threshold for expansion recommendation"
  },
  "useResearch": {
    "type": "boolean",
    "default": false,
    "description": "Use research mode for deeper analysis"
  },
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

### System Prompt

```
You are an expert software architect and project manager analyzing task
complexity. Your analysis should consider implementation effort, technical
challenges, dependencies, and testing requirements.

IMPORTANT: For each task, provide an analysis object with ALL of the
following fields:
- taskId: The ID of the task being analyzed (positive integer)
- taskTitle: The title of the task
- complexityScore: A score from 1-10 indicating complexity
- recommendedSubtasks: Number of subtasks recommended (0 if no expansion)
- expansionPrompt: A prompt to guide subtask generation
- reasoning: Your reasoning for the complexity score
```

### Output Structure

```json
{
  "complexityAnalysis": [
    {
      "taskId": 1,
      "taskTitle": "Set up authentication system",
      "complexityScore": 8,
      "recommendedSubtasks": 5,
      "expansionPrompt": "Break down into: JWT setup, user model, login endpoint, token refresh, password reset",
      "reasoning": "Multiple security-critical components with token management complexity"
    },
    {
      "taskId": 2,
      "taskTitle": "Add logging",
      "complexityScore": 3,
      "recommendedSubtasks": 0,
      "expansionPrompt": "",
      "reasoning": "Straightforward Winston/Pino integration with minimal configuration"
    }
  ],
  "metadata": {
    "analyzedCount": 2,
    "expansionRecommended": 1,
    "averageComplexity": 5.5
  }
}
```

---

## Complexity Scoring

### Score Definitions

| Score | Level | Description | Expansion |
|-------|-------|-------------|-----------|
| 1-2 | Trivial | Simple, self-contained, no dependencies | No |
| 3-4 | Low | Minor implementation, few considerations | Usually no |
| 5-6 | Medium | Moderate complexity, some challenges | Consider |
| 7-8 | High | Complex implementation, multiple parts | Yes |
| 9-10 | Very High | Major system changes, high risk | Required |

### Scoring Factors

**Implementation Effort:**
- Lines of code expected
- Number of files to modify
- New concepts to implement

**Technical Challenges:**
- Algorithm complexity
- Performance considerations
- Security requirements
- Error handling needs

**Dependencies:**
- External service integrations
- Database schema changes
- API contracts

**Testing Requirements:**
- Unit test complexity
- Integration test needs
- Edge cases to cover

### Example Scoring Rationale

**Score: 3 (Low)**
```json
{
  "taskId": 5,
  "taskTitle": "Add health check endpoint",
  "complexityScore": 3,
  "reasoning": "Single endpoint with basic response. No database access, no authentication. Simple Express route with status 200 response."
}
```

**Score: 7 (High)**
```json
{
  "taskId": 8,
  "taskTitle": "Implement rate limiting",
  "complexityScore": 7,
  "reasoning": "Requires Redis integration for distributed rate limiting, per-endpoint configuration, sliding window algorithm, proper error responses, and monitoring integration. Multiple middleware components needed."
}
```

**Score: 9 (Very High)**
```json
{
  "taskId": 12,
  "taskTitle": "Database migration to new schema",
  "complexityScore": 9,
  "reasoning": "Major schema changes affecting 8 tables. Requires data migration scripts, rollback procedures, zero-downtime deployment strategy, and comprehensive testing. High risk of data loss if incorrectly implemented."
}
```

---

## Expansion Recommendations

### When to Recommend Expansion

Recommend subtasks (`recommendedSubtasks > 0`) when:

1. **Score >= threshold** (default 5)
2. **Multiple distinct components** need implementation
3. **Different expertise areas** required
4. **Parallel work possible** after breakdown
5. **Risk mitigation** through smaller steps

### Subtask Count Guidelines

| Complexity | Recommended Subtasks |
|------------|---------------------|
| 5-6 | 2-3 subtasks |
| 7-8 | 4-6 subtasks |
| 9-10 | 5-8 subtasks |

### Expansion Prompt Quality

Good expansion prompts are:
- **Specific** - Name actual components
- **Ordered** - Suggest logical sequence
- **Actionable** - Clear what each subtask does

**Good example:**
```
"Break down into: 1) Create Prisma schema for rate limits, 2) Implement Redis connection and cache layer, 3) Create rate limit middleware with sliding window, 4) Add per-endpoint configuration, 5) Implement rate limit exceeded responses, 6) Add monitoring and alerting"
```

**Poor example:**
```
"Break this into smaller pieces for implementation"
```

---

## Codebase-Aware Analysis

Enable with `hasCodebaseAnalysis: true` for accurate complexity assessment.

### Analysis Instructions

```handlebars
{{#if hasCodebaseAnalysis}}
## IMPORTANT: Codebase Analysis Required

Before analyzing task complexity:

1. Use the Glob tool to explore the project structure and understand
   codebase size
2. Use the Grep tool to search for existing implementations related
   to each task
3. Use the Read tool to examine key files that would be affected
4. Understand the current implementation state, patterns used, and
   technical debt

Based on your codebase analysis:
- Assess complexity based on ACTUAL code that needs modification
- Consider existing abstractions that could simplify implementation
- Identify tasks requiring refactoring vs. greenfield development
- Factor in dependencies between existing code and new features
- Provide more accurate subtask recommendations based on real structure

Project Root: {{projectRoot}}
{{/if}}
```

### Benefits of Codebase Analysis

1. **Accurate sizing** - Know actual lines to change
2. **Pattern recognition** - Identify reusable code
3. **Dependency mapping** - See real code dependencies
4. **Tech debt awareness** - Factor in existing issues
5. **Architecture alignment** - Match project patterns

### Example: With vs Without Analysis

**Without codebase analysis:**
```json
{
  "taskTitle": "Add user preferences",
  "complexityScore": 5,
  "reasoning": "Standard CRUD operations for preferences"
}
```

**With codebase analysis:**
```json
{
  "taskTitle": "Add user preferences",
  "complexityScore": 7,
  "reasoning": "Existing User model uses legacy ORM pattern. Need to migrate to Prisma first or maintain two patterns. Preferences table needs 3 foreign keys to existing tables. Current auth middleware needs extension for preference scopes."
}
```

---

## Integration with Task Expansion

### Workflow

```
1. analyze-complexity → Get complexity scores and expansion prompts
2. Filter tasks where complexityScore >= threshold
3. expand-task → Use expansionPrompt from complexity analysis
```

### Using expansionPrompt

The `expand-task` prompt has a `complexity-report` variant:

```json
{
  "complexity-report": {
    "condition": "expansionPrompt",
    "system": "Use the expansion prompt from complexity report...",
    "user": "{{expansionPrompt}}..."
  }
}
```

### Example Integration

```javascript
// Step 1: Analyze complexity
const analysis = await promptManager.loadPrompt('analyze-complexity', {
  tasks: myTasks,
  threshold: 5,
  hasCodebaseAnalysis: true,
  projectRoot: '/path/to/project'
});

// Step 2: Filter and expand complex tasks
for (const result of analysis.complexityAnalysis) {
  if (result.complexityScore >= 5 && result.recommendedSubtasks > 0) {
    const expansion = await promptManager.loadPrompt('expand-task', {
      task: tasks.find(t => t.id === result.taskId),
      subtaskCount: result.recommendedSubtasks,
      expansionPrompt: result.expansionPrompt,  // Triggers complexity-report variant
      nextSubtaskId: calculateNextSubtaskId()
    });

    // Apply subtasks to task
  }
}
```

### Expansion Prompt Examples

**Authentication task:**
```
"Focus on security-critical components: 1) JWT token generation and validation with proper expiry, 2) Password hashing with bcrypt and salt rounds, 3) Session management with Redis, 4) Refresh token rotation, 5) Login attempt tracking and lockout"
```

**API endpoint task:**
```
"Break down RESTful endpoints: 1) GET list with pagination and filtering, 2) GET single with relations, 3) POST create with validation, 4) PUT/PATCH update with ownership check, 5) DELETE with soft-delete option"
```

**Database migration task:**
```
"Approach carefully: 1) Create new schema alongside old, 2) Build dual-write migration, 3) Implement data backfill script, 4) Add feature flag for cutover, 5) Create rollback procedure, 6) Document runbook"
```

---

## Research Mode

Enable with `useResearch: true` for deeper analysis.

### When to Use

- **Unfamiliar technologies** in the task
- **Architecture decisions** needed
- **Performance concerns** unclear
- **Security implications** unknown

### Research Additions

The prompt adds:
```
Consider current best practices, common implementation patterns, and
industry standards in your analysis.
```

### Research Impact

- More accurate complexity scores
- Better subtask recommendations
- Specific technology suggestions
- Risk identification

---

## Best Practices

### Batch Analysis

Analyze multiple tasks together for:
- Consistent scoring
- Cross-task dependency awareness
- Efficient processing

### Threshold Selection

| Context | Suggested Threshold |
|---------|-------------------|
| MVP development | 4 (expand more) |
| Stable project | 6 (expand less) |
| Refactoring | 5 (balanced) |
| Critical features | 3 (expand most) |

### Iterative Analysis

Re-analyze after:
- Major scope changes
- New dependencies discovered
- Technical spikes completed
- Team composition changes

---

**Related Resources:**
- [SKILL.md](../SKILL.md) - Main skill guide
- [task-management-guide.md](task-management-guide.md) - Task expansion details
- [complete-examples.md](complete-examples.md) - Full examples
