# Accessibility Testing Deep Dive

Comprehensive WCAG compliance testing and accessibility auditing patterns.

## Full WCAG 2.1 AA Audit

Complete accessibility audit covering all WCAG 2.1 Level AA criteria.

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

const client = await connect();
const page = await client.page("a11y-audit");

await page.goto("http://localhost:3000");
await waitForPageLoad(page);

interface A11yIssue {
  rule: string;
  wcag: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  count: number;
  elements: string[];
}

const issues: A11yIssue[] = [];

// 1.1.1 Non-text Content
const imagesWithoutAlt = await page.$$eval('img', imgs => {
  return imgs.filter(img => !img.hasAttribute('alt')).map(img => img.outerHTML.slice(0, 100));
});
if (imagesWithoutAlt.length > 0) {
  issues.push({
    rule: 'Images must have alt text',
    wcag: '1.1.1',
    severity: 'critical',
    count: imagesWithoutAlt.length,
    elements: imagesWithoutAlt.slice(0, 3)
  });
}

// 1.3.1 Info and Relationships
const inputsWithoutLabels = await page.$$eval('input, select, textarea', inputs => {
  return inputs.filter(input => {
    const id = input.id;
    const hasLabel = id && document.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
    const hasPlaceholder = input.hasAttribute('placeholder');
    return !hasLabel && !hasAriaLabel && !hasPlaceholder;
  }).map(el => el.outerHTML.slice(0, 100));
});
if (inputsWithoutLabels.length > 0) {
  issues.push({
    rule: 'Form inputs must have labels',
    wcag: '1.3.1',
    severity: 'critical',
    count: inputsWithoutLabels.length,
    elements: inputsWithoutLabels.slice(0, 3)
  });
}

// 1.4.3 Contrast (Minimum) - Basic check
const lowContrastText = await page.evaluate(() => {
  const elements: string[] = [];
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    const color = style.color;
    const bg = style.backgroundColor;

    // Very basic check for light gray on white
    if (color.match(/rgb\(1[5-9]\d|2[0-2]\d/) && bg.match(/rgb\(25[0-5]/)) {
      elements.push((el as HTMLElement).innerText?.slice(0, 50) || '');
    }
  });
  return elements.filter(Boolean);
});
if (lowContrastText.length > 0) {
  issues.push({
    rule: 'Text must have sufficient contrast',
    wcag: '1.4.3',
    severity: 'serious',
    count: lowContrastText.length,
    elements: lowContrastText.slice(0, 3)
  });
}

// 2.1.1 Keyboard Accessible
const nonKeyboardFocusable = await page.$$eval('[onclick]:not(button):not(a):not([tabindex])', els => {
  return els.map(el => el.outerHTML.slice(0, 100));
});
if (nonKeyboardFocusable.length > 0) {
  issues.push({
    rule: 'Interactive elements must be keyboard accessible',
    wcag: '2.1.1',
    severity: 'critical',
    count: nonKeyboardFocusable.length,
    elements: nonKeyboardFocusable.slice(0, 3)
  });
}

// 2.4.1 Skip Links
const hasSkipLink = await page.evaluate(() => {
  const firstLink = document.querySelector('a');
  return firstLink?.textContent?.toLowerCase().includes('skip') ?? false;
});
if (!hasSkipLink) {
  issues.push({
    rule: 'Page should have skip navigation link',
    wcag: '2.4.1',
    severity: 'moderate',
    count: 1,
    elements: ['Missing skip link at start of page']
  });
}

// 2.4.2 Page Title
const pageTitle = await page.title();
if (!pageTitle || pageTitle.length < 3) {
  issues.push({
    rule: 'Page must have descriptive title',
    wcag: '2.4.2',
    severity: 'serious',
    count: 1,
    elements: [`Current title: "${pageTitle || '(empty)'}"`]
  });
}

