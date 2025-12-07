# Complete Examples

Full working examples of Task Master prompt templates covering all major use cases.

## Table of Contents

- [PRD Parsing Example](#prd-parsing-example)
- [Task Addition Example](#task-addition-example)
- [Task Expansion Example](#task-expansion-example)
- [Complexity Analysis Example](#complexity-analysis-example)
- [Research Query Example](#research-query-example)
- [Full Workflow Example](#full-workflow-example)

---

## PRD Parsing Example

### Complete parse-prd.json

```json
{
  "id": "parse-prd",
  "version": "1.0.0",
  "description": "Parse a Product Requirements Document into structured tasks",
  "metadata": {
    "author": "system",
    "created": "2024-01-01T00:00:00Z",
    "updated": "2024-01-01T00:00:00Z",
    "tags": ["prd", "parsing", "initialization"]
  },
  "parameters": {
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
    "research": {
      "type": "boolean",
      "default": false,
      "description": "Enable research mode for latest best practices"
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
      "required": false,
      "default": "medium",
      "enum": ["high", "medium", "low"],
      "description": "Default priority for generated tasks"
    },
    "hasCodebaseAnalysis": {
      "type": "boolean",
      "required": false,
      "default": false,
      "description": "Whether codebase analysis is available"
    },
    "projectRoot": {
      "type": "string",
      "required": false,
      "default": "",
      "description": "Project root path for context"
    }
  },
  "prompts": {
    "default": {
      "system": "You are an AI assistant specialized in analyzing Product Requirements Documents (PRDs) and generating a structured, logically ordered, dependency-aware and sequenced list of development tasks in JSON format.{{#if research}}\nBefore breaking down the PRD into tasks, you will:\n1. Research and analyze the latest technologies, libraries, frameworks, and best practices\n2. Identify potential technical challenges, security concerns, or scalability issues\n3. Consider current industry standards and evolving trends\n4. Evaluate alternative implementation approaches\n5. Include specific library versions and implementation guidance\n6. Always aim for the most direct path to implementation{{/if}}\n\nAnalyze the provided PRD content and generate {{#if (gt numTasks 0)}}approximately {{numTasks}}{{else}}an appropriate number of{{/if}} top-level development tasks.\n\nEach task should follow this JSON structure:\n{\n\t\"id\": number,\n\t\"title\": string,\n\t\"description\": string,\n\t\"status\": \"pending\",\n\t\"dependencies\": number[],\n\t\"priority\": \"high\" | \"medium\" | \"low\",\n\t\"details\": string,\n\t\"testStrategy\": string\n}\n\nGuidelines:\n1. Create {{#if (gt numTasks 0)}}exactly {{numTasks}}{{else}}an appropriate number of{{/if}} tasks, starting from {{nextId}}\n2. Each task should be atomic and focused\n3. Order tasks logically - consider dependencies\n4. Early tasks: setup and core functionality first\n5. Include clear validation/testing approach\n6. Set appropriate dependency IDs (only lower IDs)\n7. Assign priority based on criticality\n8. Include detailed implementation guidance\n9. STRICTLY ADHERE to PRD requirements\n10. Fill gaps not specified in PRD",
      "user": "{{#if hasCodebaseAnalysis}}## IMPORTANT: Codebase Analysis Required\n\nBefore generating tasks:\n1. Use Glob to explore project structure\n2. Use Grep to search existing implementations\n3. Use Read to examine key files\n\nProject Root: {{projectRoot}}\n{{/if}}\n\nPRD to break down into tasks (starting from ID {{nextId}}):\n\n{{prdContent}}\n\nIMPORTANT: Response must be JSON with \"tasks\" array."
    }
  }
}
```

### Usage Example

```javascript
const result = promptManager.loadPrompt('parse-prd', {
  numTasks: 8,
  nextId: 1,
  research: true,
  prdContent: `
# E-Commerce Cart System

## Requirements
- Add to cart functionality
- Cart persistence across sessions
- Quantity updates
- Remove items
- Calculate totals with tax
`,
  prdPath: '/docs/cart-prd.md',
  defaultTaskPriority: 'medium'
});
```

### Expected Output

```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Set up cart database schema",
      "description": "Create database tables for cart and cart items",
      "status": "pending",
      "dependencies": [],
      "priority": "high",
      "details": "Create Prisma schema:\n- Cart: id, userId, createdAt, updatedAt\n- CartItem: id, cartId, productId, quantity\n\nRelations:\n- Cart hasMany CartItem\n- CartItem belongsTo Cart",
      "testStrategy": "Verify migrations. Test unique constraints."
    },
    {
      "id": 2,
      "title": "Implement cart service layer",
      "description": "Create service with cart CRUD operations",
      "status": "pending",
      "dependencies": [1],
      "priority": "high",
      "details": "CartService methods:\n- createCart(userId)\n- getCart(userId)\n- addItem(cartId, productId, quantity)\n- updateQuantity(cartId, itemId, quantity)\n- removeItem(cartId, itemId)\n- calculateTotal(cartId)",
      "testStrategy": "Unit tests for each method."
    }
  ]
}
```

---

## Task Addition Example

### Complete add-task.json

```json
{
  "id": "add-task",
  "version": "1.0.0",
  "description": "Generate a new task based on description",
  "metadata": {
    "author": "system",
    "tags": ["task-creation", "generation"]
  },
  "parameters": {
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
  },
  "prompts": {
    "default": {
      "system": "You are a helpful assistant that creates well-structured tasks for software development. Generate a single new task.\n\nIMPORTANT: Response MUST be JSON with these fields directly (no wrapper):\n{\n  \"title\": \"string\",\n  \"description\": \"string\",\n  \"details\": \"string\",\n  \"testStrategy\": \"string\",\n  \"dependencies\": [numbers]\n}\n\nDependency selection principles:\n1. Select based on logical requirements\n2. Prioritize semantically related tasks\n3. Consider direct and indirect dependencies\n4. Avoid unnecessary dependencies\n5. Prefer completed tasks as dependencies{{#if useResearch}}\n\nResearch current best practices relevant to this task.{{/if}}",
      "user": "Generate Task #{{newTaskId}}.\n\nRequest: \"{{prompt}}\"\n\n{{gatheredContext}}\n\n{{#if useResearch}}Research best practices.{{/if}}\n\nReturn JSON matching the schema."
    }
  }
}
```

### Usage Example

```javascript
const result = promptManager.loadPrompt('add-task', {
  prompt: 'Add rate limiting to protect API endpoints from abuse',
  newTaskId: 15,
  existingTasks: [
    { id: 1, title: 'Project setup', status: 'done' },
    { id: 2, title: 'Express API structure', status: 'done' },
    { id: 5, title: 'Authentication middleware', status: 'done' }
  ],
  gatheredContext: 'Express backend with Redis available',
  priority: 'high',
  useResearch: true
});
```

### Expected Output

```json
{
  "title": "Implement API rate limiting",
  "description": "Add rate limiting middleware to protect API endpoints from abuse and DDoS attacks",
  "details": "## Implementation\n\n1. Install express-rate-limit@7.1.0 and rate-limit-redis@4.2.0\n\n2. Create rate limit configuration:\n```typescript\nconst limiter = rateLimit({\n  store: new RedisStore({ client: redisClient }),\n  windowMs: 60 * 1000,\n  max: 100,\n  message: { error: 'Too many requests' }\n});\n```\n\n3. Apply globally and per-endpoint:\n- Global: 100 req/min\n- Auth endpoints: 10 req/min\n- Heavy endpoints: 20 req/min\n\n4. Add rate limit headers:\n- X-RateLimit-Limit\n- X-RateLimit-Remaining\n- X-RateLimit-Reset",
  "testStrategy": "1. Unit test rate limit middleware\n2. Integration test with Redis\n3. Load test to verify limits\n4. Test rate limit headers",
  "dependencies": [2, 5]
}
```

---

## Task Expansion Example

### Complete expand-task.json

```json
{
  "id": "expand-task",
  "version": "1.0.0",
  "description": "Break down a task into detailed subtasks",
  "metadata": {
    "author": "system",
    "tags": ["expansion", "subtasks", "breakdown"]
  },
  "parameters": {
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
    }
  },
  "prompts": {
    "complexity-report": {
      "condition": "expansionPrompt",
      "system": "You are an AI assistant helping with task breakdown. Generate {{#if (gt subtaskCount 0)}}exactly {{subtaskCount}}{{else}}an appropriate number of{{/if}} subtasks.\n\nEach subtask must include:\n- id: Sequential from {{nextSubtaskId}}\n- title: Clear, actionable (5-200 chars)\n- description: Detailed (min 10 chars)\n- dependencies: Array of task IDs\n- details: Implementation details (min 20 chars)\n- status: \"pending\"\n- testStrategy: Testing approach\n\nResponse: JSON with \"subtasks\" array.",
      "user": "Parent Task:\nID: {{task.id}}\nTitle: {{task.title}}\nDescription: {{task.description}}\n\n{{expansionPrompt}}{{#if additionalContext}}\n\n{{additionalContext}}{{/if}}\n\nGenerate subtasks starting from ID {{nextSubtaskId}}."
    },
    "default": {
      "system": "You are an AI assistant helping with task breakdown.\n\nSubtask requirements:\n- id: Sequential from {{nextSubtaskId}}\n- title: 5-200 characters\n- description: Minimum 10 characters\n- dependencies: Array (can be empty)\n- details: Minimum 20 characters\n- status: \"pending\"\n- testStrategy: Can be null\n\nResponse: JSON with \"subtasks\" array.",
      "user": "Break down this task into {{#if (gt subtaskCount 0)}}exactly {{subtaskCount}}{{else}}appropriate{{/if}} subtasks:\n\nTask ID: {{task.id}}\nTitle: {{task.title}}\nDescription: {{task.description}}\nDetails: {{#if task.details}}{{task.details}}{{else}}None{{/if}}{{#if additionalContext}}\n\nContext: {{additionalContext}}{{/if}}\n\nCRITICAL: Sequential IDs from {{nextSubtaskId}}."
    }
  }
}
```

### Usage Example

```javascript
// With expansion prompt from complexity analysis
const result = promptManager.loadPrompt('expand-task', {
  task: {
    id: 5,
    title: 'Implement user authentication',
    description: 'Create complete auth system with JWT'
  },
  subtaskCount: 5,
  nextSubtaskId: 1,
  expansionPrompt: 'Focus on: 1) JWT token generation, 2) Password hashing, 3) Login endpoint, 4) Token refresh, 5) Password reset'
});
```

### Expected Output

```json
{
  "subtasks": [
    {
      "id": 1,
      "title": "Implement JWT token generation",
      "description": "Create utility for generating and validating JWT tokens",
      "dependencies": [],
      "details": "Use jose library for JWT.\n\nImplement:\n- generateAccessToken(userId, roles)\n- generateRefreshToken(userId)\n- verifyToken(token)\n\nConfiguration:\n- Access token: 15 min expiry\n- Refresh token: 7 day expiry\n- RS256 algorithm",
      "status": "pending",
      "testStrategy": "Unit test token generation and validation"
    },
    {
      "id": 2,
      "title": "Implement password hashing",
      "description": "Secure password hashing with bcrypt",
      "dependencies": [],
      "details": "Use bcrypt@5.1.1\n\nFunctions:\n- hashPassword(plain): Hash with 12 rounds\n- verifyPassword(plain, hash): Compare\n\nNever store plain passwords.",
      "status": "pending",
      "testStrategy": "Test hashing and verification"
    },
    {
      "id": 3,
      "title": "Create login endpoint",
      "description": "POST /auth/login with email/password",
      "dependencies": [1, 2],
      "details": "Request: { email, password }\nResponse: { accessToken, refreshToken, user }\n\nSteps:\n1. Validate input with Zod\n2. Find user by email\n3. Verify password\n4. Generate tokens\n5. Return response",
      "status": "pending",
      "testStrategy": "Integration tests for success and failure cases"
    },
    {
      "id": 4,
      "title": "Implement token refresh",
      "description": "POST /auth/refresh for new access token",
      "dependencies": [1],
      "details": "Request: { refreshToken }\nResponse: { accessToken }\n\nSteps:\n1. Validate refresh token\n2. Check not revoked\n3. Generate new access token\n4. Optionally rotate refresh token",
      "status": "pending",
      "testStrategy": "Test valid refresh and expired token handling"
    },
    {
      "id": 5,
      "title": "Implement password reset",
      "description": "Forgot password flow with email",
      "dependencies": [2],
      "details": "Two endpoints:\n\nPOST /auth/forgot-password\n- Generate reset token\n- Send email with link\n\nPOST /auth/reset-password\n- Validate reset token\n- Update password\n- Invalidate token",
      "status": "pending",
      "testStrategy": "Test complete flow including email"
    }
  ]
}
```

---

## Complexity Analysis Example

### Complete analyze-complexity.json

```json
{
  "id": "analyze-complexity",
  "version": "1.0.0",
  "description": "Analyze task complexity and generate expansion recommendations",
  "metadata": {
    "author": "system",
    "tags": ["analysis", "complexity", "recommendations"]
  },
  "parameters": {
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
      "description": "Complexity threshold for expansion"
    },
    "useResearch": {
      "type": "boolean",
      "default": false
    }
  },
  "prompts": {
    "default": {
      "system": "You are an expert software architect analyzing task complexity.\n\nFor each task provide:\n- taskId: Positive integer\n- taskTitle: Task title\n- complexityScore: 1-10\n- recommendedSubtasks: Number (0 if no expansion)\n- expansionPrompt: Guidance for subtask generation\n- reasoning: Explanation of score\n\nResponse: JSON with \"complexityAnalysis\" array.",
      "user": "Analyze these tasks for complexity (threshold {{threshold}}):\n\n{{{json tasks}}}{{#if gatheredContext}}\n\nContext: {{gatheredContext}}{{/if}}"
    }
  }
}
```

### Usage Example

```javascript
const result = promptManager.loadPrompt('analyze-complexity', {
  tasks: [
    { id: 1, title: 'Add logging', description: 'Add Winston logging' },
    { id: 2, title: 'Implement OAuth', description: 'Add Google OAuth' },
    { id: 3, title: 'Database migration', description: 'Migrate to new schema' }
  ],
  threshold: 5,
  useResearch: false
});
```

### Expected Output

```json
{
  "complexityAnalysis": [
    {
      "taskId": 1,
      "taskTitle": "Add logging",
      "complexityScore": 3,
      "recommendedSubtasks": 0,
      "expansionPrompt": "",
      "reasoning": "Straightforward Winston integration with minimal configuration"
    },
    {
      "taskId": 2,
      "taskTitle": "Implement OAuth",
      "complexityScore": 7,
      "recommendedSubtasks": 4,
      "expansionPrompt": "Break down into: 1) Google OAuth client setup, 2) OAuth callback handling, 3) User creation/linking, 4) Session management with OAuth tokens",
      "reasoning": "Multiple components: OAuth flow, user linking, token management, error handling"
    },
    {
      "taskId": 3,
      "taskTitle": "Database migration",
      "complexityScore": 8,
      "recommendedSubtasks": 5,
      "expansionPrompt": "Break down into: 1) Schema design and migration scripts, 2) Data transformation queries, 3) Rollback procedures, 4) Zero-downtime migration strategy, 5) Verification and testing",
      "reasoning": "High-risk operation requiring careful planning, data preservation, rollback capability"
    }
  ]
}
```

---

## Research Query Example

### Complete research.json

```json
{
  "id": "research",
  "version": "1.0.0",
  "description": "Perform AI-powered research with project context",
  "metadata": {
    "author": "system",
    "tags": ["research", "context-aware"]
  },
  "parameters": {
    "query": {
      "type": "string",
      "required": true,
      "description": "Research query"
    },
    "gatheredContext": {
      "type": "string",
      "default": "",
      "description": "Project context"
    },
    "detailLevel": {
      "type": "string",
      "enum": ["low", "medium", "high"],
      "default": "medium"
    }
  },
  "prompts": {
    "default": {
      "system": "You are an expert AI research assistant.\n{{#if (eq detailLevel \"low\")}}\n**Style: Concise**\n- 2-4 paragraphs max\n- Bullet points for key takeaways\n- No pleasantries or conclusions{{/if}}{{#if (eq detailLevel \"medium\")}}\n**Style: Balanced**\n- 4-8 paragraphs\n- Include examples\n- Use headings{{/if}}{{#if (eq detailLevel \"high\")}}\n**Style: Detailed**\n- 8+ paragraphs\n- Multiple perspectives\n- Code snippets\n- Edge cases{{/if}}\n\nProvide actionable, project-relevant insights.",
      "user": "# Research Query\n\n{{query}}{{#if gatheredContext}}\n\n# Project Context\n\n{{gatheredContext}}{{/if}}\n\nProvide a {{detailLevel}}-detail response."
    }
  }
}
```

---

## Full Workflow Example

### Complete Task Management Workflow

```javascript
// 1. Parse PRD into initial tasks
const prdResult = await generateWithPrompt('parse-prd', {
  numTasks: 10,
  nextId: 1,
  prdContent: prdFileContent,
  prdPath: '/docs/feature.md',
  research: true
});

const tasks = prdResult.tasks;

// 2. Analyze complexity
const analysisResult = await generateWithPrompt('analyze-complexity', {
  tasks: tasks,
  threshold: 5
});

// 3. Expand complex tasks
for (const analysis of analysisResult.complexityAnalysis) {
  if (analysis.complexityScore >= 5 && analysis.recommendedSubtasks > 0) {
    const task = tasks.find(t => t.id === analysis.taskId);
    const existingSubtaskCount = task.subtasks?.length || 0;

    const expansionResult = await generateWithPrompt('expand-task', {
      task: task,
      subtaskCount: analysis.recommendedSubtasks,
      nextSubtaskId: existingSubtaskCount + 1,
      expansionPrompt: analysis.expansionPrompt
    });

    task.subtasks = expansionResult.subtasks;
  }
}

// 4. Add new task based on feedback
const newTaskResult = await generateWithPrompt('add-task', {
  prompt: 'Add caching layer for API responses',
  newTaskId: tasks.length + 1,
  existingTasks: tasks,
  priority: 'medium'
});

tasks.push({
  id: tasks.length + 1,
  ...newTaskResult
});

// 5. Update tasks based on new requirements
const updateResult = await generateWithPrompt('update-tasks', {
  tasks: tasks,
  updatePrompt: 'Add TypeScript strict mode compliance to all tasks'
});

const updatedTasks = updateResult.tasks;
```

---

**Related Resources:**
- [SKILL.md](../SKILL.md) - Main skill guide
- [prompt-template-reference.md](prompt-template-reference.md) - Template structure
- [task-management-guide.md](task-management-guide.md) - CRUD operations
