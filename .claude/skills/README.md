# Skills

Production-tested skills for Claude Code that auto-activate based on context.

---

## What Are Skills?

Skills are modular knowledge bases that Claude loads when needed. They provide:
- Domain-specific guidelines
- Best practices
- Code examples
- Anti-patterns to avoid

**Problem:** Skills don't activate automatically by default.

**Solution:** This showcase includes the hooks + configuration to make them activate.

---

## Available Skills

### skill-developer (Meta-Skill)
**Purpose:** Creating and managing Claude Code skills

**Files:** 7 resource files (426 lines total)

**Use when:**
- Creating new skills
- Understanding skill structure
- Working with skill-rules.json
- Debugging skill activation

**Customization:** ✅ None - copy as-is

**[View Skill →](skill-developer/)**

---

### kaizen-solaris-review
**Purpose:** Toyota Way code review combining technical excellence with continuous improvement

**Files:** 11 resource files (main + resources)

**Covers:**
- Memory safety & unsafe code review
- Testing strategy (unit, property-based, fuzzing)
- Security hardening (cargo-audit, supply chain)
- Code quality and complexity limits
- Review process (Nemawashi, Jidoka, Kaizen)
- **Pragmatic Review Framework** (NEW - high-velocity teams)
- **GitHub Actions CI/CD integration** (NEW)

**Use when:**
- Reviewing Rust code
- Implementing quality gates
- Setting up automated code review
- Following Toyota Way practices

**Slash Command:** `/review` - On-demand pragmatic code review

**Customization:** ✅ Minimal - copy as-is for Rust projects

**[View Skill →](kaizen-solaris-review/)**

---

### task-master-prompts
**Purpose:** AI-powered task management prompt engineering

**Files:** 5 resource files (main + resources)

**Covers:**
- PRD parsing into structured tasks
- Task expansion into subtasks
- Complexity analysis and scoring
- Research-augmented task generation
- Handlebars template syntax
- JSON schema validation
- Variant selection patterns
- Codebase analysis integration

**Use when:**
- Building AI task management systems
- Parsing PRDs into development tasks
- Creating prompt templates for LLMs
- Analyzing task complexity
- Implementing task expansion logic

**Customization:** ✅ None - copy as-is (prompt engineering patterns)

**Example usage:**
```json
{
  "promptTriggers": {
    "keywords": ["task master", "prd parsing", "task breakdown"]
  }
}
```

**[View Skill →](task-master-prompts/)**

---

### backend-dev-guidelines
**Purpose:** Node.js/Express/TypeScript development patterns

**Files:** 12 resource files (304 lines main + resources)

**Covers:**
- Layered architecture (Routes → Controllers → Services → Repositories)
- BaseController pattern
- Prisma database access
- Sentry error tracking
- Zod validation
- UnifiedConfig pattern
- Dependency injection
- Testing strategies

**Use when:**
- Creating/modifying API routes
- Building controllers or services
- Database operations with Prisma
- Setting up error tracking

**Customization:** ⚠️ Update `pathPatterns` in skill-rules.json to match your backend directories

**Example pathPatterns:**
```json
{
  "pathPatterns": [
    "src/api/**/*.ts",       // Single app with src/api
    "backend/**/*.ts",       // Backend directory
    "services/*/src/**/*.ts" // Multi-service monorepo
  ]
}
```

**[View Skill →](backend-dev-guidelines/)**

---

### frontend-dev-guidelines
**Purpose:** React/TypeScript/MUI v7 development patterns

**Files:** 11 resource files (398 lines main + resources)

**Covers:**
- Modern React patterns (Suspense, lazy loading)
- useSuspenseQuery for data fetching
- MUI v7 styling (Grid with `size={{}}` prop)
- TanStack Router
- File organization (features/ pattern)
- Performance optimization
- TypeScript best practices

**Use when:**
- Creating React components
- Fetching data with TanStack Query
- Styling with MUI v7
- Setting up routing