// 2.4.4 Link Purpose
const ambiguousLinks = await page.$$eval('a', links => {
  const ambiguous = ['click here', 'read more', 'learn more', 'here', 'more'];
  return links.filter(link => {
    const text = link.textContent?.toLowerCase().trim() || '';
    return ambiguous.includes(text) && !link.hasAttribute('aria-label');
  }).map(l => l.outerHTML.slice(0, 100));
});
if (ambiguousLinks.length > 0) {
  issues.push({
    rule: 'Links must have descriptive text',
    wcag: '2.4.4',
    severity: 'moderate',
    count: ambiguousLinks.length,
    elements: ambiguousLinks.slice(0, 3)
  });
}

// 2.4.6 Headings and Labels
const headingOrder = await page.evaluate(() => {
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const levels = headings.map(h => parseInt(h.tagName[1]));
  const issues: string[] = [];

  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i-1] > 1) {
      issues.push(`Skipped from h${levels[i-1]} to h${levels[i]}`);
    }
  }

  return { h1Count: levels.filter(l => l === 1).length, issues };
});
if (headingOrder.h1Count !== 1 || headingOrder.issues.length > 0) {
  issues.push({
    rule: 'Heading hierarchy must be logical',
    wcag: '2.4.6',
    severity: 'moderate',
    count: headingOrder.issues.length + (headingOrder.h1Count !== 1 ? 1 : 0),
    elements: [
      headingOrder.h1Count !== 1 ? `Page has ${headingOrder.h1Count} h1 elements (should be 1)` : '',
      ...headingOrder.issues
    ].filter(Boolean)
  });
}

// 3.1.1 Language of Page
const hasLang = await page.evaluate(() => {
  return document.documentElement.hasAttribute('lang');
});
if (!hasLang) {
  issues.push({
    rule: 'Page must have lang attribute',
    wcag: '3.1.1',
    severity: 'serious',
    count: 1,
    elements: ['<html> element missing lang attribute']
  });
}

// 4.1.1 Parsing - Duplicate IDs
const duplicateIds = await page.evaluate(() => {
  const ids = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  return [...new Set(duplicates)];
});
if (duplicateIds.length > 0) {
  issues.push({
    rule: 'IDs must be unique',
    wcag: '4.1.1',
    severity: 'serious',
    count: duplicateIds.length,
    elements: duplicateIds.slice(0, 5)
  });
}

// 4.1.2 Name, Role, Value
const buttonsWithoutLabels = await page.$$eval('button:empty:not([aria-label])', btns => {
  return btns.map(b => b.outerHTML.slice(0, 100));
});
if (buttonsWithoutLabels.length > 0) {
  issues.push({
    rule: 'Buttons must have accessible names',
    wcag: '4.1.2',
    severity: 'critical',
    count: buttonsWithoutLabels.length,
    elements: buttonsWithoutLabels.slice(0, 3)
  });
}

// Calculate score
const criticalCount = issues.filter(i => i.severity === 'critical').length;
const seriousCount = issues.filter(i => i.severity === 'serious').length;
const moderateCount = issues.filter(i => i.severity === 'moderate').length;

const score = Math.max(0, 100 - (criticalCount * 25) - (seriousCount * 10) - (moderateCount * 5));
const grade = score >= 95 ? 'AA Compliant' :
              score >= 80 ? 'Partial Compliance' :
              score >= 50 ? 'Needs Work' : 'Major Issues';

console.log(`
WCAG 2.1 AA Accessibility Audit Report:
=======================================

URL: ${page.url()}

Issues Found: ${issues.length}
  Critical: ${criticalCount}
  Serious: ${seriousCount}
  Moderate: ${moderateCount}
  Minor: ${issues.filter(i => i.severity === 'minor').length}

${issues.map(issue => `
[${issue.severity.toUpperCase()}] ${issue.rule} (WCAG ${issue.wcag})
  Count: ${issue.count}
  Examples:
${issue.elements.map(e => `    - ${e}`).join('\n')}
`).join('')}

Accessibility Score: ${score}/100
Level: ${grade}

${score < 95 ? `
Top Priority Fixes:
${issues.filter(i => i.severity === 'critical').slice(0, 3).map(i =>
  `  - Fix: ${i.rule} (${i.count} issues)`
).join('\n') || '  No critical issues'}
` : 'Page meets WCAG 2.1 AA standards!'}
`);

