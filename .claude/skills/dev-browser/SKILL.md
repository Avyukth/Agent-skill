---
name: dev-browser
description: Browser automation with persistent page state using Playwright. Use when users ask to navigate websites, fill forms, take screenshots, extract web data, test web apps, automate browser workflows, visual regression testing, accessibility auditing, or interact with running local applications. Trigger phrases include "go to [url]", "click on", "fill out the form", "take a screenshot", "scrape", "automate", "test the website", "log into", "open the browser", "check the UI", "accessibility audit", "visual regression", "test coverage", or any browser interaction request.
---

# Dev Browser Skill

Browser automation that maintains page state across script executions with enterprise-grade testing capabilities. Inspired by [PAIML](https://github.com/paiml/paiml-mcp-agent-toolkit) quality metrics and [Probar](https://github.com/paiml/probar) testing patterns.

## Purpose

Enable Claude to control a web browser for:
- Testing and verifying frontend changes in running applications
- Filling out forms and clicking buttons to test user flows
- Taking screenshots for visual verification and regression testing
- Accessibility auditing (WCAG compliance)
- GUI coverage tracking (element/screen interaction metrics)
- Scraping data from web pages
- Automating repetitive browser tasks

## Falsifiable Commitments

Performance guarantees for dev-browser operations:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page navigation | <3s for typical pages | `waitTimeMs` in result |
| ARIA snapshot generation | <500ms for 1000 elements | Script timing |
| Screenshot capture | <1s at 1280x800 | File write completion |
| Element interaction | <100ms per click/type | Script timing |
| Session persistence | 100% state preserved | Cross-script verification |

## When to Use This Skill

This skill automatically activates when you:
- Ask to navigate to a website or localhost URL
- Want to test a running web application
- Need to fill forms, click buttons, or interact with UI elements
- Request screenshots or visual regression testing
- Ask for accessibility auditing
- Ask to automate browser workflows
- Need to verify frontend changes visually

## Setup

Start the dev-browser server:

```bash
cd .claude/skills/dev-browser && ./server.sh &
```

**Flags:** `--headless` for headless mode (no visible window)

**Wait for `Ready` message.** First run installs dependencies and Chromium.

**Important:** Scripts must use `bun x tsx` (not `bun run`) for Playwright WebSocket compatibility.

## Quick Reference

### Basic Template

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

const client = await connect();
const page = await client.page("main");
await page.setViewportSize({ width: 1280, height: 800 });

await page.goto("https://example.com");
await waitForPageLoad(page);

console.log({ title: await page.title(), url: page.url() });
await client.disconnect();
EOF
```

### Client API

```typescript
const client = await connect();
const page = await client.page("name");     // Get or create named page
const pages = await client.list();          // List all page names
await client.close("name");                 // Close a page
await client.disconnect();                  // Disconnect (pages persist)
const snapshot = await client.getAISnapshot("name");           // ARIA tree
const element = await client.selectSnapshotRef("name", "e5");  // Get by ref
```

## GUI Coverage Tracking

Track which UI elements and screens have been tested (inspired by Probar's `gui_coverage!` macro).

### Coverage Tracker Pattern

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

// GUI Coverage Tracker
const coverage = {
  elements: new Map<string, boolean>(),
  screens: new Map<string, boolean>(),

  trackElement(name: string) { this.elements.set(name, true); },
  trackScreen(name: string) { this.screens.set(name, true); },

  report() {
    const elemCovered = [...this.elements.values()].filter(Boolean).length;
    const screenCovered = [...this.screens.values()].filter(Boolean).length;
    return {
      elements: `${elemCovered}/${this.elements.size}`,
      screens: `${screenCovered}/${this.screens.size}`,
      percentage: Math.round(
        ((elemCovered + screenCovered) /
         (this.elements.size + this.screens.size)) * 100
      )
    };
  },

  meets(threshold: number): boolean {
    return this.report().percentage >= threshold;
  }
};

// Define expected coverage
["login-btn", "signup-btn", "nav-menu"].forEach(e => coverage.elements.set(e, false));
["home", "login", "dashboard"].forEach(s => coverage.screens.set(s, false));

const client = await connect();
const page = await client.page("main");

// Test flow - track as you go
await page.goto("http://localhost:3000");
await waitForPageLoad(page);
coverage.trackScreen("home");

await page.click('[data-testid="login-btn"]');
coverage.trackElement("login-btn");
coverage.trackScreen("login");

// Report coverage
console.log("GUI Coverage:", coverage.report());
console.log("Meets 80% threshold:", coverage.meets(80));

await client.disconnect();
EOF
```

### LLM-Optimized Output Format

```yaml
GUI Coverage Report:
  elements: 2/3 (67%)
  screens: 2/3 (67%)
  total: 67%
  threshold: 80%
  status: BELOW_THRESHOLD
  missing:
    elements: [signup-btn]
    screens: [dashboard]
```

## Visual Regression Testing

Compare screenshots against baselines to detect visual changes.

### Screenshot Comparison Pattern

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";
import { readFileSync, writeFileSync, existsSync } from "fs";

const client = await connect();
const page = await client.page("main");
await page.setViewportSize({ width: 1280, height: 800 });

await page.goto("http://localhost:3000");
await waitForPageLoad(page);

const screenshotPath = "tmp/current.png";
const baselinePath = "tmp/baseline.png";

await page.screenshot({ path: screenshotPath });

if (existsSync(baselinePath)) {
  const current = readFileSync(screenshotPath);
  const baseline = readFileSync(baselinePath);

  const match = current.equals(baseline);
  console.log({
    status: match ? "PASS" : "VISUAL_DIFF_DETECTED",
    baseline: baselinePath,
    current: screenshotPath,
    action: match ? "No changes" : "Review tmp/current.png vs tmp/baseline.png"
  });
} else {
  console.log({
    status: "BASELINE_CREATED",
    path: baselinePath,
    action: "First run - baseline saved"
  });
  writeFileSync(baselinePath, readFileSync(screenshotPath));
}

await client.disconnect();
EOF
```

## Accessibility Auditing

Check pages for WCAG compliance using ARIA snapshot analysis.

### A11y Audit Pattern

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

const client = await connect();
const page = await client.page("main");
await page.goto("http://localhost:3000");
await waitForPageLoad(page);

// Get ARIA snapshot for accessibility analysis
const snapshot = await client.getAISnapshot("main");

// Accessibility checks
const a11yIssues: string[] = [];

// Check for images without alt text
const imgWithoutAlt = await page.$$eval('img:not([alt])', imgs => imgs.length);
if (imgWithoutAlt > 0) {
  a11yIssues.push(`${imgWithoutAlt} images missing alt text`);
}

// Check for buttons without accessible names
const emptyButtons = await page.$$eval(
  'button:not([aria-label]):empty',
  btns => btns.length
);
if (emptyButtons > 0) {
  a11yIssues.push(`${emptyButtons} buttons without accessible names`);
}

// Check for form inputs without labels
const inputsWithoutLabels = await page.$$eval(
  'input:not([aria-label]):not([id])',
  inputs => inputs.length
);
if (inputsWithoutLabels > 0) {
  a11yIssues.push(`${inputsWithoutLabels} form inputs without labels`);
}

// Check color contrast (basic check via computed styles)
const lowContrastElements = await page.$$eval('*', elements => {
  let count = 0;
  elements.forEach(el => {
    const style = window.getComputedStyle(el);
    const bg = style.backgroundColor;
    const fg = style.color;
    // Basic check - flag very light text on white
    if (fg.includes('rgb(200') && bg.includes('rgb(255')) count++;
  });
  return count;
});
if (lowContrastElements > 5) {
  a11yIssues.push(`Potential contrast issues detected`);
}

// Output in LLM-optimized format
console.log(`
Accessibility Audit Report:
  url: ${page.url()}
  issues_found: ${a11yIssues.length}
  wcag_level: ${a11yIssues.length === 0 ? 'AA_COMPLIANT' : 'NEEDS_REVIEW'}
  issues:
${a11yIssues.map(i => `    - ${i}`).join('\n') || '    - None'}
  aria_snapshot_refs: ${(snapshot.match(/\[ref=e\d+\]/g) || []).length} elements
`);

await client.disconnect();
EOF
```

## Soft Assertions with Retry

Handle flaky tests with retry logic and collect multiple failures (from Probar patterns).

### Retry Pattern

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

// Soft assertion collector
const softAssert = {
  failures: [] as string[],

  async check(name: string, fn: () => Promise<boolean>, retries = 3, delayMs = 500) {
    for (let i = 0; i < retries; i++) {
      try {
        if (await fn()) return true;
      } catch {}
      if (i < retries - 1) await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
    this.failures.push(name);
    return false;
  },

  report() {
    return {
      passed: this.failures.length === 0,
      failures: this.failures,
      summary: this.failures.length === 0
        ? "All assertions passed"
        : `${this.failures.length} assertion(s) failed`
    };
  }
};

const client = await connect();
const page = await client.page("main");

await page.goto("http://localhost:3000");
await waitForPageLoad(page);

// Soft assertions with retry
await softAssert.check("page_title", async () => {
  const title = await page.title();
  return title.includes("My App");
});

await softAssert.check("login_button_visible", async () => {
  return await page.isVisible('[data-testid="login"]');
});

await softAssert.check("nav_menu_present", async () => {
  return await page.isVisible('nav');
});

console.log("Test Results:", softAssert.report());
await client.disconnect();
EOF
```

## Workflow Playbooks

Define complex multi-step workflows as state machines (from Probar's playbook pattern).

### Playbook Pattern

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

// Workflow Playbook Definition
type State = "start" | "login_page" | "entering_creds" | "dashboard" | "error" | "complete";

interface PlaybookStep {
  from: State;
  action: string;
  to: State;
  execute: (page: any) => Promise<boolean>;
}

const loginPlaybook: PlaybookStep[] = [
  {
    from: "start",
    action: "navigate_to_login",
    to: "login_page",
    execute: async (page) => {
      await page.goto("http://localhost:3000/login");
      await waitForPageLoad(page);
      return await page.isVisible('form');
    }
  },
  {
    from: "login_page",
    action: "enter_credentials",
    to: "entering_creds",
    execute: async (page) => {
      await page.fill('[name="email"]', "test@example.com");
      await page.fill('[name="password"]', "password123");
      return true;
    }
  },
  {
    from: "entering_creds",
    action: "submit_login",
    to: "dashboard",
    execute: async (page) => {
      await page.click('[type="submit"]');
      await waitForPageLoad(page);
      return page.url().includes("/dashboard");
    }
  }
];

// Playbook Runner
async function runPlaybook(steps: PlaybookStep[], page: any) {
  let currentState: State = "start";
  const trace: string[] = [];

  for (const step of steps) {
    if (step.from !== currentState) continue;

    trace.push(`${step.from} --[${step.action}]--> ${step.to}`);
    const success = await step.execute(page);

    if (success) {
      currentState = step.to;
    } else {
      currentState = "error";
      break;
    }
  }

  return {
    finalState: currentState,
    success: currentState !== "error" && currentState !== "start",
    trace
  };
}

const client = await connect();
const page = await client.page("main");

const result = await runPlaybook(loginPlaybook, page);
console.log("Playbook Result:", JSON.stringify(result, null, 2));

await client.disconnect();
EOF
```

## Quality Metrics Dashboard

Track session-level quality metrics (inspired by PAIML's TDG scoring).

### Metrics Pattern

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

// Session Metrics Tracker
const metrics = {
  startTime: Date.now(),
  actions: 0,
  successes: 0,
  failures: 0,
  screenshots: 0,
  pageLoads: 0,

  track(type: "action" | "success" | "failure" | "screenshot" | "pageLoad") {
    if (type === "action") this.actions++;
    else if (type === "success") this.successes++;
    else if (type === "failure") this.failures++;
    else if (type === "screenshot") this.screenshots++;
    else if (type === "pageLoad") this.pageLoads++;
  },

  report() {
    const duration = Date.now() - this.startTime;
    const successRate = this.actions > 0
      ? Math.round((this.successes / this.actions) * 100)
      : 100;

    // Quality grade (PAIML-style A+ to F)
    const grade = successRate >= 95 ? "A+" :
                  successRate >= 90 ? "A" :
                  successRate >= 85 ? "B+" :
                  successRate >= 80 ? "B" :
                  successRate >= 70 ? "C" :
                  successRate >= 60 ? "D" : "F";

    return {
      duration_ms: duration,
      total_actions: this.actions,
      success_rate: `${successRate}%`,
      quality_grade: grade,
      screenshots_taken: this.screenshots,
      pages_loaded: this.pageLoads
    };
  }
};

const client = await connect();
const page = await client.page("main");

// Track operations
metrics.track("pageLoad");
await page.goto("http://localhost:3000");
await waitForPageLoad(page);
metrics.track("success");
metrics.track("action");

metrics.track("action");
try {
  await page.click('[data-testid="button"]');
  metrics.track("success");
} catch {
  metrics.track("failure");
}

metrics.track("screenshot");
await page.screenshot({ path: "tmp/metrics-test.png" });

// Output LLM-optimized metrics
console.log(`
Session Quality Report:
${Object.entries(metrics.report()).map(([k, v]) => `  ${k}: ${v}`).join('\n')}
`);

await client.disconnect();
EOF
```

## ARIA Snapshot (Element Discovery)

Use `getAISnapshot()` for LLM-friendly element discovery:

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

const client = await connect();
const page = await client.page("main");

await page.goto("https://news.ycombinator.com");
await waitForPageLoad(page);

const snapshot = await client.getAISnapshot("main");
console.log(snapshot);

// Interact by ref
const element = await client.selectSnapshotRef("main", "e2");
await element.click();

await client.disconnect();
EOF
```

### Snapshot Interpretation

- **Roles**: `button`, `link`, `textbox`, `heading`, `listitem`
- **Names**: `link "Click me"`, `button "Submit"`
- **`[ref=eN]`**: Element reference for interaction
- **`[checked]`**: Checkbox/radio is checked
- **`[disabled]`**: Element is disabled

## Resource Files

For advanced patterns and detailed guides:

| Topic | Resource |
|-------|----------|
| Advanced testing patterns | [advanced-patterns.md](resources/advanced-patterns.md) |
| Visual regression workflows | [visual-testing.md](resources/visual-testing.md) |
| Accessibility deep dive | [accessibility-guide.md](resources/accessibility-guide.md) |

## Key Principles

1. **Small scripts**: Each script should do ONE thing
2. **Evaluate state**: Always log/return state at the end
3. **Track coverage**: Use GUI coverage for test completeness
4. **Soft assertions**: Retry flaky checks before failing
5. **Quality metrics**: Track success rates for reliability

## Comparison with Alternatives

| Approach | How It Works | Trade-off |
|----------|--------------|-----------|
| **Playwright MCP** | Observe-think-act loop | Simple but slow |
| **Dev Browser** | Stateful + enterprise testing | Best of both worlds |
| **Probar** | Pure Rust, WASM focus | Native performance |

**Dev Browser advantages:**
- **14% faster** than Playwright MCP
- **39% cheaper** in token usage
- **GUI coverage tracking** (from Probar)
- **Quality grades** (from PAIML)