**Customization:** ⚠️ Update `pathPatterns` + verify you use React/MUI

**Example pathPatterns:**
```json
{
  "pathPatterns": [
    "src/**/*.tsx",          // Single React app
    "frontend/src/**/*.tsx", // Frontend directory
    "apps/web/**/*.tsx"      // Monorepo web app
  ]
}
```

**Note:** This skill is configured as a **guardrail** (enforcement: "block") to prevent MUI v6→v7 incompatibilities.

**[View Skill →](frontend-dev-guidelines/)**

---

### route-tester
**Purpose:** Testing authenticated API routes with JWT cookie auth

**Files:** 1 main file (389 lines)

**Covers:**
- JWT cookie-based authentication testing
- test-auth-route.js script patterns
- cURL with cookie authentication
- Debugging auth issues
- Testing POST/PUT/DELETE operations

**Use when:**
- Testing API endpoints
- Debugging authentication
- Validating route functionality

**Customization:** ⚠️ Requires JWT cookie auth setup

**Ask first:** "Do you use JWT cookie-based authentication?"
- If YES: Copy and customize service URLs
- If NO: Skip or adapt for your auth method

**[View Skill →](route-tester/)**

---

### error-tracking
**Purpose:** Sentry error tracking and monitoring patterns

**Files:** 1 main file (~250 lines)

**Covers:**
- Sentry v8 initialization
- Error capture patterns
- Breadcrumbs and user context
- Performance monitoring
- Integration with Express and React

**Use when:**
- Setting up error tracking
- Capturing exceptions
- Adding error context
- Debugging production issues

**Customization:** ⚠️ Update `pathPatterns` for your backend

**[View Skill →](error-tracking/)**

---

### dev-browser
**Purpose:** Enterprise-grade browser automation with persistent page state, inspired by PAIML and Probar patterns

**Files:** Main skill (~580 lines) + 3 resource files + source files

**Covers:**
- Persistent Playwright browser server
- ARIA accessibility snapshots for element discovery
- **GUI Coverage Tracking** (from Probar) - Track element/screen test coverage
- **Visual Regression Testing** - Screenshot comparison with baselines
- **Accessibility Auditing** - WCAG 2.1 AA compliance checks
- **Soft Assertions with Retry** - Handle flaky tests gracefully
- **Workflow Playbooks** - State machine definitions for complex flows
- **Quality Metrics Dashboard** - PAIML-style scoring (A+ to F grades)
- **Falsifiable Commitments** - Performance guarantees with measurements

**Use when:**
- Testing running web applications
- Visual regression testing
- Accessibility audits (WCAG, keyboard, screen reader)
- E2E testing with coverage tracking
- Performance profiling (Core Web Vitals)
- Stripe-level UI quality checks

**Setup:**
```bash
cd .claude/skills/dev-browser && ./server.sh &
```

**Customization:** ✅ None - works with any web application

**Key Features:**
- Pages persist between script executions
- LLM-optimized output formats
- GUI coverage tracking with thresholds
- WCAG accessibility auditing
- Visual regression with baselines
- Quality grades (A+ to F)

**Resource Files:**
- [advanced-patterns.md](dev-browser/resources/advanced-patterns.md) - Fuzzing, replay, network interception
- [visual-testing.md](dev-browser/resources/visual-testing.md) - Regression, themes, animations
- [accessibility-guide.md](dev-browser/resources/accessibility-guide.md) - WCAG audit, keyboard, screen reader

**[View Skill →](dev-browser/)**

---

### shadcn-ui
**Purpose:** Universal shadcn/ui component generator for ANY framework

**Files:** Main skill + 7 resource files + CSS assets

**Covers:**
- shadcn/ui design principles and patterns
- CVA (Class Variance Authority) variant patterns
- Tailwind CSS styling with design tokens
- Accessibility-first components (ARIA, keyboard nav)
- Framework translations (React, Solid, Leptos/Rust)
- Dark/light theme systems
- 40+ component specifications

