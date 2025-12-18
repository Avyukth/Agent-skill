---
name: shadcn-ui
description: Generate shadcn/ui-style components for ANY framework. Use when building UI components in React, Solid, Svelte, Vue, Leptos (Rust/WASM), or any other framework where shadcn-style design is desired. Handles both supported frameworks and provides framework-agnostic patterns for unsupported targets like Rust/WASM (Leptos, Dioxus, Yew), Elixir (Phoenix LiveView), or custom solutions. Translates shadcn design principles (Radix primitives, Tailwind styling, accessibility-first) into any target. Covers CVA variants, class merging, component anatomy, accessibility patterns, and design tokens.
---

# shadcn/ui Universal Component Generator

Generate production-ready, accessible UI components following shadcn/ui design principles for **any framework**.

## Purpose

This skill enables Claude to translate shadcn/ui patterns to any frontend framework, not just React. It provides:

1. **Framework-agnostic component specifications** - How components should look and behave
2. **Framework translation guides** - Specific patterns for React, SolidJS, Leptos (Rust), and a template for new frameworks
3. **Design system tokens** - Complete color, typography, spacing, and animation specifications
4. **Accessibility patterns** - ARIA attributes and keyboard navigation for each component

## When to Use This Skill

This skill automatically activates when you:
- Build UI components using shadcn/ui patterns
- Translate React shadcn components to other frameworks
- Create component libraries with Tailwind CSS
- Implement accessible components with proper ARIA attributes
- Work with Leptos/Rust WASM frontends needing UI components
- Need CVA (Class Variance Authority) variant patterns
- Design dark/light theme systems

## Core Philosophy

shadcn/ui is NOT a component library—it's a collection of **patterns and principles**:

1. **Composition over configuration** - Small, composable primitives
2. **Copy-paste ownership** - You own the code, not a package
3. **Accessibility-first** - Built on Radix UI patterns (ARIA, keyboard nav)
4. **Tailwind styling** - Utility-first CSS with design tokens
5. **Variants via CVA** - Class Variance Authority pattern for variants

## Workflow

### Step 1: Identify Target Framework

| Framework | Support Level | Reference |
|-----------|--------------|-----------|
| React | Native (original) | [resources/framework-translations/react.md](resources/framework-translations/react.md) |
| Leptos (Rust) | Translation guide | [resources/framework-translations/leptos.md](resources/framework-translations/leptos.md) |
| Solid | Translation guide | [resources/framework-translations/solid.md](resources/framework-translations/solid.md) |
| Other | Use template | [resources/framework-translations/template.md](resources/framework-translations/template.md) |

### Step 2: Load Required References

For ANY component generation:
1. Read [resources/design-system.md](resources/design-system.md) for colors, spacing, typography
2. Read [resources/component-anatomy.md](resources/component-anatomy.md) for the specific component spec
3. Read the appropriate framework translation guide
4. Read [resources/accessibility-patterns.md](resources/accessibility-patterns.md) for ARIA/keyboard patterns

### Step 3: Generate Component

Follow this structure:
```
1. Import/use statements (framework-specific)
2. Type definitions (props, variants)
3. CVA-equivalent variant definitions
4. Component implementation with:
   - Proper accessibility attributes
   - Keyboard navigation
   - Tailwind classes matching design system
   - Composable sub-components where needed
5. Export statements
```

## Design Token Reference (Quick)

Always use these CSS variables (defined in [assets/base-css/globals.css](assets/base-css/globals.css)):

```css
/* Core semantic colors */
--background, --foreground
--card, --card-foreground
--primary, --primary-foreground
--secondary, --secondary-foreground
--muted, --muted-foreground
--accent, --accent-foreground
--destructive, --destructive-foreground
--border, --input, --ring

/* Sizing */
--radius: 0.5rem (default)
```

## Component Anatomy Pattern

Every shadcn component follows this mental model:

```
[Root Container]
  ├─ [Trigger/Input] (interactive element)
  ├─ [Content/Panel] (revealed content)
  │    ├─ [Header] (optional)
  │    ├─ [Body/Items]
  │    └─ [Footer/Actions] (optional)
  └─ [Overlay/Backdrop] (for modals/dialogs)
```

## Framework Translation Strategy

For unsupported frameworks (like Leptos), follow this approach:

1. **Primitives First**: Implement the behavioral primitive (focus management, keyboard handling)
2. **Styling Layer**: Apply Tailwind classes (or equivalent CSS)
3. **Accessibility Layer**: Add ARIA attributes matching Radix patterns
4. **Composition API**: Design for slot-based or children-based composition

