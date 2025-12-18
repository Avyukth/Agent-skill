# Advanced Testing Patterns

Deep dive into sophisticated browser automation patterns inspired by PAIML and Probar.

## Monte Carlo Fuzzing

Generate random inputs to stress-test form handling (from Probar patterns).

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

// Monte Carlo random input generator
const fuzzer = {
  seed: 42, // Deterministic for reproducibility (PAIML pattern)

  randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let result = '';
    for (let i = 0; i < length; i++) {
      this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
      result += chars[this.seed % chars.length];
    }
    return result;
  },

  randomEmail(): string {
    return `${this.randomString(8)}@${this.randomString(5)}.com`;
  },

  randomNumber(min: number, max: number): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return min + (this.seed % (max - min + 1));
  },

  edgeCases: [
    '', // Empty
    ' ', // Whitespace
    'a'.repeat(1000), // Very long
    '<script>alert(1)</script>', // XSS attempt
    "'; DROP TABLE users; --", // SQL injection attempt
    '🎉🚀💻', // Unicode/emoji
    '\n\r\t', // Control characters
    '-1', // Negative number
    '0', // Zero
    'null', // Literal null
    'undefined', // Literal undefined
  ]
};

const client = await connect();
const page = await client.page("fuzz-test");

await page.goto("http://localhost:3000/signup");
await waitForPageLoad(page);

// Fuzz test iterations
const results: { input: string; crashed: boolean; error?: string }[] = [];

for (let i = 0; i < 20; i++) {
  const testInput = i < fuzzer.edgeCases.length
    ? fuzzer.edgeCases[i]
    : fuzzer.randomString(fuzzer.randomNumber(1, 100));

  try {
    await page.fill('[name="username"]', testInput);
    await page.fill('[name="email"]', fuzzer.randomEmail());
    await page.fill('[name="password"]', fuzzer.randomString(16));

    // Try to submit
    await page.click('[type="submit"]');
    await page.waitForTimeout(500);

    results.push({ input: testInput.slice(0, 50), crashed: false });
  } catch (err) {
    results.push({
      input: testInput.slice(0, 50),
      crashed: true,
      error: err instanceof Error ? err.message : String(err)
    });
  }

  // Reset form
  await page.goto("http://localhost:3000/signup");
  await waitForPageLoad(page);
}

console.log(`
Fuzz Testing Report:
  iterations: ${results.length}
  crashes: ${results.filter(r => r.crashed).length}
  success_rate: ${Math.round((results.filter(r => !r.crashed).length / results.length) * 100)}%

Crash Details:
${results.filter(r => r.crashed).map(r =>
  `  - Input: "${r.input}" -> ${r.error}`
).join('\n') || '  None'}
`);

await client.disconnect();
EOF
```

## Deterministic Replay

Record and replay browser sessions with seed control for reproducibility.

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";
import { writeFileSync, readFileSync, existsSync } from "fs";

interface RecordedAction {
  timestamp: number;
  action: string;
  selector?: string;
  value?: string;
  url?: string;
}

// Session Recorder
const recorder = {
  actions: [] as RecordedAction[],
  startTime: 0,

  start() {
    this.startTime = Date.now();
    this.actions = [];
  },

  record(action: string, details: Partial<RecordedAction> = {}) {
    this.actions.push({
      timestamp: Date.now() - this.startTime,
      action,
      ...details
    });
  },

  save(path: string) {
    writeFileSync(path, JSON.stringify(this.actions, null, 2));
  },

  load(path: string): RecordedAction[] {
    return JSON.parse(readFileSync(path, 'utf-8'));
  }
};

// Replay function
async function replay(page: any, actions: RecordedAction[]) {
  const results: { action: string; success: boolean; error?: string }[] = [];

  for (const action of actions) {
    try {
      switch (action.action) {
        case 'goto':
          await page.goto(action.url!);
          await waitForPageLoad(page);
          break;
        case 'click':
          await page.click(action.selector!);
          break;
        case 'fill':
          await page.fill(action.selector!, action.value!);
          break;
        case 'wait':
          await page.waitForTimeout(action.value ? parseInt(action.value) : 500);
          break;
      }
      results.push({ action: action.action, success: true });
    } catch (err) {
      results.push({
        action: action.action,
        success: false,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  return results;
}

const client = await connect();
const page = await client.page("replay-test");

const recordingPath = "tmp/session-recording.json";

if (!existsSync(recordingPath)) {
  // RECORD mode
  recorder.start();

  recorder.record('goto', { url: 'http://localhost:3000' });
  await page.goto("http://localhost:3000");
  await waitForPageLoad(page);

  recorder.record('click', { selector: '[data-testid="login"]' });
  await page.click('[data-testid="login"]');

  recorder.record('fill', { selector: '[name="email"]', value: 'test@example.com' });
  await page.fill('[name="email"]', 'test@example.com');

  recorder.save(recordingPath);
  console.log("Session recorded to:", recordingPath);
} else {
  // REPLAY mode
  const actions = recorder.load(recordingPath);
  const results = await replay(page, actions);

  console.log(`
