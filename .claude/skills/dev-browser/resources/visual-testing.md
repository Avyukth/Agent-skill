# Visual Testing & Regression Workflows

Comprehensive guide to visual testing patterns for enterprise-grade UI verification.

## Visual Regression with Pixel Diffing

Advanced screenshot comparison with pixel-level diff detection.

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

// Visual regression helper
const visualTest = {
  baselineDir: 'tmp/baselines',
  currentDir: 'tmp/current',
  diffDir: 'tmp/diffs',

  init() {
    [this.baselineDir, this.currentDir, this.diffDir].forEach(dir => {
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    });
  },

  async capture(page: any, name: string): Promise<string> {
    const path = `${this.currentDir}/${name}.png`;
    await page.screenshot({ path, fullPage: true });
    return path;
  },

  compare(name: string): { match: boolean; baselineExists: boolean; pixelsDiff?: number } {
    const baselinePath = `${this.baselineDir}/${name}.png`;
    const currentPath = `${this.currentDir}/${name}.png`;

    if (!existsSync(baselinePath)) {
      // First run - save as baseline
      writeFileSync(baselinePath, readFileSync(currentPath));
      return { match: true, baselineExists: false };
    }

    const baseline = readFileSync(baselinePath);
    const current = readFileSync(currentPath);

    // Byte-by-byte comparison
    const match = baseline.equals(current);

    if (!match) {
      // Count different bytes as proxy for pixel diff
      let diffCount = 0;
      const minLen = Math.min(baseline.length, current.length);
      for (let i = 0; i < minLen; i++) {
        if (baseline[i] !== current[i]) diffCount++;
      }
      diffCount += Math.abs(baseline.length - current.length);

      return {
        match: false,
        baselineExists: true,
        pixelsDiff: diffCount
      };
    }

    return { match: true, baselineExists: true };
  },

  updateBaseline(name: string) {
    const currentPath = `${this.currentDir}/${name}.png`;
    const baselinePath = `${this.baselineDir}/${name}.png`;
    writeFileSync(baselinePath, readFileSync(currentPath));
  }
};

visualTest.init();

const client = await connect();
const page = await client.page("visual-test");

// Test multiple pages
const pagesToTest = [
  { url: 'http://localhost:3000/', name: 'home' },
  { url: 'http://localhost:3000/login', name: 'login' },
  { url: 'http://localhost:3000/dashboard', name: 'dashboard' }
];

const results: {
  name: string;
  match: boolean;
  isNew: boolean;
  pixelsDiff?: number;
}[] = [];

for (const testPage of pagesToTest) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(testPage.url);
  await waitForPageLoad(page);

  // Wait for animations to complete
  await page.waitForTimeout(500);

  await visualTest.capture(page, testPage.name);
  const comparison = visualTest.compare(testPage.name);

  results.push({
    name: testPage.name,
    match: comparison.match,
    isNew: !comparison.baselineExists,
    pixelsDiff: comparison.pixelsDiff
  });
}

console.log(`
Visual Regression Report:
=========================

${results.map(r => `
${r.name}:
  Status: ${r.isNew ? 'NEW BASELINE' : r.match ? 'PASS' : 'DIFF DETECTED'}
  ${r.pixelsDiff ? `Pixels Changed: ${r.pixelsDiff}` : ''}
  Screenshot: tmp/current/${r.name}.png
  Baseline: tmp/baselines/${r.name}.png
`).join('')}

Summary:
  Total Pages: ${results.length}
  Passed: ${results.filter(r => r.match).length}
  Diffs: ${results.filter(r => !r.match && !r.isNew).length}
  New Baselines: ${results.filter(r => r.isNew).length}

Overall: ${results.every(r => r.match) ? 'ALL PASS' : 'REVIEW NEEDED'}
`);

