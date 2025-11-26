# Dark Mode Patterns

**Related**: [SKILL.md](../SKILL.md) | [accessibility-mobile.md](accessibility-mobile.md) | [animation-performance.md](animation-performance.md)

Effective dark mode requires systematic color architecture, not simple color inversion. This guide covers the three-tier token system that enables scalable theming across any number of color schemes.

---

## Table of Contents

1. [Color Token Architecture](#color-token-architecture)
2. [System Preference Detection](#system-preference-detection)
3. [Dark Mode Contrast](#dark-mode-contrast)
4. [Elevation in Dark Mode](#elevation-in-dark-mode)
5. [Image Adaptation](#image-adaptation)
6. [Theme Transitions](#theme-transitions)
7. [Svelte Implementation](#svelte-implementation)

---

## Color Token Architecture

### Three-Tier Token System

**Tier 1 - Primitive Tokens**: Raw values without semantic meaning

```css
:root {
  /* Primitive tokens */
  --color-blue-500: #3b82f6;
  --color-blue-600: #2563eb;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
  --color-white: #ffffff;
  --color-black: #000000;
}
```

**Tier 2 - Semantic Tokens**: Theme-aware references to primitives

```css
/* Light mode (default) */
:root {
  --color-bg-primary: var(--color-white);
  --color-bg-secondary: var(--color-gray-50);
  --color-bg-tertiary: var(--color-gray-100);
  --color-text-primary: var(--color-gray-900);
  --color-text-secondary: var(--color-gray-600);
  --color-text-muted: var(--color-gray-500);
  --color-border: var(--color-gray-200);
  --color-accent: var(--color-blue-500);
}

/* Dark mode */
:root.dark {
  --color-bg-primary: #121212;
  --color-bg-secondary: #1e1e1e;
  --color-bg-tertiary: #2d2d2d;
  --color-text-primary: rgba(255, 255, 255, 0.87);
  --color-text-secondary: rgba(255, 255, 255, 0.60);
  --color-text-muted: rgba(255, 255, 255, 0.38);
  --color-border: rgba(255, 255, 255, 0.12);
  --color-accent: var(--color-blue-400);
}
```

**Tier 3 - Component Tokens**: Scoped to specific components

```css
:root {
  /* Component-specific tokens */
  --button-primary-bg: var(--color-accent);
  --button-primary-text: var(--color-white);
  --card-bg: var(--color-bg-secondary);
  --card-border: var(--color-border);
  --input-bg: var(--color-bg-primary);
  --input-border: var(--color-border);
}
```

---

## System Preference Detection

### CSS Media Query

```css
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    --color-bg-primary: #121212;
    --color-text-primary: rgba(255, 255, 255, 0.87);
    /* ... other dark mode values */
  }
}
```

### User Override with Three Options

Always provide user override with three options: **Light**, **Dark**, **System**.

```typescript
// theme.ts
type Theme = 'light' | 'dark' | 'system';

export function getTheme(): Theme {
  return (localStorage.getItem('theme') as Theme) || 'system';
}

export function setTheme(theme: Theme) {
  localStorage.setItem('theme', theme);
  applyTheme(theme);
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(prefersDark ? 'dark' : 'light');
  } else {
    root.classList.add(theme);
  }
}

// Listen for system preference changes
export function watchSystemPreference(callback: (isDark: boolean) => void) {
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  query.addEventListener('change', (e) => callback(e.matches));
  return () => query.removeEventListener('change', callback);
}
```

### Preventing Flash of Incorrect Theme (FOIT)

Apply theme in a blocking script before body renders:

```html
<!-- app.html - Add before </head> -->
<script>
  (function() {
    const theme = localStorage.getItem('theme') || 'system';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
    document.documentElement.classList.add(isDark ? 'dark' : 'light');
  })();
</script>
```

---

## Dark Mode Contrast

### Base Surface Color

**Never use pure black (#000000)** unless optimizing for OLED power savings. Material Design recommends **#121212** as base surface color.

| Use Case | Light Mode | Dark Mode |
|----------|------------|-----------|
| Primary background | #FFFFFF | #121212 |
| Surface | #F5F5F5 | #1E1E1E |
| Elevated surface | #FFFFFF | #2D2D2D |

### Text Opacity Hierarchy (Material Design)

| Emphasis Level | Light Mode | Dark Mode |
|----------------|------------|-----------|
| High emphasis | 87% black | 87% white |
| Medium emphasis | 60% black | 60% white |
| Disabled | 38% black | 38% white |

```css
:root.dark {
  --text-high-emphasis: rgba(255, 255, 255, 0.87);
  --text-medium-emphasis: rgba(255, 255, 255, 0.60);
  --text-disabled: rgba(255, 255, 255, 0.38);
}
```

### Contrast Requirements

All WCAG contrast ratios must be maintained in dark mode:

| Element | Minimum Ratio (AA) |
|---------|-------------------|
| Normal text | 4.5:1 |
| Large text (≥18pt) | 3:1 |
| UI components | 3:1 |
| Focus indicators | 3:1 |

### Desaturate Accent Colors

Saturated colors on dark backgrounds cause visual vibration. Reduce saturation by 10-20% for dark mode:

```css
:root {
  --color-accent: hsl(217, 91%, 60%); /* Light mode */
}

:root.dark {
  --color-accent: hsl(217, 75%, 65%); /* Desaturated, lighter */
}
```

---

## Elevation in Dark Mode

### Light vs Dark Elevation

In light mode, shadows create elevation. In dark mode, use **lighter surfaces** instead:

```css
/* Light mode: shadows for elevation */
.card {
  background: var(--color-bg-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Dark mode: lighter surfaces for elevation */
:root.dark .card {
  background: var(--color-bg-elevated);
  box-shadow: none;
}
```

### Material Design Dark Mode Elevation

| Elevation | Surface Color | White Overlay |
|-----------|---------------|---------------|
| 0dp (base) | #121212 | 0% |
| 1dp | #1E1E1E | 5% |
| 2dp | #222222 | 7% |
| 4dp | #272727 | 9% |
| 6dp | #2C2C2C | 11% |
| 8dp | #2E2E2E | 12% |
| 12dp | #333333 | 14% |
| 16dp | #383838 | 15% |
| 24dp | #3D3D3D | 16% |

### CSS Implementation

```css
:root.dark {
  --elevation-0: #121212;
  --elevation-1: color-mix(in srgb, white 5%, #121212);
  --elevation-2: color-mix(in srgb, white 7%, #121212);
  --elevation-4: color-mix(in srgb, white 9%, #121212);
  --elevation-8: color-mix(in srgb, white 12%, #121212);
  --elevation-16: color-mix(in srgb, white 15%, #121212);
}
```

---

## Image Adaptation

### Picture Element for Theme-Aware Images

```html
<picture>
  <source
    srcset="hero-dark.webp"
    media="(prefers-color-scheme: dark)"
  />
  <source
    srcset="hero-dark.webp"
    media="(prefers-color-scheme: light)"
    class="dark-only"
  />
  <img src="hero-light.webp" alt="Hero image" />
</picture>
```

### SVG Icons with currentColor

```svelte
<svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
>
  <path d="M12 2L2 7l10 5 10-5-10-5z" />
</svg>
```

### Image Filters for Dark Mode

Apply subtle filters to photographs to reduce harsh contrast:

```css
:root.dark img:not([data-no-filter]) {
  filter: brightness(0.9) contrast(1.05);
}

/* Illustrations may need different treatment */
:root.dark img[data-type="illustration"] {
  filter: brightness(0.85) saturate(0.9);
}
```

### Svelte Image Component

```svelte
<script lang="ts">
  export let lightSrc: string;
  export let darkSrc: string;
  export let alt: string;

  import { browser } from '$app/environment';

  let prefersDark = false;

  if (browser) {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    prefersDark = query.matches;
    query.addEventListener('change', (e) => prefersDark = e.matches);
  }
</script>

<picture>
  <source srcset={darkSrc} media="(prefers-color-scheme: dark)" />
  <img src={lightSrc} {alt} loading="lazy" />
</picture>
```

---

## Theme Transitions

### Smooth Color Transitions

```css
/* Only transition colors, not layout properties */
:root {
  transition:
    background-color 200ms ease,
    color 200ms ease,
    border-color 200ms ease;
}

/* Apply to all elements */
*,
*::before,
*::after {
  transition: inherit;
}
```

### Disable During Initial Load

Prevent flash of transition on page load:

```css
/* Add class via blocking script */
.no-transitions,
.no-transitions *,
.no-transitions *::before,
.no-transitions *::after {
  transition: none !important;
}
```

```javascript
// In blocking script
document.documentElement.classList.add('no-transitions');

// Remove after paint
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('no-transitions');
  });
});
```

---

## Svelte Implementation

### Theme Store

```typescript
// lib/stores/theme.ts
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

function createThemeStore() {
  const { subscribe, set, update } = writable<Theme>('system');

  return {
    subscribe,
    set: (theme: Theme) => {
      if (browser) {
        localStorage.setItem('theme', theme);
        applyTheme(theme);
      }
      set(theme);
    },
    initialize: () => {
      if (browser) {
        const stored = localStorage.getItem('theme') as Theme | null;
        const theme = stored || 'system';
        set(theme);
        applyTheme(theme);
      }
    }
  };
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(prefersDark ? 'dark' : 'light');
  } else {
    root.classList.add(theme);
  }
}

export const theme = createThemeStore();

export const isDark = derived(theme, ($theme) => {
  if (!browser) return false;
  if ($theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return $theme === 'dark';
});
```

### Theme Toggle Component

```svelte
<script lang="ts">
  import { theme } from '$lib/stores/theme';

  const options = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' }
  ] as const;
</script>

<div class="theme-toggle" role="radiogroup" aria-label="Color theme">
  {#each options as option}
    <button
      type="button"
      role="radio"
      aria-checked={$theme === option.value}
      class="theme-toggle__option"
      class:active={$theme === option.value}
      on:click={() => theme.set(option.value)}
    >
      <span aria-hidden="true">{option.icon}</span>
      <span class="sr-only">{option.label}</span>
    </button>
  {/each}
</div>

<style>
  .theme-toggle {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: var(--color-bg-secondary);
    border-radius: 12px;
  }

  .theme-toggle__option {
    padding: 8px 12px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 150ms ease;
  }

  .theme-toggle__option:hover {
    background: var(--color-bg-tertiary);
  }

  .theme-toggle__option.active {
    background: var(--color-bg-primary);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
</style>
```

### Layout Integration

```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { theme } from '$lib/stores/theme';

  onMount(() => {
    theme.initialize();

    // Watch for system preference changes
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if ($theme === 'system') {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(query.matches ? 'dark' : 'light');
      }
    };

    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  });
</script>

<slot />
```

---

## Quick Reference: Color Variables

### Complete Dark Mode CSS

```css
:root {
  /* Primitives */
  --color-white: #ffffff;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-600: #4b5563;
  --color-gray-900: #111827;
  --color-blue-400: #60a5fa;
  --color-blue-500: #3b82f6;

  /* Semantic - Light mode */
  --color-bg-primary: var(--color-white);
  --color-bg-secondary: var(--color-gray-50);
  --color-bg-elevated: var(--color-white);
  --color-text-primary: var(--color-gray-900);
  --color-text-secondary: var(--color-gray-600);
  --color-border: var(--color-gray-200);
  --color-accent: var(--color-blue-500);
}

:root.dark {
  --color-bg-primary: #121212;
  --color-bg-secondary: #1e1e1e;
  --color-bg-elevated: #2d2d2d;
  --color-text-primary: rgba(255, 255, 255, 0.87);
  --color-text-secondary: rgba(255, 255, 255, 0.60);
  --color-border: rgba(255, 255, 255, 0.12);
  --color-accent: var(--color-blue-400);
}
```

---

**Sources**: [Material Design 3 Dark Theme](https://m3.material.io/styles/color/dynamic-color/overview), [Apple HIG Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)