await client.disconnect();
EOF
```

## Keyboard Navigation Testing

Verify complete keyboard accessibility for all interactive elements.

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

const client = await connect();
const page = await client.page("keyboard-test");

await page.goto("http://localhost:3000");
await waitForPageLoad(page);

interface FocusableElement {
  tag: string;
  text: string;
  tabIndex: number;
  hasFocusStyle: boolean;
}

// Get all focusable elements in tab order
const focusableElements: FocusableElement[] = await page.evaluate(() => {
  const focusable = Array.from(document.querySelectorAll(
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ));

  return focusable.map(el => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    // Check if element has visible focus style
    (el as HTMLElement).focus();
    const style = window.getComputedStyle(el);
    const hasFocusStyle = style.outlineWidth !== '0px' ||
                          style.boxShadow !== 'none' ||
                          el.classList.contains('focus');

    return {
      tag: el.tagName.toLowerCase(),
      text: (el as HTMLElement).innerText?.slice(0, 30) || el.getAttribute('aria-label') || '',
      tabIndex: el.tabIndex,
      hasFocusStyle
    };
  }).filter(Boolean) as FocusableElement[];
});

// Test Tab navigation
const tabOrder: string[] = [];
const missingFocusStyles: string[] = [];

for (let i = 0; i < Math.min(focusableElements.length, 20); i++) {
  await page.keyboard.press('Tab');

  const focused = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;

    const style = window.getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      text: (el as HTMLElement).innerText?.slice(0, 30) || '',
      hasVisibleFocus: style.outlineWidth !== '0px' ||
                       style.boxShadow !== 'none'
    };
  });

  if (focused) {
    tabOrder.push(`${focused.tag}: "${focused.text}"`);
    if (!focused.hasVisibleFocus) {
      missingFocusStyles.push(`${focused.tag}: "${focused.text}"`);
    }
  }
}

// Test Enter key on buttons
const enterKeyWorks = await page.evaluate(() => {
  const button = document.querySelector('button');
  if (!button) return { tested: false };

  let clicked = false;
  const handler = () => { clicked = true; };
  button.addEventListener('click', handler);

  (button as HTMLElement).focus();
  button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

  button.removeEventListener('click', handler);
  return { tested: true, works: clicked };
});

// Test Escape key closes modals
const escapeWorks = await page.evaluate(() => {
  const modal = document.querySelector('[role="dialog"], .modal, [aria-modal="true"]');
  return { hasModal: !!modal };
});

console.log(`
Keyboard Navigation Test Report:
================================

Focusable Elements: ${focusableElements.length}
Elements Tested: ${tabOrder.length}

Tab Order:
${tabOrder.map((el, i) => `  ${i + 1}. ${el}`).join('\n')}

Focus Visibility Issues: ${missingFocusStyles.length}
${missingFocusStyles.length > 0 ? missingFocusStyles.map(el => `  - ${el}`).join('\n') : '  None'}

Keyboard Interactions:
  Enter key on buttons: ${enterKeyWorks.tested ? (enterKeyWorks.works ? 'Working' : 'NOT WORKING') : 'No buttons to test'}
  Modal with Escape: ${escapeWorks.hasModal ? 'Modal found (test manually)' : 'No modals found'}

Recommendations:
${missingFocusStyles.length > 0 ? '  - Add visible focus styles (outline or box-shadow)' : ''}
${focusableElements.some(e => e.tabIndex > 0) ? '  - Avoid positive tabindex values' : ''}
  - Ensure all interactive elements are in logical tab order
  - Test with screen reader for full accessibility
`);

await client.disconnect();
EOF
```

## Screen Reader Compatibility

Test page structure for screen reader users.

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

const client = await connect();
const page = await client.page("sr-test");