**Use when:**
- Building UI components with shadcn patterns
- Translating React components to other frameworks
- Creating component libraries with Tailwind
- Implementing accessible components with ARIA
- Working with Leptos/Rust WASM frontends
- Setting up design tokens and themes

**Framework Support:**
| Framework | Status | Reference |
|-----------|--------|-----------|
| React | Native (original) | react.md |
| SolidJS | Full translation | solid.md |
| Leptos (Rust) | Full translation | leptos.md |
| Other | Template provided | template.md |

**Customization:** ✅ None - works with any framework using Tailwind CSS

**Resource Files:**
- [design-system.md](shadcn-ui/resources/design-system.md) - Color tokens, typography, spacing
- [component-anatomy.md](shadcn-ui/resources/component-anatomy.md) - 40+ component specs
- [accessibility-patterns.md](shadcn-ui/resources/accessibility-patterns.md) - ARIA, keyboard nav
- [react.md](shadcn-ui/resources/framework-translations/react.md) - Original implementation
- [solid.md](shadcn-ui/resources/framework-translations/solid.md) - SolidJS with Kobalte
- [leptos.md](shadcn-ui/resources/framework-translations/leptos.md) - Rust/WASM translation
- [template.md](shadcn-ui/resources/framework-translations/template.md) - New framework template
- [globals.css](shadcn-ui/assets/base-css/globals.css) - Base CSS variables

**[View Skill →](shadcn-ui/)**

---

### production-hardening-backend
**Purpose:** Enterprise-grade production hardening for Rust backend services

**Files:** 7 resource files (main + resources)

**Covers:**
- NIST SP 800-53 control mapping
- Defense-in-depth security patterns
- Fault tolerance (circuit breakers, retries)
- Monitoring & observability (Prometheus, OpenTelemetry)
- Container hardening (distroless, non-root)
- **Security Review Methodology** (NEW - OWASP-focused)
- **Confidence scoring and false positive filtering** (NEW)

**Use when:**
- Hardening Rust backends for production
- Implementing security controls
- Setting up observability
- Security code reviews

**Slash Command:** `/security-review` - On-demand security vulnerability scan

**Customization:** ⚠️ Update `pathPatterns` for your Rust project

**[View Skill →](production-hardening-backend/)**

---

### frontend-dev-guidelines
**Purpose:** React/TypeScript/MUI v7 development patterns

**Files:** 11 resource files (main + resources)

**Covers:**
- Modern React patterns (Suspense, lazy loading)
- useSuspenseQuery for data fetching
- MUI v7 styling (Grid uses size={{}} prop)
- TanStack Router
- File organization (features/ pattern)
- Performance optimization
- **Design Review Checklist** (NEW - S-Tier SaaS standards)
- **Accessibility (WCAG 2.1 AA)** (NEW)
- **Responsive design viewports** (NEW)

**Use when:**
- Creating React components
- Reviewing UI/UX changes
- Ensuring accessibility compliance
- Design system consistency

**Slash Command:** `/design-review` - On-demand UI/UX design review
**Agent:** `design-review` - Playwright-based design review

**Customization:** ⚠️ Update `pathPatterns` + verify you use React/MUI

**[View Skill →](frontend-dev-guidelines/)**

---

## How to Add a Skill to Your Project

### Quick Integration

**For Claude Code:**
```
User: "Add the backend-dev-guidelines skill to my project"

Claude should:
1. Ask about project structure
2. Copy skill directory
3. Update skill-rules.json with their paths
4. Verify integration
```

See [CLAUDE_INTEGRATION_GUIDE.md](../../CLAUDE_INTEGRATION_GUIDE.md) for complete instructions.

### Manual Integration

**Step 1: Copy the skill directory**
```bash
cp -r claude-code-infrastructure-showcase/.claude/skills/backend-dev-guidelines \\
      your-project/.claude/skills/
```

**Step 2: Update skill-rules.json**

