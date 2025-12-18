# shadcn/ui Design System

Complete design token reference for generating consistent shadcn-style components.

## Color System

### Semantic Color Tokens

shadcn uses HSL values with CSS custom properties. All colors have foreground pairs.

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
```

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
--radius: 0.5rem; /* Base radius token */
```

Usage in Tailwind:
```
rounded-lg   → var(--radius) /* Default for most components */
rounded-md   → calc(var(--radius) - 2px)
rounded-sm   → calc(var(--radius) - 4px)
rounded-full → 9999px
```

## Shadows

```css
shadow-sm   → 0 1px 2px 0 rgb(0 0 0 / 0.05)
shadow      → 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
shadow-md   → 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
shadow-lg   → 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
```

## Animation & Transitions

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