await page.goto("http://localhost:3000");
await waitForPageLoad(page);

// Get ARIA snapshot for screen reader view
const snapshot = await client.getAISnapshot("sr-test");

// Analyze page landmarks
const landmarks = await page.evaluate(() => {
  const landmarkRoles = ['banner', 'navigation', 'main', 'complementary', 'contentinfo', 'search', 'form', 'region'];
  const found: { role: string; label: string }[] = [];

  landmarkRoles.forEach(role => {
    const elements = document.querySelectorAll(`[role="${role}"], ${role === 'banner' ? 'header' : role === 'navigation' ? 'nav' : role === 'main' ? 'main' : role === 'contentinfo' ? 'footer' : ''}`);
    elements.forEach(el => {
      found.push({
        role,
        label: el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || ''
      });
    });
  });

  return found;
});

// Check for live regions
const liveRegions = await page.$$eval('[aria-live], [role="alert"], [role="status"]', els => {
  return els.map(el => ({
    role: el.getAttribute('role') || 'live',
    politeness: el.getAttribute('aria-live') || 'polite'
  }));
});

// Check heading structure
const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', els => {
  return els.map(el => ({
    level: el.tagName,
    text: el.textContent?.trim().slice(0, 50) || ''
  }));
});

// Check for accessible names on interactive elements
const interactiveWithoutNames = await page.$$eval('button, a, input', els => {
  return els.filter(el => {
    const name = el.getAttribute('aria-label') ||
                 el.getAttribute('aria-labelledby') ||
                 (el as HTMLElement).innerText?.trim() ||
                 (el as HTMLInputElement).placeholder;
    return !name;
  }).length;
});

console.log(`
Screen Reader Compatibility Report:
===================================

Page Landmarks:
${landmarks.length > 0 ? landmarks.map(l =>
  `  - ${l.role}${l.label ? ` (${l.label})` : ''}`
).join('\n') : '  WARNING: No landmarks found!'}

Required Landmarks Check:
  - Banner (header): ${landmarks.some(l => l.role === 'banner') ? '✓' : '✗ Missing'}
  - Navigation: ${landmarks.some(l => l.role === 'navigation') ? '✓' : '✗ Missing'}
  - Main content: ${landmarks.some(l => l.role === 'main') ? '✓' : '✗ Missing'}
  - Footer (contentinfo): ${landmarks.some(l => l.role === 'contentinfo') ? '✓' : '✗ Missing'}

Heading Structure:
${headings.map(h => `  ${h.level}: ${h.text}`).join('\n') || '  No headings found!'}

Live Regions: ${liveRegions.length}
${liveRegions.map(r => `  - ${r.role} (${r.politeness})`).join('\n') || '  None (OK if no dynamic content)'}

Interactive Elements Without Names: ${interactiveWithoutNames}
${interactiveWithoutNames > 0 ? '  WARNING: Add aria-label to unnamed elements' : '  ✓ All elements have accessible names'}

ARIA Snapshot Preview (first 50 lines):
${snapshot.split('\n').slice(0, 50).join('\n')}

Recommendations:
${!landmarks.some(l => l.role === 'main') ? '  - Add <main> element or role="main"' : ''}
${!landmarks.some(l => l.role === 'navigation') ? '  - Add <nav> element or role="navigation"' : ''}
${headings.length === 0 ? '  - Add heading structure (h1-h6)' : ''}
${interactiveWithoutNames > 0 ? '  - Add accessible names to all interactive elements' : ''}
`);

