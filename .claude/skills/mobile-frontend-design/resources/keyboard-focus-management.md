# Keyboard & Focus Management

**Related**: [SKILL.md](../SKILL.md) | [accessibility-mobile.md](accessibility-mobile.md) | [microinteractions.md](microinteractions.md)

Keyboard navigation is essential for accessibility and power users. This guide covers focus management, keyboard shortcuts, focus trapping for modals, and hybrid device considerations.

---

## Table of Contents

1. [Focus Visibility](#focus-visibility)
2. [Focus Order & Flow](#focus-order--flow)
3. [Focus Trapping](#focus-trapping)
4. [Keyboard Shortcuts](#keyboard-shortcuts)
5. [Roving Tabindex](#roving-tabindex)
6. [Hybrid Device Detection](#hybrid-device-detection)
7. [Svelte Implementation](#svelte-implementation)

---

## Focus Visibility

### The :focus-visible Standard

Use `:focus-visible` to show focus rings only for keyboard navigation, not mouse clicks:

```css
/* Remove default focus ring */
:focus {
  outline: none;
}

/* Show focus ring only for keyboard users */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* High contrast mode support */
@media (forced-colors: active) {
  :focus-visible {
    outline: 3px solid CanvasText;
  }
}
```

### Focus Ring Specifications (WCAG 2.2)

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Contrast ratio | 3:1 against adjacent | 4.5:1 |
| Area | 1px perimeter or equivalent | 2px outline |
| Visibility | Must not be hidden | Offset from element |

### Custom Focus Styles

```css
/* Button focus */
.btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
}

/* Card/container focus */
.card:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px; /* Inset for contained look */
}

/* Input focus */
.input:focus-visible {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

/* Link focus (inline) */
a:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: 2px;
}
```

### Dark Mode Focus Rings

```css
:root {
  --focus-ring-color: #3b82f6;
  --focus-ring-shadow: rgba(59, 130, 246, 0.3);
}

:root.dark {
  --focus-ring-color: #60a5fa;
  --focus-ring-shadow: rgba(96, 165, 250, 0.4);
}

:focus-visible {
  outline: 2px solid var(--focus-ring-color);
  box-shadow: 0 0 0 4px var(--focus-ring-shadow);
}
```

---

## Focus Order & Flow

### Logical Tab Order

Focus order should match visual reading order (left-to-right, top-to-bottom for LTR languages):

```html
<!-- ✅ GOOD: Natural DOM order matches visual order -->
<header>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
  </nav>
</header>
<main>
  <h1>Page Title</h1>
  <form>
    <input type="text" name="name" />
    <input type="email" name="email" />
    <button type="submit">Submit</button>
  </form>
</main>
```

```html
<!-- ❌ BAD: Using tabindex to force order -->
<button tabindex="3">Third</button>
<button tabindex="1">First</button>
<button tabindex="2">Second</button>
```

### Managing Focus Programmatically

```typescript
// Move focus after dynamic content load
function focusFirstResult() {
  const firstResult = document.querySelector('.search-result');
  if (firstResult instanceof HTMLElement) {
    firstResult.focus();
  }
}

// Return focus after action
function handleDelete(element: HTMLElement) {
  const nextFocusable = element.nextElementSibling
    ?? element.previousElementSibling
    ?? element.parentElement;

  element.remove();

  if (nextFocusable instanceof HTMLElement) {
    nextFocusable.focus();
  }
}
```

### Skip Links

```svelte
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<nav><!-- Navigation --></nav>

<main id="main-content" tabindex="-1">
  <!-- Main content -->
</main>

<style>
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    padding: 8px 16px;
    background: var(--color-accent);
    color: white;
    z-index: 100;
    transition: top 150ms ease;
  }

  .skip-link:focus {
    top: 0;
  }
</style>
```

---

## Focus Trapping

Focus trapping keeps keyboard focus within a modal or dialog until it's dismissed.

### Focus Trap Implementation

```typescript
// lib/utils/focusTrap.ts
export function createFocusTrap(container: HTMLElement) {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  let previouslyFocused: HTMLElement | null = null;

  function getFocusableElements(): HTMLElement[] {
    return Array.from(container.querySelectorAll(focusableSelectors));
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function activate() {
    previouslyFocused = document.activeElement as HTMLElement;
    container.addEventListener('keydown', handleKeydown);

    // Focus first focusable element
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      container.focus();
    }
  }

  function deactivate() {
    container.removeEventListener('keydown', handleKeydown);

    // Return focus to trigger element
    if (previouslyFocused) {
      previouslyFocused.focus();
    }
  }

  return { activate, deactivate };
}
```

### Svelte Focus Trap Action

```svelte
<script lang="ts">
  import { createFocusTrap } from '$lib/utils/focusTrap';

  export function focusTrap(node: HTMLElement) {
    const trap = createFocusTrap(node);
    trap.activate();

    return {
      destroy() {
        trap.deactivate();
      }
    };
  }
</script>

<!-- Usage -->
<div class="modal" use:focusTrap>
  <h2>Modal Title</h2>
  <p>Modal content...</p>
  <button on:click={close}>Close</button>
</div>
```

### Modal with Focus Management

```svelte
<!-- Modal.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { focusTrap } from '$lib/actions/focusTrap';

  export let open = false;
  export let title: string;

  const dispatch = createEventDispatcher();
  let modalElement: HTMLElement;
  let previouslyFocused: HTMLElement | null = null;

  function close() {
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      close();
    }
  }

  $: if (open) {
    previouslyFocused = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
    previouslyFocused?.focus();
  }

  onDestroy(() => {
    document.body.style.overflow = '';
  });
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <div class="modal-backdrop" on:click={close} aria-hidden="true" />
  <div
    class="modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    use:focusTrap
    bind:this={modalElement}
  >
    <header class="modal-header">
      <h2 id="modal-title">{title}</h2>
      <button
        class="modal-close"
        on:click={close}
        aria-label="Close modal"
      >
        ×
      </button>
    </header>
    <div class="modal-content">
      <slot />
    </div>
    <footer class="modal-footer">
      <slot name="footer" />
    </footer>
  </div>
{/if}
```

---

## Keyboard Shortcuts

### Shortcut Registration Pattern

```typescript
// lib/stores/shortcuts.ts
import { writable, get } from 'svelte/store';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
}

function createShortcutStore() {
  const shortcuts = writable<Map<string, Shortcut>>(new Map());

  function getKey(shortcut: Omit<Shortcut, 'action' | 'description'>): string {
    const parts = [];
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.meta) parts.push('meta');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }

  function register(shortcut: Shortcut): () => void {
    const key = getKey(shortcut);
    shortcuts.update(map => {
      map.set(key, shortcut);
      return map;
    });

    return () => {
      shortcuts.update(map => {
        map.delete(key);
        return map;
      });
    };
  }

  function handleKeydown(event: KeyboardEvent) {
    // Don't trigger in input fields
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target as HTMLElement).isContentEditable
    ) {
      return;
    }

    const key = getKey({
      key: event.key,
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey,
    });

    const shortcut = get(shortcuts).get(key);
    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }

  return {
    subscribe: shortcuts.subscribe,
    register,
    handleKeydown,
  };
}

export const shortcuts = createShortcutStore();
```

### Common Keyboard Patterns

| Pattern | Key | Action |
|---------|-----|--------|
| Close | `Escape` | Close modal/dropdown/overlay |
| Submit | `Enter` | Submit form, confirm action |
| Select | `Space` | Toggle checkbox, activate button |
| Navigate | `Arrow keys` | Move within list/menu |
| Jump | `Tab` / `Shift+Tab` | Move between focusable elements |
| Search | `/` or `Ctrl+K` | Focus search input |
| Help | `?` | Show keyboard shortcuts |

### Keyboard Shortcut Help Modal

```svelte
<script lang="ts">
  import { shortcuts } from '$lib/stores/shortcuts';
  import { onMount } from 'svelte';

  let showHelp = false;

  onMount(() => {
    return shortcuts.register({
      key: '?',
      shift: true,
      action: () => showHelp = true,
      description: 'Show keyboard shortcuts'
    });
  });
</script>

{#if showHelp}
  <Modal title="Keyboard Shortcuts" on:close={() => showHelp = false}>
    <dl class="shortcut-list">
      {#each [...$shortcuts.values()] as shortcut}
        <div class="shortcut-item">
          <dt>
            <kbd>{formatShortcut(shortcut)}</kbd>
          </dt>
          <dd>{shortcut.description}</dd>
        </div>
      {/each}
    </dl>
  </Modal>
{/if}

<style>
  .shortcut-list {
    display: grid;
    gap: 12px;
  }

  .shortcut-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  kbd {
    padding: 4px 8px;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.875rem;
  }
</style>
```

---

## Roving Tabindex

For composite widgets (menus, toolbars, tabs), use roving tabindex to allow arrow key navigation within the group while maintaining a single tab stop.

### Roving Tabindex Implementation

```svelte
<script lang="ts">
  export let items: { id: string; label: string }[];
  export let onSelect: (id: string) => void;

  let activeIndex = 0;

  function handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        activeIndex = (activeIndex + 1) % items.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        activeIndex = (activeIndex - 1 + items.length) % items.length;
        break;
      case 'Home':
        event.preventDefault();
        activeIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        activeIndex = items.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect(items[activeIndex].id);
        break;
    }
  }

  // Auto-focus when activeIndex changes
  $: {
    const button = document.querySelector(
      `[data-index="${activeIndex}"]`
    ) as HTMLElement;
    button?.focus();
  }
</script>

<div
  class="toolbar"
  role="toolbar"
  aria-label="Actions"
  on:keydown={handleKeydown}
>
  {#each items as item, index}
    <button
      type="button"
      role="button"
      data-index={index}
      tabindex={index === activeIndex ? 0 : -1}
      aria-pressed={item.id === selectedId}
      on:click={() => onSelect(item.id)}
    >
      {item.label}
    </button>
  {/each}
</div>
```

### Tab Panel Implementation

```svelte
<script lang="ts">
  export let tabs: { id: string; label: string; content: string }[];

  let activeTab = tabs[0]?.id;
  let activeTabIndex = 0;

  function handleTabKeydown(event: KeyboardEvent) {
    const tabCount = tabs.length;

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        activeTabIndex = (activeTabIndex + 1) % tabCount;
        activeTab = tabs[activeTabIndex].id;
        break;
      case 'ArrowLeft':
        event.preventDefault();
        activeTabIndex = (activeTabIndex - 1 + tabCount) % tabCount;
        activeTab = tabs[activeTabIndex].id;
        break;
      case 'Home':
        event.preventDefault();
        activeTabIndex = 0;
        activeTab = tabs[0].id;
        break;
      case 'End':
        event.preventDefault();
        activeTabIndex = tabCount - 1;
        activeTab = tabs[tabCount - 1].id;
        break;
    }
  }

  $: {
    const tabElement = document.querySelector(
      `[data-tab="${activeTab}"]`
    ) as HTMLElement;
    tabElement?.focus();
  }
</script>

<div class="tabs">
  <div
    class="tab-list"
    role="tablist"
    aria-label="Content tabs"
    on:keydown={handleTabKeydown}
  >
    {#each tabs as tab, index}
      <button
        type="button"
        role="tab"
        id="tab-{tab.id}"
        data-tab={tab.id}
        aria-selected={activeTab === tab.id}
        aria-controls="panel-{tab.id}"
        tabindex={activeTab === tab.id ? 0 : -1}
        on:click={() => { activeTab = tab.id; activeTabIndex = index; }}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  {#each tabs as tab}
    <div
      role="tabpanel"
      id="panel-{tab.id}"
      aria-labelledby="tab-{tab.id}"
      hidden={activeTab !== tab.id}
      tabindex="0"
    >
      {tab.content}
    </div>
  {/each}
</div>
```

---

## Hybrid Device Detection

Modern devices often have both touch and keyboard input. Detect input method to provide appropriate UI.

### Input Modality Detection

```typescript
// lib/stores/inputMode.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type InputMode = 'keyboard' | 'pointer' | 'touch';

function createInputModeStore() {
  const mode = writable<InputMode>('pointer');

  if (browser) {
    // Detect keyboard usage
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        mode.set('keyboard');
      }
    });

    // Detect pointer usage
    window.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') {
        mode.set('touch');
      } else {
        mode.set('pointer');
      }
    });
  }

  return {
    subscribe: mode.subscribe,
  };
}

export const inputMode = createInputModeStore();
```

### Conditional Focus Styles

```css
/* Only show focus rings for keyboard users */
[data-input-mode="keyboard"] :focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Hide focus rings for pointer/touch users */
[data-input-mode="pointer"] :focus,
[data-input-mode="touch"] :focus {
  outline: none;
}

/* Always show focus for forced-colors mode */
@media (forced-colors: active) {
  :focus-visible {
    outline: 3px solid CanvasText !important;
  }
}
```

### Layout Integration

```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { inputMode } from '$lib/stores/inputMode';

  onMount(() => {
    return inputMode.subscribe(mode => {
      document.documentElement.dataset.inputMode = mode;
    });
  });
</script>

<slot />
```

---

## Svelte Implementation

### Focus Management Action

```typescript
// lib/actions/focus.ts
export function autofocus(node: HTMLElement, enabled = true) {
  if (enabled) {
    // Delay to ensure element is in DOM
    requestAnimationFrame(() => {
      node.focus();
    });
  }

  return {
    update(newEnabled: boolean) {
      if (newEnabled) {
        node.focus();
      }
    }
  };
}

export function returnFocus(node: HTMLElement) {
  const previouslyFocused = document.activeElement as HTMLElement;

  return {
    destroy() {
      previouslyFocused?.focus();
    }
  };
}
```

### Keyboard Navigation Store

```typescript
// lib/stores/keyboard.ts
import { readable } from 'svelte/store';
import { browser } from '$app/environment';

export const isKeyboardUser = readable(false, (set) => {
  if (!browser) return;

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      set(true);
    }
  }

  function handleMousedown() {
    set(false);
  }

  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('mousedown', handleMousedown);

  return () => {
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('mousedown', handleMousedown);
  };
});
```

---

## Quick Reference: Focus Checklist

### Accessibility Requirements

- [ ] All interactive elements are keyboard accessible
- [ ] Focus order matches visual reading order
- [ ] Focus is visible with 3:1 contrast ratio
- [ ] Focus is not trapped unexpectedly
- [ ] Modals trap focus appropriately
- [ ] Focus returns to trigger after modal close
- [ ] Skip links are provided
- [ ] Custom widgets use roving tabindex

### Common Keyboard Shortcuts

| Key | Context | Action |
|-----|---------|--------|
| `Tab` | Global | Move to next focusable |
| `Shift+Tab` | Global | Move to previous focusable |
| `Enter` | Button/Link | Activate |
| `Space` | Button/Checkbox | Activate/Toggle |
| `Escape` | Modal/Menu | Close |
| `Arrow keys` | Menu/Tabs | Navigate within |
| `Home/End` | List/Menu | First/Last item |

### Focus Ring CSS

```css
/* Standard focus ring */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Input focus */
input:focus-visible,
textarea:focus-visible {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--focus-ring-shadow);
}
```

---

**Sources**: [WCAG 2.2 Focus Guidelines](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html), [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/), [Inclusive Components](https://inclusive-components.design/)
