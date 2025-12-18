# Framework Translation Template

Use this template when translating shadcn/ui components to a new framework. Replace `{FRAMEWORK}` with your framework name.

## Step 1: Framework Analysis

Before starting, answer these questions:

### Reactivity Model
- [ ] How does the framework handle reactive state?
- [ ] Signal-based? Observable? Virtual DOM diffing?
- [ ] How do you create a reactive variable?
- [ ] How do you derive computed values?

### Component Model
- [ ] How are components defined? (Functions, classes, macros)
- [ ] How are props/properties passed?
- [ ] How are children handled?
- [ ] How do you handle conditional rendering?
- [ ] How do you handle list rendering?

### Event Handling
- [ ] How do you attach event listeners?
- [ ] How do you prevent default behavior?
- [ ] How do you access the event target?

### Refs/Element Access
- [ ] How do you get a reference to a DOM element?
- [ ] How do you focus an element programmatically?

### Styling
- [ ] Can you use Tailwind CSS?
- [ ] How do you dynamically toggle classes?
- [ ] How do you merge class strings?

---

## Step 2: Core Utilities

### Class Merging (cn equivalent)

```{LANGUAGE}
// Implement a function that:
// 1. Accepts multiple class string arguments
// 2. Filters empty strings
// 3. Handles conditional classes
// 4. Optionally uses tailwind-merge for conflict resolution

fn cn(classes: &[&str]) -> String {
    // Your implementation
}
```

### CVA Equivalent (Variant Management)

```{LANGUAGE}
// Pattern: Use enums for variants, match for class selection

enum ButtonVariant { Default, Destructive, Outline, Secondary, Ghost, Link }
enum ButtonSize { Default, Sm, Lg, Icon }

fn button_classes(variant: ButtonVariant, size: ButtonSize) -> String {
    let base = "inline-flex items-center...";
    let variant_classes = match variant {
        ButtonVariant::Default => "bg-primary...",
        // etc.
    };
    let size_classes = match size {
        ButtonSize::Default => "h-10 px-4 py-2",
        // etc.
    };
    cn(&[base, variant_classes, size_classes])
}
```

---

## Step 3: Base Component Structure

### Button (Simplest Interactive)

```{LANGUAGE}
// Props:
// - variant: ButtonVariant (default: Default)
// - size: ButtonSize (default: Default)
// - disabled: bool (default: false)
// - class: Option<String> (for additional classes)
// - on_click: callback function
// - children: content

// Requirements:
// - Use native <button> element
// - Apply variant and size classes
// - Handle disabled state
// - Merge custom classes
// - Focus visible ring styles
```

### Input (Controlled/Uncontrolled)

```{LANGUAGE}
// Props:
// - type: String (default: "text")
// - value: reactive signal or initial value
// - placeholder: Option<String>
// - disabled: bool
// - class: Option<String>
// - on_input: callback with new value

// Requirements:
// - Two-way binding if signal provided
// - Proper placeholder styling
// - Focus ring styles
// - File input styling
```

### Card (Compound Component)

```{LANGUAGE}
// Components: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter

// Pattern:
// - Each is a simple wrapper with appropriate classes
// - Use composition, not configuration
// - Allow class overrides on each part
```

---

## Step 4: Complex Behavior Patterns

### Dialog (Focus Trap + Portal)

Key behaviors to implement:
1. **Portal rendering** - Render outside normal DOM hierarchy
2. **Overlay** - Click to close
3. **Escape key** - Close on Escape
4. **Focus trap** - Tab cycles within dialog
5. **Focus restoration** - Return focus to trigger on close
6. **Scroll lock** - Prevent body scroll when open

```{LANGUAGE}
// Minimal implementation checklist:
// [ ] Open/close state management
// [ ] Overlay click handler
// [ ] Escape key handler
// [ ] Role="dialog" and aria-modal="true"
// [ ] Auto-focus first focusable element
// [ ] aria-labelledby pointing to title
```

### Select/Dropdown (Virtual List + Keyboard Nav)

Key behaviors:
1. **Keyboard navigation** - Arrow keys, Home, End
2. **Type-ahead** - Focus matching option on character input
3. **Click outside** - Close on click outside
4. **Positioning** - Flip to stay in viewport

```{LANGUAGE}
// Minimal implementation checklist:
// [ ] Open/close toggle
// [ ] Selected value display
// [ ] Options list rendering
// [ ] Arrow key navigation
// [ ] Enter to select
// [ ] Escape to close
// [ ] aria-expanded, aria-activedescendant
// [ ] role="listbox" and role="option"
```

### Tabs (Active State + Panels)

```{LANGUAGE}
// Key implementation:
// - Single active state
// - Arrow key navigation between tabs
// - Panel visibility tied to active tab
// - role="tablist", role="tab", role="tabpanel"
// - aria-selected, aria-controls, aria-labelledby
```

---

## Step 5: Animation Patterns

### CSS-Based (Recommended)

```css
/* Define in global CSS */
.animate-in { animation-duration: 150ms; animation-fill-mode: both; }
.fade-in-0 { animation-name: fadeIn; }
.zoom-in-95 { animation-name: zoomIn; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes zoomIn { from { transform: scale(0.95); } to { transform: scale(1); } }

/* Use data attributes for state */
[data-state="open"] .animate-in { /* animate in */ }
[data-state="closed"] { /* instant or animate out */ }
```

### Framework-Specific Transitions

If framework has built-in transitions (Vue, Svelte, etc.):

```{LANGUAGE}
// Map to enter/leave animations:
// - enter: fade-in-0 zoom-in-95
// - leave: fade-out-0 zoom-out-95
// - duration: 150ms
// - easing: cubic-bezier(0.16, 1, 0.3, 1)
```

---

## Step 6: Validation Checklist

For each component, verify:

### Visual Fidelity
- [ ] Matches shadcn appearance in default state
- [ ] Matches hover state
- [ ] Matches focus state (ring visible)
- [ ] Matches disabled state
- [ ] Matches all variants
- [ ] Respects CSS custom properties

### Accessibility
- [ ] Proper ARIA attributes (see accessibility-patterns.md)
- [ ] Keyboard navigation works
- [ ] Focus is managed correctly
- [ ] Screen reader announces correctly

### Behavior
- [ ] State changes work
- [ ] Events fire correctly
- [ ] Edge cases handled (empty, disabled, error)

---

## Example: New Framework Template

Create a new file: `references/framework-translations/{framework}.md`

Structure:
```markdown
# {Framework} Translation Guide

## Setup Requirements
- Dependencies
- Tailwind config
- CSS variables

## Core Patterns
- CVA equivalent
- Class merging
- Props pattern

## Component Implementations
- Button
- Input  
- Card
- Dialog
- (etc.)

## Framework-Specific Considerations
- Any unique patterns
- Known limitations
- Workarounds
```