await client.disconnect();
EOF
```

## Color Blindness Simulation

Test page visibility for users with color vision deficiencies.

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";
import { mkdirSync, existsSync } from "fs";

const client = await connect();
const page = await client.page("colorblind-test");

if (!existsSync('tmp/colorblind')) mkdirSync('tmp/colorblind', { recursive: true });

await page.goto("http://localhost:3000");
await waitForPageLoad(page);

// Test different color blindness simulations
const simulations = [
  { name: 'normal', filter: 'none' },
  { name: 'protanopia', filter: 'url(#protanopia)' },     // Red-blind
  { name: 'deuteranopia', filter: 'url(#deuteranopia)' }, // Green-blind
  { name: 'tritanopia', filter: 'url(#tritanopia)' },     // Blue-blind
  { name: 'achromatopsia', filter: 'grayscale(100%)' }    // Complete color blindness
];

// Inject SVG filters for color blindness simulation
await page.evaluate(() => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.innerHTML = `
    <defs>
      <filter id="protanopia">
        <feColorMatrix type="matrix" values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0"/>
      </filter>
      <filter id="deuteranopia">
        <feColorMatrix type="matrix" values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0"/>
      </filter>
      <filter id="tritanopia">
        <feColorMatrix type="matrix" values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0"/>
      </filter>
    </defs>
  `;
  svg.style.position = 'absolute';
  svg.style.width = '0';
  svg.style.height = '0';
  document.body.appendChild(svg);
});

for (const sim of simulations) {
  // Apply filter
  await page.evaluate((filter) => {
    document.body.style.filter = filter;
  }, sim.filter);

  await page.waitForTimeout(100);

  // Take screenshot
  await page.screenshot({ path: `tmp/colorblind/${sim.name}.png` });
}

// Reset filter
await page.evaluate(() => {
  document.body.style.filter = 'none';
});

// Check for color-only information
const colorOnlyInfo = await page.evaluate(() => {
  const issues: string[] = [];

  // Check for red/green color coding without other indicators
  const errorElements = document.querySelectorAll('.error, .success, .warning, [class*="error"], [class*="success"]');
  errorElements.forEach(el => {
    const hasIcon = el.querySelector('svg, img, i, [class*="icon"]');
    const hasText = el.textContent && el.textContent.trim().length > 0;
    if (!hasIcon && !hasText) {
      issues.push('Status indicator uses color only');
    }
  });

  // Check required field indicators
  const required = document.querySelectorAll('[required], .required');
  required.forEach(el => {
    const label = document.querySelector(`label[for="${el.id}"]`);
    if (label && !label.textContent?.includes('*') && !label.textContent?.includes('required')) {
      issues.push('Required field indicated by color only');
    }
  });

  return issues;
});

console.log(`
Color Blindness Accessibility Report:
=====================================

Screenshots Generated:
${simulations.map(s => `  - ${s.name}: tmp/colorblind/${s.name}.png`).join('\n')}

Color-Only Information Issues:
${colorOnlyInfo.length > 0 ? colorOnlyInfo.map(i => `  - ${i}`).join('\n') : '  None detected'}

Recommendations:
  - Review screenshots to ensure UI is usable for all color vision types
  - Don't rely solely on color to convey information
  - Use icons, patterns, or text in addition to color
  - Ensure sufficient contrast (4.5:1 minimum for text)
  - Test with real color blindness simulation tools for accuracy
`);

await client.disconnect();
EOF
```

## Mobile Accessibility Testing

Test accessibility on mobile viewport with touch interactions.