### Leptos-Specific Quick Notes

```rust
// CVA equivalent: use tailwind_fuse crate
use tailwind_fuse::*;

#[derive(TwVariant)]
pub enum ButtonVariant {
    #[tw(default, class = "bg-primary text-primary-foreground hover:bg-primary/90")]
    Default,
    #[tw(class = "bg-destructive text-destructive-foreground hover:bg-destructive/90")]
    Destructive,
    // ... other variants
}

// Props pattern with MaybeProp
#[component]
pub fn Button(
    #[prop(optional, into)] variant: MaybeProp<ButtonVariant>,
    #[prop(optional, into)] class: MaybeProp<String>,
    children: Children,
) -> impl IntoView {
    // Implementation...
}
```

## Navigation Guide

| Need to... | Read this resource |
|------------|-------------------|
| Understand color tokens, spacing, typography | [resources/design-system.md](resources/design-system.md) |
| Get component structure and classes | [resources/component-anatomy.md](resources/component-anatomy.md) |
| Implement proper ARIA and keyboard nav | [resources/accessibility-patterns.md](resources/accessibility-patterns.md) |
| Build React components (original) | [resources/framework-translations/react.md](resources/framework-translations/react.md) |
| Build Leptos/Rust components | [resources/framework-translations/leptos.md](resources/framework-translations/leptos.md) |
| Build SolidJS components | [resources/framework-translations/solid.md](resources/framework-translations/solid.md) |
| Add a new framework | [resources/framework-translations/template.md](resources/framework-translations/template.md) |
| Copy base CSS variables | [assets/base-css/globals.css](assets/base-css/globals.css) |

## Quick Reference: Common Components

### Button Variants
| Variant | Classes |
|---------|---------|
| default | `bg-primary text-primary-foreground hover:bg-primary/90` |
| destructive | `bg-destructive text-destructive-foreground hover:bg-destructive/90` |
| outline | `border border-input bg-background hover:bg-accent hover:text-accent-foreground` |
| secondary | `bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| ghost | `hover:bg-accent hover:text-accent-foreground` |
| link | `text-primary underline-offset-4 hover:underline` |

### Button Sizes
| Size | Classes |
|------|---------|
| default | `h-10 px-4 py-2` |
| sm | `h-9 rounded-md px-3` |
| lg | `h-11 rounded-md px-8` |
| icon | `h-10 w-10` |

### Focus States (All Interactive Elements)
```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
```

### Disabled States
```css
disabled:pointer-events-none
disabled:opacity-50
```

## Resource Files

### [resources/design-system.md](resources/design-system.md)
Complete design token reference:
- Color system (light/dark themes)
- Typography scale
- Spacing scale
- Border radius tokens
- Shadow definitions
- Animation/transition values

### [resources/component-anatomy.md](resources/component-anatomy.md)
Framework-agnostic specifications for 40+ components:
- Button, Input, Card, Dialog, Select
- Accordion, Tabs, Alert, Badge
- Switch, Checkbox, Toast, Avatar
- Progress, Tooltip, Dropdown Menu, and more

### [resources/accessibility-patterns.md](resources/accessibility-patterns.md)
ARIA and keyboard patterns for all components:
- Proper ARIA roles and attributes
- Keyboard navigation requirements
- Focus management patterns
- Screen reader considerations

### Framework Translation Guides
- **[react.md](resources/framework-translations/react.md)** - Original React/Radix implementation reference
- **[leptos.md](resources/framework-translations/leptos.md)** - Comprehensive Rust/WASM translation with radix-leptos-* crates
- **[solid.md](resources/framework-translations/solid.md)** - SolidJS translation using Kobalte primitives
- **[template.md](resources/framework-translations/template.md)** - Template for adding new framework support

### [assets/base-css/globals.css](assets/base-css/globals.css)
Copy-paste CSS with:
- All CSS custom properties (light/dark)
- Tailwind base layer setup
- Animation keyframes
- Utility animation classes

## Success Metrics

A well-generated shadcn-style component should:
- Match visual appearance of original shadcn/ui
- Include all proper ARIA attributes
- Handle keyboard navigation correctly
- Support all documented variants
- Use semantic CSS variables
- Be composable with sub-components
- Work with both light and dark themes

---

**Skill Status**: Complete universal shadcn/ui generator
**Line Count**: <200 lines (under 500-line rule)
**Progressive Disclosure**: 8 resource files for deep dives
**Coverage**: Full component library translation capability
