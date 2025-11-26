# Microinteractions and Feedback Systems

**Related**: [SKILL.md](../SKILL.md) | [touch-interactions.md](touch-interactions.md) | [animation-performance.md](animation-performance.md)

Microinteractions form the nervous system of modern interfaces. When executed correctly, they communicate state, confirm actions, and guide users through complex workflows. Research indicates well-designed microinteractions can boost engagement by up to **12% in click-through rates**.

---

## Table of Contents

1. [Fundamental Principles](#fundamental-principles)
2. [Button State Architecture](#button-state-architecture)
3. [Form Field Interactions](#form-field-interactions)
4. [Toggle and Switch Patterns](#toggle-and-switch-patterns)
5. [Notification Systems](#notification-systems)
6. [Tooltip Accessibility](#tooltip-accessibility)
7. [Microinteraction Categories](#microinteraction-categories)

---

## Fundamental Principles

### The 100ms Rule

Feedback must feel instantaneous—within **100 milliseconds (0.1 seconds)**—to maintain perceptual flow. Beyond this threshold, users perceive delay.

| Response Time | User Perception |
|---------------|-----------------|
| <100ms | Instantaneous |
| 100-300ms | Slight delay, acceptable |
| 300-1000ms | Noticeable delay |
| >1000ms | Requires progress indicator |

### The Doherty Threshold

Responses within **400ms** keep users in flow state. Sites with engaging loading states see **68% higher return rates** compared to static alternatives.

---

## Button State Architecture

Every button requires five distinct visual states:

| State | Response Time | Visual Treatment |
|-------|---------------|------------------|
| Default | — | Primary affordance, clear hierarchy |
| Hover | <100ms | Subtle color shift or elevation |
| Focus | <100ms | Visible outline (2-3px, 3:1 contrast minimum) |
| Active/Pressed | <100ms | Scale reduction (0.95-0.98) or color darkening |
| Disabled | — | 40-60% opacity, no interactive states |

### CSS Implementation

```css
.button {
  /* Base styles */
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;

  /* Smooth transitions */
  transition:
    transform 100ms ease-out,
    background-color 100ms ease-out,
    box-shadow 150ms ease-out;
}

/* Hover state */
.button:hover {
  background-color: var(--color-primary-hover);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Focus state - keyboard navigation */
.button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

/* Active/pressed state */
.button:active {
  transform: scale(0.98);
  background-color: var(--color-primary-active);
}

/* Disabled state */
.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

### Material Design Ripple Effect

The ripple effect should complete in **300-400ms** using `ease-out` timing:

```css
.ripple-button {
  position: relative;
  overflow: hidden;
}

.ripple-button::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 10%, transparent 10%);
  background-position: center;
  background-size: 0 0;
  opacity: 0;
  transition: background-size 400ms ease-out, opacity 400ms ease-out;
}

.ripple-button:active::after {
  background-size: 1000% 1000%;
  opacity: 1;
  transition: 0s;
}
```

### Svelte Button Component

```svelte
<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'ghost' = 'primary';
  export let loading = false;
  export let disabled = false;

  $: isDisabled = disabled || loading;
</script>

<button
  class="btn btn--{variant}"
  class:btn--loading={loading}
  disabled={isDisabled}
  on:click
>
  {#if loading}
    <span class="btn__spinner" aria-hidden="true"></span>
  {/if}
  <span class="btn__content" class:sr-only={loading}>
    <slot />
  </span>
</button>

<style>
  .btn {
    position: relative;
    min-height: 44px;
    min-width: 44px;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition:
      transform 100ms ease-out,
      background-color 100ms ease-out,
      box-shadow 150ms ease-out;
  }

  .btn:active:not(:disabled) {
    transform: scale(0.98);
  }

  .btn:focus-visible {
    outline: 3px solid var(--color-focus, #005fcc);
    outline-offset: 2px;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn__spinner {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 800ms linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
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

---

## Form Field Interactions

### Reward Early, Punish Late Pattern

The most effective validation approach:
- Validate empty required fields **only on submit**
- Show errors **on blur** after interaction
- Remove error indicators **immediately** as users correct input

### Timing Specifications

| Interaction | Timing | Notes |
|-------------|--------|-------|
| Debounce keystroke validation | 300-500ms | After typing stops |
| Error message appearance | 150-200ms | Fade-in |
| Focus border transition | 100-150ms | Using brand accent |
| Success indicator | 200ms | Checkmark animation |

### Implementation

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let value = '';
  export let label: string;
  export let error = '';
  export let required = false;

  let touched = false;
  let inputId = `input-${Math.random().toString(36).slice(2)}`;
  let errorId = `${inputId}-error`;

  function handleBlur() {
    touched = true;
  }

  function handleInput(e: Event) {
    value = (e.target as HTMLInputElement).value;
    // Clear error immediately on correction
    if (error && value) {
      error = '';
    }
  }
</script>

<div class="field" class:field--error={error && touched}>
  <label for={inputId}>{label}</label>
  <input
    id={inputId}
    type="text"
    {value}
    {required}
    aria-invalid={error && touched ? 'true' : undefined}
    aria-describedby={error ? errorId : undefined}
    on:blur={handleBlur}
    on:input={handleInput}
  />
  {#if error && touched}
    <p id={errorId} class="field__error" role="alert" aria-live="polite">
      {error}
    </p>
  {/if}
</div>

<style>
  .field {
    position: relative;
  }

  input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid var(--color-border, #e0e0e0);
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 100ms ease-out, box-shadow 100ms ease-out;
  }

  input:focus {
    outline: none;
    border-color: var(--color-primary, #005fcc);
    box-shadow: 0 0 0 3px rgba(0, 95, 204, 0.2);
  }

  .field--error input {
    border-color: var(--color-error, #d32f2f);
  }

  .field__error {
    margin-top: 4px;
    color: var(--color-error, #d32f2f);
    font-size: 0.875rem;
    animation: fadeIn 150ms ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
```

---

## Toggle and Switch Patterns

### Timing Specifications

| Element | Duration | Easing |
|---------|----------|--------|
| Thumb movement | 100ms | ease-out |
| Color transition | 150ms | ease-out |
| Focus ring | 100ms | ease-out |

### Accessible Toggle Implementation

```svelte
<script lang="ts">
  export let checked = false;
  export let label: string;
  export let disabled = false;

  function toggle() {
    if (!disabled) {
      checked = !checked;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggle();
    }
  }
</script>

<button
  type="button"
  role="switch"
  aria-checked={checked}
  aria-label={label}
  {disabled}
  class="toggle"
  class:toggle--checked={checked}
  on:click={toggle}
  on:keydown={handleKeydown}
>
  <span class="toggle__track">
    <span class="toggle__thumb"></span>
  </span>
  <span class="toggle__label">{label}</span>
</button>

<style>
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 4px;
    background: none;
    border: none;
    cursor: pointer;
    min-height: 44px;
  }

  .toggle:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .toggle:focus-visible {
    outline: 3px solid var(--color-focus, #005fcc);
    outline-offset: 2px;
    border-radius: 24px;
  }

  .toggle__track {
    position: relative;
    width: 52px;
    height: 32px;
    background: var(--color-bg-muted, #e0e0e0);
    border-radius: 16px;
    transition: background-color 150ms ease-out;
  }

  .toggle--checked .toggle__track {
    background: var(--color-primary, #005fcc);
  }

  .toggle__thumb {
    position: absolute;
    top: 4px;
    left: 4px;
    width: 24px;
    height: 24px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: transform 100ms ease-out;
  }

  .toggle--checked .toggle__thumb {
    transform: translateX(20px);
  }
</style>
```

---

## Notification Systems

### Toast Notification Timing

Reading time formula: approximately **100ms per character**.

| Message Length | Display Duration | Notes |
|----------------|------------------|-------|
| <20 characters | 3-5 seconds | Short messages |
| 20-50 characters | 5-8 seconds | Standard messages |
| With action button | Until dismissed | User must interact |
| Maximum stacked | 3 notifications | Carbon Design System |

### Animation Specifications

| Phase | Duration | Easing |
|-------|----------|--------|
| Entrance | 200-300ms | ease-out |
| Exit | 150-200ms | ease-in |
| Auto-dismiss delay | 8 seconds | Carbon recommendation |

### Toast Component

```svelte
<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';

  interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    action?: { label: string; onClick: () => void };
  }

  export let toasts: Toast[] = [];

  function dismiss(id: string) {
    toasts = toasts.filter(t => t.id !== id);
  }

  function calculateDuration(message: string, hasAction: boolean): number {
    if (hasAction) return Infinity;
    return Math.max(3000, message.length * 100);
  }
</script>

<div class="toast-container" role="region" aria-live="polite" aria-label="Notifications">
  {#each toasts as toast (toast.id)}
    <div
      class="toast toast--{toast.type}"
      role="alert"
      in:fly={{ y: 20, duration: 250 }}
      out:fade={{ duration: 150 }}
      animate:flip={{ duration: 200 }}
    >
      <p class="toast__message">{toast.message}</p>
      {#if toast.action}
        <button class="toast__action" on:click={toast.action.onClick}>
          {toast.action.label}
        </button>
      {/if}
      <button
        class="toast__dismiss"
        aria-label="Dismiss notification"
        on:click={() => dismiss(toast.id)}
      >
        ×
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 1000;
    max-width: 400px;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--color-surface, #333);
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .toast--success { border-left: 4px solid #4caf50; }
  .toast--error { border-left: 4px solid #f44336; }
  .toast--warning { border-left: 4px solid #ff9800; }
  .toast--info { border-left: 4px solid #2196f3; }

  .toast__message {
    flex: 1;
    margin: 0;
  }

  .toast__dismiss {
    background: none;
    border: none;
    color: inherit;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 4px;
    opacity: 0.7;
    transition: opacity 100ms;
  }

  .toast__dismiss:hover {
    opacity: 1;
  }
</style>
```

---

## Tooltip Accessibility

### WCAG 1.4.13 Requirements

Tooltips must comply with three requirements:
1. **Dismissible**: Users can dismiss without moving pointer (Escape key)
2. **Hoverable**: Users can hover over tooltip without it disappearing
3. **Persistent**: Tooltip persists until explicitly dismissed

### Timing Specifications

| Interaction | Duration |
|-------------|----------|
| Appearance delay | 300-500ms |
| Keyboard focus | No delay |
| Fade-in animation | 150-200ms |

### Accessible Tooltip Component

```svelte
<script lang="ts">
  import { fade } from 'svelte/transition';

  export let content: string;
  export let position: 'top' | 'bottom' | 'left' | 'right' = 'top';

  let visible = false;
  let hoverTimeout: number;
  let tooltipHovered = false;

  function showTooltip() {
    hoverTimeout = setTimeout(() => {
      visible = true;
    }, 300); // 300ms delay for mouse
  }

  function hideTooltip() {
    clearTimeout(hoverTimeout);
    // Delay hide to allow hovering tooltip
    setTimeout(() => {
      if (!tooltipHovered) {
        visible = false;
      }
    }, 100);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && visible) {
      visible = false;
    }
  }

  function handleFocus() {
    visible = true; // No delay for keyboard focus
  }

  function handleBlur() {
    if (!tooltipHovered) {
      visible = false;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<span
  class="tooltip-wrapper"
  on:mouseenter={showTooltip}
  on:mouseleave={hideTooltip}
  on:focus={handleFocus}
  on:blur={handleBlur}
>
  <slot />
  {#if visible}
    <span
      class="tooltip tooltip--{position}"
      role="tooltip"
      transition:fade={{ duration: 150 }}
      on:mouseenter={() => tooltipHovered = true}
      on:mouseleave={() => { tooltipHovered = false; visible = false; }}
    >
      {content}
    </span>
  {/if}
</span>

<style>
  .tooltip-wrapper {
    position: relative;
    display: inline-block;
  }

  .tooltip {
    position: absolute;
    padding: 8px 12px;
    background: var(--color-surface-dark, #333);
    color: white;
    font-size: 0.875rem;
    border-radius: 4px;
    white-space: nowrap;
    z-index: 1000;
    pointer-events: auto; /* Allow hovering tooltip */
  }

  .tooltip--top {
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
  }

  .tooltip--bottom {
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
  }
</style>
```

---

## Microinteraction Categories

| Type | Best Practice | Example | Usability Benefit |
|------|---------------|---------|-------------------|
| **Feedback Loops** | Deliver instant cues; <300ms | Autocomplete suggestions | Reduces uncertainty |
| **State Changes** | Subtle transitions for toggles | Like/dislike buttons | Enhances intuitiveness |
| **Progress Indicators** | Animate smoothly | Dynamic progress bars | Builds trust (+68% return rate) |
| **Delight Elements** | Incorporate personality sparingly | Task completion animations | Fosters engagement |
| **Error Handling** | Gentle shakes or highlights | Form validation with icons | Guides correction |
| **Real-Time Guidance** | Contextual hints | Password strength checker | Reduces errors |

---

## Quick Reference: Timing Values

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Button hover | <100ms | ease-out |
| Button press | <100ms | ease-out |
| Toggle switch thumb | 100ms | ease-out |
| Toggle color | 150ms | ease-out |
| Tooltip appear | 150-200ms | ease-out |
| Toast entrance | 200-300ms | ease-out |
| Toast exit | 150-200ms | ease-in |
| Ripple effect | 300-400ms | ease-out |
| Form error fade | 150-200ms | ease-out |
| Debounce validation | 300-500ms | — |

---

**Sources**: [Material Design 3](https://m3.material.io/), [Carbon Design System](https://carbondesignsystem.com/), [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/)
