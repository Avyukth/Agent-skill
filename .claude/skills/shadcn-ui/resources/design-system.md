# shadcn/ui Design System

Complete design token reference for generating consistent shadcn-style components.

## Color System

### OKLCH Color Space (Modern)

shadcn now uses **OKLCH** for perceptually uniform colors. This provides better color interpolation and consistent perceived brightness.

```css
:root {
  /* Core theme colors (OKLCH) */
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --border: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;

  /* Chart-specific palette */
  --chart-1: oklch(0.646 0.222 41.116);  /* Orange */
  --chart-2: oklch(0.6 0.118 184.704);   /* Teal */
  --chart-3: oklch(0.398 0.07 227.392);  /* Dark blue */
  --chart-4: oklch(0.828 0.189 84.429);  /* Yellow */
  --chart-5: oklch(0.769 0.188 70.08);   /* Amber */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --chart-1: oklch(0.488 0.243 264.376); /* Blue/Purple */
  --chart-2: oklch(0.696 0.17 162.48);   /* Green */
  /* ... other dark theme colors */
}
```

**Chart Color Usage:**
Colors are referenced via `var(--color-KEY)` where KEY matches `ChartConfig` object keys, enabling dynamic color binding.

### Semantic Color Tokens (HSL - Legacy)

Traditional HSL values with CSS custom properties. All colors have foreground pairs.

```css
/* Light theme defaults */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;

--card: 0 0% 100%;
--card-foreground: 222.2 84% 4.9%;

--popover: 0 0% 100%;
--popover-foreground: 222.2 84% 4.9%;

--primary: 222.2 47.4% 11.2%;
--primary-foreground: 210 40% 98%;

--secondary: 210 40% 96.1%;
--secondary-foreground: 222.2 47.4% 11.2%;

--muted: 210 40% 96.1%;
--muted-foreground: 215.4 16.3% 46.9%;

--accent: 210 40% 96.1%;
--accent-foreground: 222.2 47.4% 11.2%;

--destructive: 0 84.2% 60.2%;
--destructive-foreground: 210 40% 98%;

--border: 214.3 31.8% 91.4%;
--input: 214.3 31.8% 91.4%;
--ring: 222.2 84% 4.9%;
```

```css
/* Dark theme defaults */
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;

  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;

  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;

  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;

  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;

  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;

  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;

  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;

  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}
```

### Using Colors in Tailwind

```
bg-background text-foreground
bg-card text-card-foreground
bg-primary text-primary-foreground
bg-secondary text-secondary-foreground
bg-muted text-muted-foreground
bg-accent text-accent-foreground
bg-destructive text-destructive-foreground
border-border
ring-ring
```

## Typography

### Font Stack
```css
--font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
--font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
```

### Text Sizes (Tailwind)
```
text-xs   → 0.75rem / 1rem line-height
text-sm   → 0.875rem / 1.25rem
text-base → 1rem / 1.5rem
text-lg   → 1.125rem / 1.75rem
text-xl   → 1.25rem / 1.75rem
text-2xl  → 1.5rem / 2rem
text-3xl  → 1.875rem / 2.25rem
text-4xl  → 2.25rem / 2.5rem
```

### Font Weights
```
font-normal   → 400
font-medium   → 500
font-semibold → 600
font-bold     → 700
font-extrabold → 800
```

### Typography Scale

| Element | Classes | Usage |
|---------|---------|-------|
| H1 | `text-4xl font-extrabold tracking-tight` | Page titles |
| H2 | `text-3xl font-semibold tracking-tight` | Section heads |
| H3 | `text-2xl font-semibold tracking-tight` | Subsections |
| H4 | `text-xl font-semibold tracking-tight` | Card titles |
| Body | `text-sm leading-7` | Primary content |
| Muted | `text-sm text-muted-foreground` | Descriptions |
| Chart labels | `text-xs` | Axis labels |

## Spacing Scale

shadcn follows Tailwind's spacing scale:

```
0    → 0
0.5  → 0.125rem (2px)
1    → 0.25rem (4px)
1.5  → 0.375rem (6px)
2    → 0.5rem (8px)
2.5  → 0.625rem (10px)
3    → 0.75rem (12px)
3.5  → 0.875rem (14px)
4    → 1rem (16px)
5    → 1.25rem (20px)
6    → 1.5rem (24px)
8    → 2rem (32px)
10   → 2.5rem (40px)
12   → 3rem (48px)
16   → 4rem (64px)
```

## Border Radius

```css
--radius: 0.625rem;  /* 10px base */
--radius-sm: calc(var(--radius) - 4px);  /* 6px - badges */
--radius-md: calc(var(--radius) - 2px);  /* 8px - buttons, inputs */
--radius-lg: var(--radius);               /* 10px - cards */
--radius-xl: calc(var(--radius) + 4px);  /* 14px - dialogs */
```

Usage in Tailwind:
```
rounded-sm   → var(--radius-sm) /* badges, tags */
rounded-md   → var(--radius-md) /* buttons, inputs */
rounded-lg   → var(--radius-lg) /* cards, panels */
rounded-xl   → var(--radius-xl) /* dialogs, modals */
rounded-full → 9999px
```

## Spacing Conventions

| Context | Tailwind Class | Value |
|---------|---------------|-------|
| Icon buttons | `p-2` | 8px |
| Compact cards | `p-3` | 12px |
| Standard components | `p-4` | 16px |
| Card content | `p-6` | 24px |
| Input fields | `px-3 py-2` | 12px/8px |
| Button default | `px-4 py-2` | 16px/8px |
| Form groups | `gap-4` | 16px |
| Major sections | `gap-6` | 24px |

## Shadows

```css
shadow-sm   → 0 1px 2px 0 rgb(0 0 0 / 0.05)
shadow      → 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
shadow-md   → 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
shadow-lg   → 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
```

## Animation & Transitions

### Animation Timing

| Context | Duration | Easing |
|---------|----------|--------|
| Color transitions | `duration-150` | `transition-colors` |
| Standard interactions | `duration-200` | `ease-out` |
| Accordion/collapse | `duration-300` | `ease-in-out` |
| Modal enter | `duration-200` | `ease-out` |
| Modal exit | `duration-150` | `ease-in` |

### Duration
```
duration-150 → 150ms (fast interactions)
duration-200 → 200ms (default)
duration-300 → 300ms (deliberate)
duration-500 → 500ms (slow)
```

### Easing
```
ease-in-out → cubic-bezier(0.4, 0, 0.2, 1) /* Default */
ease-out    → cubic-bezier(0, 0, 0.2, 1)   /* Enter animations */
ease-in     → cubic-bezier(0.4, 0, 1, 1)   /* Exit animations */
```

**Note:** Charts use `accessibilityLayer` prop for keyboard navigation and screen reader support.

### Common Animations (Keyframes)
```css
@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slide-in-from-top {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}

@keyframes slide-in-from-bottom {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
```

## Focus States

All interactive elements use this focus pattern:
```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
```

## Disabled States

```css
disabled:pointer-events-none
disabled:opacity-50
```

## Common Component Sizes

### Button Sizes
```
h-10 px-4 py-2      → default
h-9 rounded-md px-3 → sm
h-11 rounded-md px-8 → lg
h-10 w-10           → icon
```

### Input Heights
```
h-10 → default input, select
h-9  → compact
h-11 → large
```

### Icon Sizes
```
h-4 w-4 → inline with text
h-5 w-5 → buttons
h-6 w-6 → larger emphasis
```
