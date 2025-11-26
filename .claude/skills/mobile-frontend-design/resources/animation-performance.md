# Animation Performance Budgets

**Related**: [SKILL.md](../SKILL.md) | [microinteractions.md](microinteractions.md) | [performance-optimization.md](performance-optimization.md)

At 60 frames per second, each frame must complete within **16.67 milliseconds**. This budget includes JavaScript execution, style calculations, layout, paint, and compositing. Motion UI is projected to appear in **75% of customer-facing applications** by end of 2025—making performance optimization critical.

---

## Table of Contents

1. [Frame Budget Breakdown](#frame-budget-breakdown)
2. [GPU-Accelerated Properties](#gpu-accelerated-properties)
3. [Core Web Vitals Integration](#core-web-vitals-integration)
4. [will-change Usage](#will-change-usage)
5. [Avoiding Layout Thrashing](#avoiding-layout-thrashing)
6. [CSS vs JavaScript Animation](#css-vs-javascript-animation)
7. [Reduced Motion Support](#reduced-motion-support)
8. [Modern Animation APIs](#modern-animation-apis)

---

## Frame Budget Breakdown

### The 16.67ms Budget

| Phase | Budget | Notes |
|-------|--------|-------|
| JavaScript | <10ms | Leave headroom for browser |
| Style calculations | ~2ms | Minimize selector complexity |
| Layout | <2ms | Avoid layout-triggering properties |
| Paint | <2ms | Use compositor-only properties |
| Composite | <1ms | GPU handles this |

### Practical Recommendation

Keep JavaScript execution under **10ms** to leave headroom for browser rendering. Use `performance.now()` to measure:

```javascript
function measureAnimation() {
  const start = performance.now();

  // Animation logic here

  const duration = performance.now() - start;
  if (duration > 10) {
    console.warn(`Animation took ${duration.toFixed(2)}ms - exceeds 10ms budget`);
  }
}
```

---

## GPU-Accelerated Properties

Only two CSS properties animate without triggering layout or paint: **transform** and **opacity**. These run on the compositor thread, enabling smooth animation even during main thread congestion.

### Property Performance Tiers

| Tier | Properties | Performance | Use Case |
|------|------------|-------------|----------|
| Composite only | `transform`, `opacity` | Excellent (60fps+) | All animations |
| Paint + Composite | `color`, `background-color`, `box-shadow` | Moderate | Hover states only |
| Layout + Paint + Composite | `width`, `height`, `margin`, `top`, `left` | Poor—avoid | Never animate |

### Alternatives for Common Animations

```css
/* ❌ BAD: Triggers layout */
.animate-bad {
  animation: slide-bad 300ms ease-out;
}

@keyframes slide-bad {
  from { left: 0; width: 100px; }
  to { left: 100px; width: 200px; }
}

/* ✅ GOOD: Compositor only */
.animate-good {
  animation: slide-good 300ms ease-out;
}

@keyframes slide-good {
  from { transform: translateX(0) scaleX(1); }
  to { transform: translateX(100px) scaleX(2); }
}
```

### Transform Alternatives Table

| Instead of... | Use... |
|---------------|--------|
| `left`, `top`, `right`, `bottom` | `transform: translate()` |
| `width`, `height` | `transform: scale()` |
| `margin`, `padding` | `transform: translate()` |
| `border-width` | `transform: scale()` or pseudo-elements |

---

## Core Web Vitals Integration

Animation performance directly impacts Core Web Vitals scores:

| Metric | Animation Impact | Target |
|--------|------------------|--------|
| **LCP** (Largest Contentful Paint) | Hero animations can delay | <2.5s |
| **INP** (Interaction to Next Paint) | Microinteraction responsiveness | <200ms |
| **CLS** (Cumulative Layout Shift) | Layout-triggering animations | <0.1 |

### Best Practices

```css
/* Defer non-critical animations until after LCP */
.hero-animation {
  animation: none;
}

.page-loaded .hero-animation {
  animation: fadeIn 500ms ease-out;
}

/* Use content-visibility for off-screen animated elements */
.off-screen-content {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;
}

/* Reserve space to prevent CLS */
.animated-element {
  min-height: 200px; /* Reserve space before animation */
}
```

### JavaScript LCP Detection

```javascript
// Defer animations until after LCP
let lcpComplete = false;

new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];
  lcpComplete = true;
  document.body.classList.add('page-loaded');
}).observe({ entryTypes: ['largest-contentful-paint'] });
```

---

## will-change Usage

The `will-change` property creates compositor layers proactively, avoiding first-frame jank. However, each layer consumes GPU memory.

### Rules

1. **Maximum 3-5 elements** per page
2. **Toggle dynamically** - never leave permanently active
3. **Use as last resort** - not premature optimization
4. **Remove after animation** - prevents memory leaks

### Implementation

```javascript
// Toggle will-change dynamically
element.addEventListener('mouseenter', () => {
  element.style.willChange = 'transform, opacity';
});

element.addEventListener('animationend', () => {
  element.style.willChange = 'auto';
});

// Or with CSS for hover states
.card {
  transition: transform 200ms ease-out;
}

.card:hover {
  will-change: transform;
  transform: translateY(-4px);
}
```

### Svelte Implementation

```svelte
<script lang="ts">
  let willChange = 'auto';

  function handleMouseEnter() {
    willChange = 'transform, opacity';
  }

  function handleAnimationEnd() {
    willChange = 'auto';
  }
</script>

<div
  class="animated-card"
  style:will-change={willChange}
  on:mouseenter={handleMouseEnter}
  on:animationend={handleAnimationEnd}
>
  <slot />
</div>
```

---

## Avoiding Layout Thrashing

Layout thrashing occurs when JavaScript repeatedly reads layout properties then writes to the DOM, forcing multiple reflows per frame.

### Layout-Triggering Properties

Reading these properties forces synchronous layout:

```javascript
// Properties that trigger layout when read
element.offsetWidth
element.offsetHeight
element.offsetTop
element.offsetLeft
element.clientWidth
element.clientHeight
element.getBoundingClientRect()
window.getComputedStyle(element)
element.scrollTop
element.scrollLeft
```

### The Problem

```javascript
// ❌ BAD: Thrashing - read-write-read-write
elements.forEach(el => {
  el.style.width = box.offsetWidth + 'px'; // Forces layout each iteration
});
```

### The Solution: Batch Reads Before Writes

```javascript
// ✅ GOOD: Batched - read all, then write all
const width = box.offsetWidth; // Single read
elements.forEach(el => {
  el.style.width = width + 'px'; // Multiple writes
});
```

### Using requestAnimationFrame

```javascript
// ✅ BEST: Separate read and write frames
function animate() {
  // Read phase
  const measurements = elements.map(el => el.getBoundingClientRect());

  // Write phase (next frame)
  requestAnimationFrame(() => {
    elements.forEach((el, i) => {
      el.style.transform = `translateX(${measurements[i].width}px)`;
    });
  });
}
```

### FastDOM Pattern

```javascript
// Use FastDOM library for automatic batching
import fastdom from 'fastdom';

fastdom.measure(() => {
  const width = element.offsetWidth;

  fastdom.mutate(() => {
    element.style.width = width * 2 + 'px';
  });
});
```

---

## CSS vs JavaScript Animation

### Performance Comparison

| Approach | Thread | Max FPS | Best For |
|----------|--------|---------|----------|
| CSS Transitions/Animations | Compositor | 120fps | State changes, hovers, loops |
| Web Animations API | Compositor | 120fps | Programmatic CSS animations |
| requestAnimationFrame | Main | 60fps | Physics, user-controlled, dynamic |
| GSAP/Anime.js | Main | 60fps | Complex sequences, timelines |

### When to Use CSS

- Simple state transitions
- Hover effects
- Loading spinners
- Scroll-triggered animations (with scroll-driven animations)
- Keyframe animations

```css
/* CSS Animation - runs on compositor */
.fade-in {
  animation: fadeIn 300ms ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### When to Use JavaScript

- Complex sequences
- Physics-based motion
- User-controlled scrubbing
- Dynamic values
- Chained animations

```javascript
// Web Animations API - runs on compositor when possible
element.animate([
  { opacity: 0, transform: 'translateY(10px)' },
  { opacity: 1, transform: 'translateY(0)' }
], {
  duration: 300,
  easing: 'ease-out',
  fill: 'forwards'
});
```

### Svelte Transitions vs CSS

```svelte
<script>
  import { fade, fly, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  let visible = false;
</script>

<!-- Svelte transitions - JavaScript-based but optimized -->
{#if visible}
  <div
    in:fly={{ y: 20, duration: 300, easing: cubicOut }}
    out:fade={{ duration: 150 }}
  >
    Content
  </div>
{/if}

<!-- For performance-critical animations, prefer CSS -->
<div class="card" class:visible>Content</div>

<style>
  .card {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 300ms ease-out, transform 300ms ease-out;
  }

  .card.visible {
    opacity: 1;
    transform: translateY(0);
  }
</style>
```

---

## Reduced Motion Support

### The Recommended Approach

Enable animation only when users have no preference, defaulting to static experiences:

```css
/* Static by default */
.animated-element {
  /* No animation */
}

/* Enable animation only when explicitly permitted */
@media (prefers-reduced-motion: no-preference) {
  .animated-element {
    animation: fadeSlide 300ms ease-out;
  }
}
```

### What to Replace, Not Remove

When reducing motion:
- Replace transforms with opacity fades
- Keep feedback, just make it instant
- Maintain state communication

```css
/* Full motion */
@media (prefers-reduced-motion: no-preference) {
  .notification {
    animation: slideIn 300ms ease-out;
  }
}

/* Reduced motion - fade only */
@media (prefers-reduced-motion: reduce) {
  .notification {
    animation: fadeIn 150ms ease-out;
  }
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Problematic Animations to Disable

- Parallax effects
- Scaling/zooming animations
- Spinning/rotating elements
- Continuous looping animations
- Auto-playing videos

### Svelte Motion-Safe Store

```svelte
<script context="module" lang="ts">
  import { readable } from 'svelte/store';
  import { browser } from '$app/environment';

  export const prefersReducedMotion = readable(false, (set) => {
    if (!browser) return;

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    set(query.matches);

    const handler = (e: MediaQueryListEvent) => set(e.matches);
    query.addEventListener('change', handler);

    return () => query.removeEventListener('change', handler);
  });
</script>
```

```svelte
<script>
  import { prefersReducedMotion } from '$lib/stores/motion';
  import { fly, fade } from 'svelte/transition';

  let visible = false;
</script>

{#if visible}
  <div
    transition:$prefersReducedMotion ? fade : fly={{ y: 20 }}
  >
    Content
  </div>
{/if}
```

---

## Modern Animation APIs

### Scroll-Driven Animations (CSS)

Link animation progress to scroll position rather than time:

```css
@supports (animation-timeline: scroll()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal {
      animation: fadeSlideIn linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 40%;
    }
  }
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Performance**: Tokopedia reported **80% code reduction** and CPU usage dropping from **50% to 2%** when migrating scroll handlers to CSS scroll-driven animations.

**Browser Support**: Chrome 115+, Safari 26 beta, Firefox behind flag.

### View Transitions API

Enable native page and element transitions:

```javascript
// Simple page transition
document.startViewTransition(() => {
  updateTheDOM();
});

// Named transitions for specific elements
```

```css
.hero-image {
  view-transition-name: hero;
}

::view-transition-group(hero) {
  animation-duration: 0.5s;
}
```

**Browser Support**: Chrome 111+ (same-document), Chrome 126+ (cross-document), Safari 18+.

### Web Animations API

```javascript
// Programmatic animation with compositor performance
const animation = element.animate([
  { opacity: 0, transform: 'scale(0.9)' },
  { opacity: 1, transform: 'scale(1)' }
], {
  duration: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  fill: 'forwards'
});

// Control playback
animation.pause();
animation.play();
animation.reverse();
animation.cancel();

// Promises
await animation.finished;
```

---

## Quick Reference: Performance Checklist

### Animation Audit

- [ ] Only animating `transform` and `opacity`
- [ ] No layout-triggering properties in animations
- [ ] Batching DOM reads before writes
- [ ] `will-change` used sparingly (<5 elements)
- [ ] `will-change` removed after animation
- [ ] JavaScript execution <10ms per frame
- [ ] Respecting `prefers-reduced-motion`
- [ ] Deferring non-critical animations until after LCP
- [ ] Using CSS for simple animations
- [ ] Using `content-visibility` for off-screen elements

### Design System Easing Curves

| System | Standard | Deceleration | Acceleration |
|--------|----------|--------------|--------------|
| Material Design 3 | `cubic-bezier(0.4, 0, 0.2, 1)` | `cubic-bezier(0, 0, 0.2, 1)` | `cubic-bezier(0.4, 0, 1, 1)` |
| Carbon | `cubic-bezier(0.2, 0, 0.38, 0.9)` | `cubic-bezier(0, 0, 0.3, 1)` | `cubic-bezier(0.4, 0.14, 1, 1)` |
| Apple | Spring-based | — | — |

### Duration Tokens (Carbon)

| Token | Duration | Use |
|-------|----------|-----|
| `fast-01` | 70ms | Micro-interactions |
| `fast-02` | 110ms | Fade effects |
| `moderate-01` | 150ms | Small expansion |
| `moderate-02` | 240ms | System feedback |
| `slow-01` | 400ms | Large expansion |
| `slow-02` | 700ms | Background dimming |

---

**Sources**: [web.dev Animations](https://web.dev/animations/), [Material Design Motion](https://m3.material.io/styles/motion/), [Carbon Motion](https://carbondesignsystem.com/guidelines/motion/overview/)