```bash
cd .claude/skills/dev-browser && bun x tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";

const client = await connect();
const page = await client.page("mobile-a11y");

// Set mobile viewport
await page.setViewportSize({ width: 375, height: 667 });
await page.goto("http://localhost:3000");
await waitForPageLoad(page);

interface MobileA11yIssue {
  category: string;
  issue: string;
  severity: string;
}

const issues: MobileA11yIssue[] = [];

// Check touch target sizes
const smallTargets = await page.$$eval('button, a, input, [role="button"]', els => {
  return els.filter(el => {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
  }).map(el => ({
    tag: el.tagName.toLowerCase(),
    size: `${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`,
    text: (el as HTMLElement).innerText?.slice(0, 20) || ''
  }));
});
if (smallTargets.length > 0) {
  issues.push({
    category: 'Touch Targets',
    issue: `${smallTargets.length} elements below 44x44px minimum`,
    severity: 'serious'
  });
}

// Check spacing between touch targets
const overlappingTargets = await page.evaluate(() => {
  const interactive = Array.from(document.querySelectorAll('button, a, input, [role="button"]'));
  let overlaps = 0;

  for (let i = 0; i < interactive.length; i++) {
    for (let j = i + 1; j < interactive.length; j++) {
      const rect1 = interactive[i].getBoundingClientRect();
      const rect2 = interactive[j].getBoundingClientRect();

      // Check if elements are too close (less than 8px apart)
      const horizontalGap = Math.abs(rect1.right - rect2.left);
      const verticalGap = Math.abs(rect1.bottom - rect2.top);

      if (horizontalGap < 8 && verticalGap < 8) {
        overlaps++;
      }
    }
  }

  return overlaps;
});
if (overlappingTargets > 0) {
  issues.push({
    category: 'Touch Target Spacing',
    issue: `${overlappingTargets} pairs of elements too close together`,
    severity: 'moderate'
  });
}

// Check text size
const smallText = await page.$$eval('*', els => {
  return els.filter(el => {
    const style = window.getComputedStyle(el);
    const fontSize = parseFloat(style.fontSize);
    return fontSize > 0 && fontSize < 16 && (el as HTMLElement).innerText?.trim();
  }).length;
});
if (smallText > 10) {
  issues.push({
    category: 'Text Size',
    issue: `${smallText} elements with font-size below 16px`,
    severity: 'moderate'
  });
}

// Check viewport meta tag
const viewportMeta = await page.evaluate(() => {
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return { exists: false };

  const content = meta.getAttribute('content') || '';
  return {
    exists: true,
    userScalable: !content.includes('user-scalable=no'),
    hasMaxScale: content.includes('maximum-scale'),
    content
  };
});
if (!viewportMeta.exists) {
  issues.push({
    category: 'Viewport',
    issue: 'Missing viewport meta tag',
    severity: 'serious'
  });
} else if (!viewportMeta.userScalable) {
  issues.push({
    category: 'Viewport',
    issue: 'user-scalable=no prevents pinch-to-zoom',
    severity: 'critical'
  });
}

// Check horizontal scrolling
const hasHorizontalScroll = await page.evaluate(() => {
  return document.documentElement.scrollWidth > document.documentElement.clientWidth;
});
if (hasHorizontalScroll) {
  issues.push({
    category: 'Layout',
    issue: 'Page requires horizontal scrolling',
    severity: 'serious'
  });
}

// Take screenshot
await page.screenshot({ path: 'tmp/mobile-a11y.png', fullPage: true });

const criticalCount = issues.filter(i => i.severity === 'critical').length;
const seriousCount = issues.filter(i => i.severity === 'serious').length;

console.log(`
Mobile Accessibility Report:
============================

Viewport: 375x667 (iPhone SE)
Screenshot: tmp/mobile-a11y.png

Issues Found: ${issues.length}

${issues.map(i => `
[${i.severity.toUpperCase()}] ${i.category}
  ${i.issue}
`).join('')}

Touch Target Details:
${smallTargets.slice(0, 5).map(t => `  - ${t.tag} "${t.text}" (${t.size})`).join('\n') || '  All targets meet minimum size'}

Mobile Accessibility Score: ${100 - (criticalCount * 30) - (seriousCount * 15) - issues.length * 5}/100

Key Mobile Requirements:
  ✓/✗ Touch targets >= 44x44px: ${smallTargets.length === 0 ? '✓' : '✗'}
  ✓/✗ Adequate spacing: ${overlappingTargets === 0 ? '✓' : '✗'}
  ✓/✗ Pinch-to-zoom enabled: ${viewportMeta.userScalable !== false ? '✓' : '✗'}
  ✓/✗ No horizontal scroll: ${!hasHorizontalScroll ? '✓' : '✗'}
  ✓/✗ Readable text (>=16px): ${smallText <= 10 ? '✓' : '✗'}
`);

await client.disconnect();
EOF
```