If you don't have one, create it:
```bash
cp claude-code-infrastructure-showcase/.claude/skills/skill-rules.json \\
   your-project/.claude/skills/
```

Then customize the `pathPatterns` for your project:
```json
{
  "skills": {
    "backend-dev-guidelines": {
      "fileTriggers": {
        "pathPatterns": [
          "YOUR_BACKEND_PATH/**/*.ts"  // ← Update this!
        ]
      }
    }
  }
}
```

**Step 3: Test**
- Edit a file in your backend directory
- The skill should activate automatically

---

## skill-rules.json Configuration

### What It Does

Defines when skills should activate based on:
- **Keywords** in user prompts ("backend", "API", "route")
- **Intent patterns** (regex matching user intent)
- **File path patterns** (editing backend files)
- **Content patterns** (code contains Prisma queries)

### Configuration Format

```json
{
  "skill-name": {
    "type": "domain" | "guardrail",
    "enforcement": "suggest" | "block",
    "priority": "high" | "medium" | "low",
    "promptTriggers": {
      "keywords": ["list", "of", "keywords"],
      "intentPatterns": ["regex patterns"]
    },
    "fileTriggers": {
      "pathPatterns": ["path/to/files/**/*.ts"],
      "contentPatterns": ["import.*Prisma"]
    }
  }
}
```

### Enforcement Levels

- **suggest**: Skill appears as suggestion, doesn't block
- **block**: Must use skill before proceeding (guardrail)

**Use "block" for:**
- Preventing breaking changes (MUI v6→v7)
- Critical database operations
- Security-sensitive code

**Use "suggest" for:**
- General best practices
- Domain guidance
- Code organization

---

## Creating Your Own Skills

See the **skill-developer** skill for complete guide on:
- Skill YAML frontmatter structure
- Resource file organization
- Trigger pattern design
- Testing skill activation

**Quick template:**
```markdown
---
name: my-skill
description: What this skill does
---

# My Skill Title

## Purpose
[Why this skill exists]

## When to Use This Skill
[Auto-activation scenarios]

## Quick Reference
[Key patterns and examples]

## Resource Files
- [topic-1.md](resources/topic-1.md)
- [topic-2.md](resources/topic-2.md)
```

---

## Troubleshooting

### Skill isn't activating

**Check:**
1. Is skill directory in `.claude/skills/`?
2. Is skill listed in `skill-rules.json`?
3. Do `pathPatterns` match your files?
4. Are hooks installed and working?
5. Is settings.json configured correctly?

**Debug:**
```bash
# Check skill exists
ls -la .claude/skills/

# Validate skill-rules.json
cat .claude/skills/skill-rules.json | jq .

# Check hooks are executable
ls -la .claude/hooks/*.sh

# Test hook manually
./.claude/hooks/skill-activation-prompt.sh
```

### Skill activates too often

Update skill-rules.json:
- Make keywords more specific
- Narrow `pathPatterns`
- Increase specificity of `intentPatterns`

### Skill never activates

Update skill-rules.json:
- Add more keywords
- Broaden `pathPatterns`
- Add more `intentPatterns`

---

## For Claude Code

**When integrating a skill for a user:**

1. **Read [CLAUDE_INTEGRATION_GUIDE.md](../../CLAUDE_INTEGRATION_GUIDE.md)** first
2. Ask about their project structure
3. Customize `pathPatterns` in skill-rules.json
4. Verify the skill file has no hardcoded paths
5. Test activation after integration

**Common mistakes:**
- Keeping example paths (blog-api/, frontend/)
- Not asking about monorepo vs single-app
- Copying skill-rules.json without customization

---

## Next Steps

1. **Start simple:** Add one skill that matches your work
2. **Verify activation:** Edit a relevant file, skill should suggest
3. **Add more:** Once first skill works, add others
4. **Customize:** Adjust triggers based on your workflow

**Questions?** See [CLAUDE_INTEGRATION_GUIDE.md](../../CLAUDE_INTEGRATION_GUIDE.md) for comprehensive integration instructions.
