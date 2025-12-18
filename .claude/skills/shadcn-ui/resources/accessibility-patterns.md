# Accessibility Patterns

ARIA attributes and keyboard navigation patterns for shadcn/ui components. These patterns are based on WAI-ARIA Authoring Practices and are essential for proper accessibility in any framework.

## Core Principles

1. **Semantic HTML first** - Use native elements when possible (`<button>`, `<input>`, etc.)
2. **Keyboard navigable** - All interactive elements must be keyboard accessible
3. **Screen reader friendly** - Proper labels, announcements, and relationships
4. **Focus management** - Logical focus order, visible focus indicators, focus trapping when needed

---

## Button

### Requirements
- Use `<button>` element (not `<div>`)
- If using non-button element: `role="button"`, `tabindex="0"`
- Handle Enter and Space for activation

### Attributes
```
aria-pressed="true|false"    // For toggle buttons
aria-expanded="true|false"   // For buttons that control expandable content
aria-haspopup="menu|dialog"  // For buttons that open menus/dialogs
aria-disabled="true"         // When disabled (also disable via HTML)
```

---

## Dialog / Modal

### Attributes
```
role="dialog"
aria-modal="true"
aria-labelledby="{title-id}"
aria-describedby="{description-id}"
```

### Keyboard
| Key | Action |
|-----|--------|
| Escape | Close dialog |
| Tab | Move focus within dialog (trapped) |
| Shift+Tab | Move focus backward within dialog |

### Focus Management
1. On open: Move focus to first focusable element (or dialog itself)
2. While open: Trap focus within dialog
3. On close: Return focus to trigger element

### Implementation Pattern
```javascript
// Focus trap logic
const focusableElements = dialog.querySelectorAll(
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
);
const firstElement = focusableElements[0];
const lastElement = focusableElements[focusableElements.length - 1];

dialog.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }
});
```

---

## Select / Listbox

### Trigger Attributes
```
role="combobox"
aria-haspopup="listbox"
aria-expanded="true|false"
aria-controls="{listbox-id}"
aria-activedescendant="{active-option-id}"  // When open
```

### Listbox Attributes
```
role="listbox"
aria-labelledby="{trigger-id}"
```

### Option Attributes
```
role="option"
aria-selected="true|false"
aria-disabled="true"  // If disabled
```

### Keyboard
| Key | Action |
|-----|--------|
| Enter/Space | Open listbox, select focused option |
| Escape | Close listbox |
| ArrowDown | Move focus to next option |
| ArrowUp | Move focus to previous option |
| Home | Move focus to first option |
| End | Move focus to last option |
| Type characters | Focus matching option (typeahead) |

---

## Accordion

### Container
```
// No specific role needed for container
```

### Trigger Attributes
```
<button
  aria-expanded="true|false"
  aria-controls="{panel-id}"
/>
```

### Panel Attributes
```
<div
  id="{panel-id}"
  role="region"
  aria-labelledby="{trigger-id}"
  hidden  // When collapsed
/>
```

### Keyboard
| Key | Action |
|-----|--------|
| Enter/Space | Toggle section |
| ArrowDown | Focus next trigger |
| ArrowUp | Focus previous trigger |
| Home | Focus first trigger |
| End | Focus last trigger |

---

## Tabs

### Tablist Attributes
```
<div role="tablist" aria-label="{tabs-label}">
```

### Tab Attributes
```
<button
  role="tab"
  aria-selected="true|false"
  aria-controls="{panel-id}"
  tabindex="0|-1"  // Only selected tab is in tab order
/>
```

### Panel Attributes
```
<div
  role="tabpanel"
  id="{panel-id}"
  aria-labelledby="{tab-id}"
  tabindex="0"  // Allow panel to receive focus
  hidden  // When not active
/>
```

### Keyboard
| Key | Action |
|-----|--------|
| ArrowLeft | Focus previous tab |
| ArrowRight | Focus next tab |
| Home | Focus first tab |
| End | Focus last tab |
| Enter/Space | Activate focused tab (if manual activation) |

### Focus Pattern
- Automatic activation: Tab selection changes on arrow key
- Manual activation: Arrow keys move focus, Enter/Space activates

---

## Checkbox

### Attributes
```
<input
  type="checkbox"
  role="checkbox"  // Only if not using native input
  aria-checked="true|false|mixed"
  aria-labelledby="{label-id}" | aria-label="{label}"
/>
```

### Keyboard
| Key | Action |
|-----|--------|
| Space | Toggle checked state |

---

## Switch

### Attributes
```
<button
  role="switch"
  aria-checked="true|false"
  aria-labelledby="{label-id}" | aria-label="{label}"
/>
```

### Keyboard
| Key | Action |
|-----|--------|
| Space | Toggle state |
| Enter | Toggle state (optional) |

---

## Tooltip

### Trigger Attributes
```
<button
  aria-describedby="{tooltip-id}"
/>
```

### Tooltip Attributes
```
<div
  id="{tooltip-id}"
  role="tooltip"
/>
```

### Behavior
- Show on hover (after delay)
- Show on focus
- Hide on Escape
- Hide on mouse leave / blur

---

## Dropdown Menu

### Trigger Attributes
```
<button
  aria-haspopup="menu"
  aria-expanded="true|false"
  aria-controls="{menu-id}"
/>
```

### Menu Attributes
```
<div
  role="menu"
  aria-labelledby="{trigger-id}"
/>
```

### Menu Item Attributes
```
<div
  role="menuitem"
  tabindex="-1"
/>

// For checkbox items
role="menuitemcheckbox"
aria-checked="true|false"

// For radio items
role="menuitemradio"
aria-checked="true|false"
```

### Keyboard
| Key | Action |
|-----|--------|
| Enter/Space | Activate item |
| Escape | Close menu |
| ArrowDown | Focus next item |
| ArrowUp | Focus previous item |
| Home | Focus first item |
| End | Focus last item |
| ArrowRight | Open submenu (if present) |
| ArrowLeft | Close submenu |

---

## Toast / Alert

### Attributes
```
<div
  role="alert"        // For important, time-sensitive info
  // OR
  role="status"       // For less urgent updates
  aria-live="polite"  // For status
  // OR
  aria-live="assertive"  // For alerts
  aria-atomic="true"
/>
```

### Best Practices
- Don't auto-dismiss too quickly (5+ seconds minimum)
- Provide dismiss action
- Don't use for critical information that requires user action

---

## Progress

### Attributes
```
<div
  role="progressbar"
  aria-valuenow="{current}"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="{description}" | aria-labelledby="{label-id}"
/>
```

For indeterminate progress, omit `aria-valuenow`.

---

## Alert

### Attributes
```
<div role="alert">
  {content}
</div>
```

The `role="alert"` automatically implies `aria-live="assertive"`.

---

## Avatar

No specific ARIA needed if decorative. If meaningful:
```
<img alt="{person's name}" />
// Or for fallback
<span role="img" aria-label="{person's name}">AB</span>
```

---

## Form Labels

### Pattern
```html
<!-- Explicit association -->
<label for="input-id">Label</label>
<input id="input-id" />

<!-- Implicit association -->
<label>
  Label
  <input />
</label>

<!-- aria-labelledby for complex cases -->
<span id="label-id">Label</span>
<input aria-labelledby="label-id" />
```

### Error States
```html
<input
  aria-invalid="true"
  aria-describedby="error-id"
/>
<span id="error-id">Error message</span>
```

---

## Focus Visible Classes

Always include visible focus indicators:
```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
```

Never remove focus indicators without providing an alternative.