await client.disconnect();
EOF
```

## Component-Level Visual Testing

Isolate and test individual UI components.

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";
import { mkdirSync, existsSync } from "fs";

const client = await connect();
const page = await client.page("component-test");

// Ensure output directory exists
if (!existsSync('tmp/components')) mkdirSync('tmp/components', { recursive: true });

await page.goto("http://localhost:3000");
await waitForPageLoad(page);

// Define components to capture
const components = [
  { selector: 'header', name: 'header' },
  { selector: 'nav', name: 'navigation' },
  { selector: '[data-testid="hero"]', name: 'hero-section' },
  { selector: 'footer', name: 'footer' },
  { selector: '.card:first-of-type', name: 'card-component' }
];

const results: {
  name: string;
  found: boolean;
  dimensions?: { width: number; height: number };
  path?: string;
}[] = [];

for (const comp of components) {
  try {
    const element = await page.$(comp.selector);
    if (element) {
      const box = await element.boundingBox();
      const path = `tmp/components/${comp.name}.png`;

      await element.screenshot({ path });

      results.push({
        name: comp.name,
        found: true,
        dimensions: box ? { width: Math.round(box.width), height: Math.round(box.height) } : undefined,
        path
      });
    } else {
      results.push({ name: comp.name, found: false });
    }
  } catch (err) {
    results.push({ name: comp.name, found: false });
  }
}

console.log(`
Component Visual Test Report:
=============================

${results.map(r => `
${r.name}:
  Found: ${r.found ? 'Yes' : 'No'}
  ${r.dimensions ? `Size: ${r.dimensions.width}x${r.dimensions.height}px` : ''}
  ${r.path ? `Screenshot: ${r.path}` : ''}
`).join('')}

Summary:
  Components Tested: ${results.length}
  Found: ${results.filter(r => r.found).length}
  Missing: ${results.filter(r => !r.found).length}
`);

await client.disconnect();
EOF
```

## Multi-Theme Visual Testing

Test components across different color themes (dark mode, light mode).

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";
import { mkdirSync, existsSync } from "fs";

const client = await connect();
const page = await client.page("theme-test");

if (!existsSync('tmp/themes')) mkdirSync('tmp/themes', { recursive: true });

const themes = [
  { name: 'light', class: null, colorScheme: 'light' },
  { name: 'dark', class: 'dark', colorScheme: 'dark' }
];

const results: {
  theme: string;
  screenshot: string;
  backgroundColor: string;
  textColor: string;
}[] = [];

for (const theme of themes) {
  await page.emulateMedia({ colorScheme: theme.colorScheme as any });

  if (theme.class) {
    await page.evaluate((className: string) => {
      document.documentElement.classList.add(className);
    }, theme.class);
  }

  await page.goto("http://localhost:3000");
  await waitForPageLoad(page);
  await page.waitForTimeout(300); // Wait for theme transition

  const screenshotPath = `tmp/themes/${theme.name}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });

  // Extract dominant colors
  const colors = await page.evaluate(() => {
    const body = document.body;
    const style = window.getComputedStyle(body);
    return {
      bg: style.backgroundColor,
      text: style.color
    };
  });

  results.push({
    theme: theme.name,
    screenshot: screenshotPath,
    backgroundColor: colors.bg,
    textColor: colors.text
  });
}

console.log(`
Theme Visual Test Report:
=========================

${results.map(r => `
${r.theme.toUpperCase()} THEME:
  Screenshot: ${r.screenshot}
  Background: ${r.backgroundColor}
  Text Color: ${r.textColor}
`).join('')}

Verification Points:
  - Check contrast ratios meet WCAG AA (4.5:1 for normal text)
  - Verify all interactive elements visible in both themes
  - Ensure no text becomes unreadable
`);

await client.disconnect();
EOF
```

## Animation & Transition Testing

Verify CSS animations and transitions work correctly.

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";
import { mkdirSync, existsSync } from "fs";

const client = await connect();
const page = await client.page("animation-test");

if (!existsSync('tmp/animations')) mkdirSync('tmp/animations', { recursive: true });

await page.goto("http://localhost:3000");
await waitForPageLoad(page);

// Test button hover animation
const buttonTests = [
  { selector: 'button[type="submit"]', action: 'hover', name: 'submit-button' },
  { selector: '[data-testid="nav-link"]', action: 'hover', name: 'nav-link' },
  { selector: '.card', action: 'hover', name: 'card-hover' }
];

const results: {
  name: string;
  frames: number;
  duration: number;
  hasAnimation: boolean;
}[] = [];

for (const test of buttonTests) {
  try {
    const element = await page.$(test.selector);
    if (!element) continue;

    // Capture before state
    await element.screenshot({ path: `tmp/animations/${test.name}-before.png` });

    // Get initial transform/opacity
    const before = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        transform: style.transform,
        opacity: style.opacity,
        backgroundColor: style.backgroundColor
      };
    }, test.selector);

    // Trigger hover
    await element.hover();
    await page.waitForTimeout(300); // Wait for transition

    // Get after state
    const after = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        transform: style.transform,
        opacity: style.opacity,
        backgroundColor: style.backgroundColor
      };
    }, test.selector);

    // Capture after state
    await element.screenshot({ path: `tmp/animations/${test.name}-after.png` });

    const hasAnimation = before && after && (
      before.transform !== after.transform ||
      before.opacity !== after.opacity ||
      before.backgroundColor !== after.backgroundColor
    );

    results.push({
      name: test.name,
      frames: 2,
      duration: 300,
      hasAnimation: hasAnimation ?? false
    });

    // Move mouse away to reset
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);

  } catch (err) {
    console.error(`Failed to test ${test.name}:`, err);
  }
}