Replay Results:
  total_actions: ${results.length}
  successful: ${results.filter(r => r.success).length}
  failed: ${results.filter(r => !r.success).length}

Details:
${results.map(r => `  ${r.success ? '✓' : '✗'} ${r.action}${r.error ? ` - ${r.error}` : ''}`).join('\n')}
`);
}

await client.disconnect();
EOF
```

## Network Request Interception

Monitor and mock API calls during browser automation.

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

const client = await connect();
const page = await client.page("network-test");

// Track all network requests
const requests: { url: string; method: string; status?: number }[] = [];

page.on('request', request => {
  requests.push({
    url: request.url(),
    method: request.method()
  });
});

page.on('response', response => {
  const req = requests.find(r => r.url === response.url());
  if (req) req.status = response.status();
});

// Optional: Mock specific endpoints
await page.route('**/api/users', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: 1, name: 'Mock User' }])
  });
});

await page.goto("http://localhost:3000");
await waitForPageLoad(page);

// Wait for any API calls
await page.waitForTimeout(2000);

// Report network activity
const apiCalls = requests.filter(r => r.url.includes('/api/'));
const failedCalls = requests.filter(r => r.status && r.status >= 400);

console.log(`
Network Activity Report:
  total_requests: ${requests.length}
  api_calls: ${apiCalls.length}
  failed_requests: ${failedCalls.length}

API Calls:
${apiCalls.map(r => `  ${r.method} ${r.url} -> ${r.status || 'pending'}`).join('\n') || '  None'}

Failed Requests:
${failedCalls.map(r => `  ${r.method} ${r.url} -> ${r.status}`).join('\n') || '  None'}
`);

await client.disconnect();
EOF
```

## Performance Profiling

Measure Core Web Vitals and page performance metrics.

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

const client = await connect();
const page = await client.page("perf-test");

// Start performance measurement
const startTime = Date.now();

await page.goto("http://localhost:3000");
await waitForPageLoad(page);

const navigationTime = Date.now() - startTime;

// Get Core Web Vitals
const metrics = await page.evaluate(() => {
  const g = globalThis as any;
  const perf = g.performance;

  // Get paint timing
  const paintEntries = perf.getEntriesByType('paint');
  const fcp = paintEntries.find((e: any) => e.name === 'first-contentful-paint');

  // Get navigation timing
  const navTiming = perf.getEntriesByType('navigation')[0] as any;

  // Approximate LCP (Largest Contentful Paint)
  let lcp = 0;
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    lcp = entries[entries.length - 1]?.startTime || 0;
  });

  return {
    // First Contentful Paint
    fcp: fcp ? Math.round(fcp.startTime) : null,
    // DOM Content Loaded
    domContentLoaded: navTiming ? Math.round(navTiming.domContentLoadedEventEnd) : null,
    // Full page load
    loadComplete: navTiming ? Math.round(navTiming.loadEventEnd) : null,
    // Time to First Byte
    ttfb: navTiming ? Math.round(navTiming.responseStart) : null,
    // DOM size
    domNodes: g.document.getElementsByTagName('*').length,
    // Resource count
    resourceCount: perf.getEntriesByType('resource').length
  };
});

// Quality grading based on Core Web Vitals
const fcpGrade = !metrics.fcp ? 'N/A' :
                 metrics.fcp < 1800 ? 'Good' :
                 metrics.fcp < 3000 ? 'Needs Improvement' : 'Poor';

const ttfbGrade = !metrics.ttfb ? 'N/A' :
                  metrics.ttfb < 800 ? 'Good' :
                  metrics.ttfb < 1800 ? 'Needs Improvement' : 'Poor';

console.log(`
Performance Report:
  url: ${page.url()}

Core Web Vitals:
  FCP (First Contentful Paint): ${metrics.fcp}ms [${fcpGrade}]
  TTFB (Time to First Byte): ${metrics.ttfb}ms [${ttfbGrade}]
  DOM Content Loaded: ${metrics.domContentLoaded}ms
  Full Load: ${metrics.loadComplete}ms

Page Stats:
  DOM Nodes: ${metrics.domNodes}
  Resources Loaded: ${metrics.resourceCount}
  Total Navigation Time: ${navigationTime}ms

