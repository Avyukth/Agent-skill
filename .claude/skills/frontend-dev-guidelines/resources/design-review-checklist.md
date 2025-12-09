# Design Review Checklist

S-Tier SaaS design standards for frontend development. Inspired by Stripe, Airbnb, and Linear.

## Table of Contents

- [Core Design Philosophy](#core-design-philosophy)
- [Design System Foundation](#design-system-foundation)
- [Layout and Visual Hierarchy](#layout-and-visual-hierarchy)
- [Interaction Design](#interaction-design)
- [Accessibility (WCAG 2.1 AA)](#accessibility-wcag-21-aa)
- [Responsive Design](#responsive-design)
- [Design Review Process](#design-review-process)

---

## Core Design Philosophy

### Guiding Principles

| Principle | Description |
|-----------|-------------|
| **Users First** | Prioritize user needs, workflows, and ease of use in every decision |
| **Meticulous Craft** | Aim for precision, polish, and high quality in every UI element |
| **Speed & Performance** | Design for fast load times and snappy interactions |
| **Simplicity & Clarity** | Clean, uncluttered interface with unambiguous labels |
| **Focus & Efficiency** | Help users achieve goals quickly with minimal friction |
| **Consistency** | Uniform design language across the entire application |
| **Accessibility** | Design for inclusivity (WCAG AA+ compliance) |
| **Opinionated Defaults** | Reduce decision fatigue with thoughtful default workflows |

---

## Design System Foundation

### Color Palette

```typescript
// Design tokens - define in theme configuration
const palette = {
  // Primary brand color (user-specified)
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
  },
  // Neutrals (5-7 steps)
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  // Semantic colors
  success: { main: '#2e7d32' },
  error: { main: '#d32f2f' },
  warning: { main: '#ed6c02' },
  info: { main: '#0288d1' },
};
```

**Checklist:**
- [ ] Primary brand color defined and used strategically
- [ ] Neutral scale (5-7 grays) for text, backgrounds, borders
- [ ] Semantic colors for success, error, warning, info
- [ ] Dark mode palette with proper contrast
- [ ] All color combinations meet WCAG AA contrast (4.5:1 for text)

### Typography Scale

```typescript
// Typography tokens
const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif',
  h1: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 },      // 32px
  h2: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },    // 24px
  h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },   // 20px
  h4: { fontSize: '1.125rem', fontWeight: 500, lineHeight: 1.4 },  // 18px
  body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.5 },   // 16px
  body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5 }, // 14px
  caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.5 }, // 12px
};
```

**Checklist:**
- [ ] Clean, legible sans-serif font (Inter, Roboto, system-ui)
- [ ] Modular scale for headings and body text
- [ ] Limited font weights (Regular, Medium, SemiBold, Bold)
- [ ] Generous line height for readability (1.5-1.7 for body)

### Spacing System

```typescript
// 8px base unit spacing scale
const spacing = {
  0: '0',
  1: '4px',   // 0.5x
  2: '8px',   // 1x (base)
  3: '12px',  // 1.5x
  4: '16px',  // 2x
  5: '24px',  // 3x
  6: '32px',  // 4x
  7: '48px',  // 6x
  8: '64px',  // 8x
};
```

**Checklist:**
- [ ] Base unit established (8px recommended)
- [ ] All spacing uses multiples of base unit
- [ ] Consistent padding/margins throughout

### Border Radii

```typescript
const borderRadius = {
  sm: '4px',   // Inputs, buttons
  md: '8px',   // Cards, modals
  lg: '12px',  // Large cards
  full: '9999px', // Pills, avatars
};
```

---

## Layout and Visual Hierarchy

### Grid System

**Checklist:**
- [ ] Responsive grid (12-column recommended)
- [ ] Consistent layout across devices
- [ ] Strategic white space for clarity
- [ ] Consistent element alignment

### Dashboard Layout Pattern

```
┌─────────────────────────────────────────────────────────────┐
│ Top Bar: Global search, user profile, notifications         │
├─────────────┬───────────────────────────────────────────────┤
│             │                                               │
│  Sidebar    │  Content Area                                 │
│  (Nav)      │  - Module-specific UI                         │
│             │  - Responsive to viewport                     │
│             │                                               │
│             │                                               │
└─────────────┴───────────────────────────────────────────────┘
```

### Visual Hierarchy Checklist

- [ ] Typography size/weight guides attention
- [ ] Primary actions visually prominent
- [ ] Secondary actions subdued
- [ ] Consistent Z-index layering
- [ ] Proper content grouping with spacing

---

## Interaction Design

### Micro-interactions

**Checklist:**
- [ ] Immediate feedback for user actions
- [ ] Hover states on all interactive elements
- [ ] Active/pressed states visible
- [ ] Focus states for keyboard users
- [ ] Disabled states clearly indicate unavailability

### Animation Guidelines

| Property | Recommended | Avoid |
|----------|-------------|-------|
| Duration | 150-300ms | >500ms (feels slow) |
| Easing | `ease-in-out`, `cubic-bezier` | Linear (feels robotic) |
| Purpose | Enhance usability | Distract or delay |

### Loading States

```typescript
// Skeleton loading for page content
<Skeleton variant="rectangular" height={200} />
<Skeleton variant="text" width="60%" />
<Skeleton variant="text" width="80%" />

// Spinner for in-component actions
<CircularProgress size={24} />

// Progress bar for determinate progress
<LinearProgress variant="determinate" value={progress} />
```

**Checklist:**
- [ ] Skeleton screens for page loads
- [ ] Spinners for component-level actions
- [ ] Progress indicators for long operations
- [ ] Empty states designed (not just blank)
- [ ] Error states provide guidance

---

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation

**Checklist:**
- [ ] Complete keyboard navigation (Tab order logical)
- [ ] Visible focus states on ALL interactive elements
- [ ] Enter/Space activates buttons and links
- [ ] Escape closes modals/dropdowns
- [ ] Arrow keys for menu navigation

### Semantic HTML

**Checklist:**
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] `<nav>` for navigation
- [ ] `<main>` for primary content
- [ ] `<aside>` for sidebars
- [ ] `<button>` for actions (not `<div onClick>`)
- [ ] `<a>` for navigation (not `<span onClick>`)

### Forms

**Checklist:**
- [ ] All inputs have associated `<label>`
- [ ] Error messages linked with `aria-describedby`
- [ ] Required fields indicated (not by color alone)
- [ ] Form validation accessible to screen readers
- [ ] Clear error recovery guidance

### Color and Contrast

**Checklist:**
- [ ] Text contrast ratio ≥ 4.5:1 (AA)
- [ ] Large text contrast ratio ≥ 3:1
- [ ] Information not conveyed by color alone
- [ ] Focus indicators meet contrast requirements

### Images and Media

**Checklist:**
- [ ] All images have `alt` text
- [ ] Decorative images use `alt=""`
- [ ] Videos have captions
- [ ] Audio has transcripts

---

## Responsive Design

### Breakpoints

```typescript
const breakpoints = {
  mobile: 375,    // Small phones
  tablet: 768,    // Tablets
  desktop: 1024,  // Small laptops
  wide: 1440,     // Desktop monitors
};
```

### Testing Viewports

| Viewport | Width | Test Focus |
|----------|-------|------------|
| Mobile | 375px | Touch targets (44x44px min), single column |
| Tablet | 768px | Layout adaptation, touch + keyboard |
| Desktop | 1440px | Full layout, hover states |

### Responsive Checklist

- [ ] No horizontal scrolling at any viewport
- [ ] No element overlap or truncation
- [ ] Touch targets ≥ 44x44px on mobile
- [ ] Text remains readable (no tiny fonts)
- [ ] Images scale appropriately
- [ ] Navigation adapts (hamburger menu on mobile)

---

## Design Review Process

### 7-Phase Review

1. **Phase 0: Preparation**
   - Analyze PR description and motivation
   - Review code diff for scope
   - Set up live preview environment

2. **Phase 1: Interaction Flow**
   - Execute primary user flow
   - Test all interactive states
   - Verify destructive action confirmations
   - Assess perceived performance

3. **Phase 2: Responsiveness**
   - Test desktop (1440px)
   - Test tablet (768px)
   - Test mobile (375px)
   - Verify no horizontal scroll

4. **Phase 3: Visual Polish**
   - Layout alignment and spacing
   - Typography hierarchy
   - Color consistency
   - Visual hierarchy

5. **Phase 4: Accessibility**
   - Keyboard navigation
   - Focus states
   - Screen reader compatibility
   - Color contrast

6. **Phase 5: Robustness**
   - Form validation with invalid inputs
   - Content overflow scenarios
   - Loading/empty/error states
   - Edge cases

7. **Phase 6: Code Health**
   - Component reuse over duplication
   - Design token usage (no magic numbers)
   - Adherence to established patterns

### Triage Matrix

| Category | Symbol | When to Use |
|----------|--------|-------------|
| **Blocker** | `[BLOCKER]` | Critical failure requiring immediate fix |
| **High-Priority** | `[HIGH]` | Significant issue to fix before merge |
| **Medium-Priority** | `[MEDIUM]` | Improvement for follow-up |
| **Nitpick** | `Nit:` | Minor aesthetic detail |

### Feedback Format

```markdown
### Design Review Summary
[Positive opening and overall assessment]

### Findings

#### Blockers
- [BLOCKER] [Problem + Screenshot]

#### High-Priority
- [HIGH] [Problem + Screenshot]

#### Medium-Priority
- [MEDIUM] [Problem]

#### Nitpicks
- Nit: [Minor detail]
```

---

## Quick Reference Card

```
DESIGN REVIEW ESSENTIALS

ACCESSIBILITY (Non-Negotiable):
□ Keyboard navigation works
□ Focus states visible
□ Color contrast ≥ 4.5:1
□ All images have alt text
□ Forms have labels

RESPONSIVENESS:
□ Mobile (375px) - no overflow
□ Tablet (768px) - layout adapts
□ Desktop (1440px) - full layout

VISUAL POLISH:
□ Spacing uses design tokens
□ Typography hierarchy clear
□ Colors from palette only
□ Animations < 300ms

INTERACTIONS:
□ Hover states on clickables
□ Loading states present
□ Error states helpful
□ Empty states designed
```

---

## Related Resources

- [styling-guide.md](styling-guide.md) - MUI v7 styling patterns
- [component-patterns.md](component-patterns.md) - React component patterns
- [loading-and-error-states.md](loading-and-error-states.md) - State handling

---

**Excellence in design is attention to every pixel.**