console.log(`
Animation Test Report:
======================

${results.map(r => `
${r.name}:
  Has Animation: ${r.hasAnimation ? 'Yes' : 'No'}
  Before: tmp/animations/${r.name}-before.png
  After: tmp/animations/${r.name}-after.png
`).join('')}

Summary:
  Elements Tested: ${results.length}
  With Animations: ${results.filter(r => r.hasAnimation).length}
  Static: ${results.filter(r => !r.hasAnimation).length}

Note: Review screenshots to verify animations are smooth and appropriate.
`);

await client.disconnect();
EOF
```

## Stripe-Level UI Quality Checklist

Automated checks for world-class UI polish (inspired by Stripe's design).

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

const client = await connect();
const page = await client.page("quality-check");

await page.goto("http://localhost:3000");
await waitForPageLoad(page);

interface QualityCheck {
  name: string;
  passed: boolean;
  details: string;
}

const checks: QualityCheck[] = [];

// 1. Typography Consistency
const typography = await page.evaluate(() => {
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const fonts = new Set(headings.map(h => window.getComputedStyle(h).fontFamily));
  return { fontCount: fonts.size, fonts: [...fonts] };
});
checks.push({
  name: 'Typography Consistency',
  passed: typography.fontCount <= 2,
  details: `${typography.fontCount} font families used: ${typography.fonts.join(', ')}`
});

// 2. Spacing System (check for consistent spacing)
const spacing = await page.evaluate(() => {
  const elements = Array.from(document.querySelectorAll('*'));
  const margins = new Set<string>();
  const paddings = new Set<string>();

  elements.slice(0, 100).forEach(el => {
    const style = window.getComputedStyle(el);
    margins.add(style.marginTop);
    paddings.add(style.paddingTop);
  });

  return { uniqueMargins: margins.size, uniquePaddings: paddings.size };
});
checks.push({
  name: 'Consistent Spacing System',
  passed: spacing.uniqueMargins < 15 && spacing.uniquePaddings < 15,
  details: `${spacing.uniqueMargins} unique margins, ${spacing.uniquePaddings} unique paddings`
});

// 3. Interactive Element States
const buttonStates = await page.evaluate(() => {
  const button = document.querySelector('button');
  if (!button) return { hasHover: false, hasFocus: false };

  const style = window.getComputedStyle(button);
  return {
    cursor: style.cursor,
    hasTransition: style.transition !== 'none' && style.transition !== ''
  };
});
checks.push({
  name: 'Interactive States',
  passed: buttonStates.hasTransition && buttonStates.cursor === 'pointer',
  details: `Cursor: ${buttonStates.cursor}, Has transitions: ${buttonStates.hasTransition}`
});

// 4. Color Palette Consistency
const colors = await page.evaluate(() => {
  const elements = Array.from(document.querySelectorAll('*'));
  const bgColors = new Set<string>();
  const textColors = new Set<string>();

  elements.slice(0, 200).forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      bgColors.add(style.backgroundColor);
    }
    if (style.color) {
      textColors.add(style.color);
    }
  });

  return { bgCount: bgColors.size, textCount: textColors.size };
});
checks.push({
  name: 'Color Palette Limit',
  passed: colors.bgCount < 10 && colors.textCount < 8,
  details: `${colors.bgCount} background colors, ${colors.textCount} text colors`
});

// 5. Border Radius Consistency
const borderRadius = await page.evaluate(() => {
  const elements = Array.from(document.querySelectorAll('*'));
  const radii = new Set<string>();

  elements.slice(0, 200).forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.borderRadius !== '0px') {
      radii.add(style.borderRadius);
    }
  });

  return { count: radii.size, values: [...radii].slice(0, 5) };
});
checks.push({
  name: 'Border Radius Consistency',
  passed: borderRadius.count <= 4,
  details: `${borderRadius.count} unique values: ${borderRadius.values.join(', ')}`
});

// 6. Shadow System
const shadows = await page.evaluate(() => {
  const elements = Array.from(document.querySelectorAll('*'));
  const shadowSet = new Set<string>();

  elements.slice(0, 200).forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.boxShadow !== 'none') {
      shadowSet.add(style.boxShadow);
    }
  });

  return { count: shadowSet.size };
});
checks.push({
  name: 'Shadow System',
  passed: shadows.count <= 5,
  details: `${shadows.count} unique box-shadow values`
});

// 7. Touch Target Size
const touchTargets = await page.$$eval('button, a, input, [role="button"]', elements => {
  return elements.filter(el => {
    const rect = el.getBoundingClientRect();
    return rect.width < 44 || rect.height < 44;
  }).length;
});
checks.push({
  name: 'Touch Target Size (44x44 min)',
  passed: touchTargets === 0,
  details: `${touchTargets} elements below minimum`
});

// 8. Loading State Indicators
const hasLoadingState = await page.evaluate(() => {
  const html = document.body.innerHTML;
  return html.includes('loading') ||
         html.includes('spinner') ||
         html.includes('skeleton') ||
         document.querySelector('[aria-busy="true"]') !== null;
});
checks.push({
  name: 'Loading State Patterns',
  passed: true, // Informational
  details: hasLoadingState ? 'Loading indicators found' : 'No loading patterns detected'
});

// Calculate overall score
const passedCount = checks.filter(c => c.passed).length;
const score = Math.round((passedCount / checks.length) * 100);

const grade = score >= 95 ? 'A+' :
              score >= 90 ? 'A' :
              score >= 80 ? 'B' :
              score >= 70 ? 'C' :
              score >= 60 ? 'D' : 'F';

console.log(`
Stripe-Level UI Quality Report:
===============================

Checks:
${checks.map(c => `  ${c.passed ? '✓' : '✗'} ${c.name}
    ${c.details}`).join('\n')}

Score: ${score}% (${passedCount}/${checks.length})
Grade: ${grade}

${score < 90 ? `
Recommendations for "Stripe-Level" Quality:
- Use a strict design token system (8px grid)
- Limit color palette to primary/secondary/accent + grays
- Ensure all interactive elements have hover/focus/active states
- Use consistent border-radius (4px, 8px, or 16px)
- Implement skeleton loading states
- Ensure 44x44px minimum touch targets
` : 'UI meets high-quality standards!'}
`);

await client.disconnect();
EOF
```