Overall Grade: ${fcpGrade === 'Good' && ttfbGrade === 'Good' ? 'A' :
                fcpGrade === 'Poor' || ttfbGrade === 'Poor' ? 'C' : 'B'}
`);

await client.disconnect();
EOF
```

## Multi-Viewport Testing

Test responsive design across different screen sizes.

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'wide', width: 1920, height: 1080 }
];

const client = await connect();
const page = await client.page("viewport-test");

const results: {
  viewport: string;
  hasHorizontalScroll: boolean;
  overflowElements: number;
  touchTargets: number;
}[] = [];

for (const vp of viewports) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto("http://localhost:3000");
  await waitForPageLoad(page);

  // Check for horizontal overflow
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });

  // Count elements causing overflow
  const overflowElements = await page.$$eval('*', elements => {
    return elements.filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.right > window.innerWidth || rect.left < 0;
    }).length;
  });

  // Check touch target sizes (minimum 44x44 for accessibility)
  const touchTargets = await page.$$eval('button, a, input, [role="button"]', elements => {
    return elements.filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width < 44 || rect.height < 44;
    }).length;
  });

  // Take screenshot
  await page.screenshot({ path: `tmp/viewport-${vp.name}.png` });

  results.push({
    viewport: `${vp.name} (${vp.width}x${vp.height})`,
    hasHorizontalScroll,
    overflowElements,
    touchTargets
  });
}

console.log(`
Responsive Design Report:

${results.map(r => `
${r.viewport}:
  Horizontal Scroll: ${r.hasHorizontalScroll ? 'YES (issue)' : 'No'}
  Overflow Elements: ${r.overflowElements}
  Small Touch Targets: ${r.touchTargets}
  Screenshot: tmp/viewport-${r.viewport.split(' ')[0]}.png
`).join('')}

Summary:
  Viewports Tested: ${results.length}
  Issues Found: ${results.filter(r => r.hasHorizontalScroll || r.overflowElements > 0 || r.touchTargets > 0).length}
`);

await client.disconnect();
EOF
```

## State Machine Validation

Validate complex UI flows match expected state transitions.

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

// Define expected state machine for checkout flow
const checkoutStateMachine = {
  states: ['cart', 'shipping', 'payment', 'confirmation', 'error'],
  transitions: {
    cart: ['shipping'],
    shipping: ['cart', 'payment'],
    payment: ['shipping', 'confirmation', 'error'],
    confirmation: [],
    error: ['payment', 'cart']
  },

  isValidTransition(from: string, to: string): boolean {
    return this.transitions[from]?.includes(to) ?? false;
  }
};

// State detector based on URL/content
async function detectState(page: any): Promise<string> {
  const url = page.url();
  if (url.includes('/cart')) return 'cart';
  if (url.includes('/shipping')) return 'shipping';
  if (url.includes('/payment')) return 'payment';
  if (url.includes('/confirmation')) return 'confirmation';
  if (url.includes('/error')) return 'error';
  return 'unknown';
}

const client = await connect();
const page = await client.page("state-test");

const stateHistory: string[] = [];
const invalidTransitions: string[] = [];

// Navigate through checkout flow
await page.goto("http://localhost:3000/cart");
await waitForPageLoad(page);
stateHistory.push(await detectState(page));

// Simulate checkout steps
const actions = [
  { click: '[data-testid="proceed-to-shipping"]' },
  { click: '[data-testid="proceed-to-payment"]' },
  { click: '[data-testid="complete-order"]' }
];

for (const action of actions) {
  const prevState = stateHistory[stateHistory.length - 1];

  try {
    if (action.click) {
      await page.click(action.click);
      await waitForPageLoad(page);
    }

    const newState = await detectState(page);

    if (prevState !== 'unknown' && newState !== 'unknown') {
      if (!checkoutStateMachine.isValidTransition(prevState, newState)) {
        invalidTransitions.push(`${prevState} -> ${newState}`);
      }
    }

    stateHistory.push(newState);
  } catch (err) {
    stateHistory.push('error');
  }
}

console.log(`
State Machine Validation Report:

State History:
  ${stateHistory.join(' -> ')}

Valid Transitions: ${stateHistory.length - 1 - invalidTransitions.length}
Invalid Transitions: ${invalidTransitions.length}

${invalidTransitions.length > 0 ? `
Invalid Transition Details:
${invalidTransitions.map(t => `  - ${t}`).join('\n')}
` : ''}
Final State: ${stateHistory[stateHistory.length - 1]}
Validation: ${invalidTransitions.length === 0 ? 'PASSED' : 'FAILED'}
`);

await client.disconnect();
EOF
```
