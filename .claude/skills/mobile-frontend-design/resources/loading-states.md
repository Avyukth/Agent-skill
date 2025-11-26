# Loading States & Skeleton Screens

**Related**: [SKILL.md](../SKILL.md) | [animation-performance.md](animation-performance.md) | [microinteractions.md](microinteractions.md)

Loading states communicate system status and maintain user engagement during asynchronous operations. This guide covers skeleton screens, progress indicators, and optimistic UI patterns that minimize perceived latency.

---

## Table of Contents

1. [Psychology of Waiting](#psychology-of-waiting)
2. [Skeleton Screens](#skeleton-screens)
3. [Progress Indicators](#progress-indicators)
4. [Optimistic UI](#optimistic-ui)
5. [Loading State Hierarchy](#loading-state-hierarchy)
6. [Svelte Implementation](#svelte-implementation)

---

## Psychology of Waiting

### Perceived vs Actual Load Time

Users perceive loading time based on feedback quality, not actual duration:

| Feedback Type | Perceived Duration | User Satisfaction |
|---------------|-------------------|-------------------|
| No feedback | Feels 2-3x longer | Low—assumes broken |
| Spinner only | Feels 1.5x longer | Medium |
| Progress bar | Accurate perception | Good |
| Skeleton screen | Feels faster | Excellent |
| Optimistic UI | Nearly instant | Best |

### Key Principles

1. **Show something immediately** (<100ms)
2. **Indicate determinacy when possible** (progress bars over spinners)
3. **Maintain layout stability** (prevent CLS)
4. **Use motion sparingly** (reduces perceived wait)

---

## Skeleton Screens

Skeleton screens show placeholder content that matches the expected layout, creating anticipation rather than frustration.

### Core Principles

```css
/* Skeleton base styles */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 25%,
    var(--color-bg-tertiary) 50%,
    var(--color-bg-secondary) 75%
  );
  background-size: 200% 100%;
  border-radius: 4px;
}

/* Shimmer animation - only when motion allowed */
@media (prefers-reduced-motion: no-preference) {
  .skeleton {
    animation: shimmer 1.5s infinite;
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Skeleton Component Patterns

```svelte
<!-- SkeletonText.svelte -->
<script lang="ts">
  export let lines = 3;
  export let lastLineWidth = '60%';
</script>

<div class="skeleton-text">
  {#each Array(lines) as _, i}
    <div
      class="skeleton skeleton-line"
      style:width={i === lines - 1 ? lastLineWidth : '100%'}
    />
  {/each}
</div>

<style>
  .skeleton-text {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .skeleton-line {
    height: 16px;
  }
</style>
```

```svelte
<!-- SkeletonCard.svelte -->
<script lang="ts">
  export let hasImage = true;
  export let hasActions = false;
</script>

<article class="skeleton-card">
  {#if hasImage}
    <div class="skeleton skeleton-image" />
  {/if}

  <div class="skeleton-content">
    <div class="skeleton skeleton-title" />
    <div class="skeleton-body">
      <div class="skeleton skeleton-line" />
      <div class="skeleton skeleton-line" />
      <div class="skeleton skeleton-line" style:width="75%" />
    </div>
  </div>

  {#if hasActions}
    <div class="skeleton-actions">
      <div class="skeleton skeleton-button" />
      <div class="skeleton skeleton-button" />
    </div>
  {/if}
</article>

<style>
  .skeleton-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    background: var(--color-bg-primary);
    border-radius: 12px;
  }

  .skeleton-image {
    width: 100%;
    aspect-ratio: 16/9;
    border-radius: 8px;
  }

  .skeleton-title {
    height: 24px;
    width: 70%;
  }

  .skeleton-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .skeleton-line {
    height: 14px;
  }

  .skeleton-actions {
    display: flex;
    gap: 12px;
  }

  .skeleton-button {
    height: 36px;
    width: 80px;
    border-radius: 8px;
  }
</style>
```

### Dark Mode Skeleton Colors

```css
:root {
  --skeleton-base: #e5e7eb;
  --skeleton-highlight: #f3f4f6;
}

:root.dark {
  --skeleton-base: #2d2d2d;
  --skeleton-highlight: #3d3d3d;
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--skeleton-base) 25%,
    var(--skeleton-highlight) 50%,
    var(--skeleton-base) 75%
  );
}
```

---

## Progress Indicators

### When to Use Each Type

| Duration | Indicator Type | Notes |
|----------|---------------|-------|
| <300ms | None | Too fast—would flash |
| 300ms-1s | Spinner | Indeterminate, simple |
| 1s-10s | Progress bar | Show determinacy if possible |
| >10s | Progress + time estimate | Manage expectations |

### Determinate Progress Bar

```svelte
<script lang="ts">
  export let progress = 0; // 0-100
  export let label = 'Loading...';
</script>

<div class="progress-container" role="progressbar"
     aria-valuenow={progress}
     aria-valuemin="0"
     aria-valuemax="100"
     aria-label={label}>
  <div class="progress-track">
    <div class="progress-fill" style:width="{progress}%" />
  </div>
  <span class="progress-label">{Math.round(progress)}%</span>
</div>

<style>
  .progress-container {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .progress-track {
    flex: 1;
    height: 8px;
    background: var(--color-bg-secondary);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--color-accent);
    border-radius: 4px;
    transition: width 150ms ease-out;
  }

  .progress-label {
    min-width: 3ch;
    font-variant-numeric: tabular-nums;
    color: var(--color-text-secondary);
  }
</style>
```

### Spinner with Delay

Only show spinner after initial delay to avoid flash:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  export let delay = 300; // ms before showing
  export let size = 24;

  let visible = false;

  onMount(() => {
    const timer = setTimeout(() => visible = true, delay);
    return () => clearTimeout(timer);
  });
</script>

{#if visible}
  <svg
    class="spinner"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    role="status"
    aria-label="Loading"
  >
    <circle
      class="spinner-track"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="3"
    />
    <circle
      class="spinner-head"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
    />
  </svg>
{/if}

<style>
  .spinner {
    color: var(--color-accent);
  }

  .spinner-track {
    opacity: 0.25;
  }

  .spinner-head {
    stroke-dasharray: 45 200;
    stroke-dashoffset: 0;
    transform-origin: center;
  }

  @media (prefers-reduced-motion: no-preference) {
    .spinner-head {
      animation: spin 1.4s linear infinite;
    }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); stroke-dashoffset: 0; }
    50% { stroke-dashoffset: -35; }
    100% { transform: rotate(360deg); stroke-dashoffset: 0; }
  }
</style>
```

### Button Loading State

```svelte
<script lang="ts">
  export let loading = false;
  export let disabled = false;
</script>

<button
  class="btn"
  class:loading
  disabled={disabled || loading}
  aria-busy={loading}
>
  {#if loading}
    <span class="btn-spinner" aria-hidden="true" />
    <span class="btn-text">Loading...</span>
  {:else}
    <slot />
  {/if}
</button>

<style>
  .btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 24px;
    min-width: 120px;
    transition: opacity 150ms ease;
  }

  .btn.loading {
    cursor: wait;
  }

  .btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
  }

  @media (prefers-reduced-motion: no-preference) {
    .btn-spinner {
      animation: spin 0.8s linear infinite;
    }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
```

---

## Optimistic UI

Optimistic UI assumes success and updates the interface immediately, rolling back only on failure.

### When to Use

| Scenario | Optimistic? | Reason |
|----------|-------------|--------|
| Toggle like/favorite | Yes | Low-risk, fast undo |
| Add to cart | Yes | Immediate feedback important |
| Delete item | Cautious | Allow undo window |
| Payment | No | High-stakes, need confirmation |
| Form submission | Partial | Show sending state |

### Implementation Pattern

```svelte
<script lang="ts">
  import { createOptimisticMutation } from '$lib/utils/optimistic';

  interface Todo {
    id: string;
    text: string;
    completed: boolean;
  }

  let todos: Todo[] = [];

  async function toggleTodo(id: string) {
    // Optimistic update
    const todoIndex = todos.findIndex(t => t.id === id);
    const originalState = todos[todoIndex].completed;

    todos[todoIndex].completed = !originalState;
    todos = [...todos]; // Trigger reactivity

    try {
      await api.updateTodo(id, { completed: !originalState });
    } catch (error) {
      // Rollback on failure
      todos[todoIndex].completed = originalState;
      todos = [...todos];

      showToast({
        type: 'error',
        message: 'Failed to update. Please try again.'
      });
    }
  }
</script>
```

### Optimistic Delete with Undo

```svelte
<script lang="ts">
  import { createUndoableAction } from '$lib/utils/undo';

  let items: Item[] = [];
  let pendingDeletes = new Map<string, NodeJS.Timeout>();

  function deleteItem(id: string) {
    // Remove from UI immediately
    const item = items.find(i => i.id === id);
    items = items.filter(i => i.id !== id);

    // Show undo toast
    const toastId = showToast({
      type: 'info',
      message: 'Item deleted',
      action: {
        label: 'Undo',
        onClick: () => undoDelete(id, item)
      },
      duration: 5000
    });

    // Schedule actual deletion
    const timeout = setTimeout(async () => {
      pendingDeletes.delete(id);
      await api.deleteItem(id);
    }, 5000);

    pendingDeletes.set(id, timeout);
  }

  function undoDelete(id: string, item: Item) {
    clearTimeout(pendingDeletes.get(id));
    pendingDeletes.delete(id);
    items = [...items, item].sort((a, b) => a.order - b.order);
  }
</script>
```

---

## Loading State Hierarchy

### Page-Level Loading

```svelte
<!-- +page.svelte -->
<script lang="ts">
  export let data;
</script>

{#if data.loading}
  <PageSkeleton />
{:else if data.error}
  <ErrorState error={data.error} />
{:else}
  <PageContent {data} />
{/if}
```

### Component-Level Loading

```svelte
<!-- DataTable.svelte -->
<script lang="ts">
  export let loading = false;
  export let data: Row[] = [];
</script>

<div class="table-wrapper">
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Status</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      {#if loading}
        {#each Array(5) as _}
          <tr class="skeleton-row">
            <td><div class="skeleton" style:width="60%" /></td>
            <td><div class="skeleton" style:width="80px" /></td>
            <td><div class="skeleton" style:width="100px" /></td>
          </tr>
        {/each}
      {:else if data.length === 0}
        <tr>
          <td colspan="3">
            <EmptyState message="No data available" />
          </td>
        </tr>
      {:else}
        {#each data as row}
          <tr>
            <td>{row.name}</td>
            <td><StatusBadge status={row.status} /></td>
            <td>{formatDate(row.date)}</td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>
```

### Inline Loading (Refresh)

```svelte
<script lang="ts">
  let refreshing = false;

  async function refresh() {
    refreshing = true;
    try {
      await fetchData();
    } finally {
      refreshing = false;
    }
  }
</script>

<header class="list-header">
  <h2>Items</h2>
  <button
    class="refresh-btn"
    class:refreshing
    on:click={refresh}
    disabled={refreshing}
    aria-label={refreshing ? 'Refreshing...' : 'Refresh'}
  >
    <RefreshIcon class:spin={refreshing} />
  </button>
</header>

<!-- Content always visible during refresh -->
<ul class="item-list" class:refreshing>
  {#each items as item}
    <li>{item.name}</li>
  {/each}
</ul>

<style>
  .item-list.refreshing {
    opacity: 0.6;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: no-preference) {
    .spin {
      animation: spin 1s linear infinite;
    }
  }
</style>
```

---

## Svelte Implementation

### Async Await Block Pattern

```svelte
<script lang="ts">
  const dataPromise = fetchData();
</script>

{#await dataPromise}
  <SkeletonCard />
{:then data}
  <Card {data} />
{:catch error}
  <ErrorCard {error} />
{/await}
```

### Loading Store Pattern

```typescript
// lib/stores/loading.ts
import { writable, derived } from 'svelte/store';

interface LoadingState {
  [key: string]: boolean;
}

function createLoadingStore() {
  const { subscribe, update } = writable<LoadingState>({});

  return {
    subscribe,
    start: (key: string) => update(state => ({ ...state, [key]: true })),
    stop: (key: string) => update(state => ({ ...state, [key]: false })),
    isLoading: (key: string) => derived(
      { subscribe },
      $state => $state[key] ?? false
    )
  };
}

export const loading = createLoadingStore();

// Usage
import { loading } from '$lib/stores/loading';

async function fetchUsers() {
  loading.start('users');
  try {
    const users = await api.getUsers();
    return users;
  } finally {
    loading.stop('users');
  }
}
```

### Suspense-Like Pattern

```svelte
<!-- Suspense.svelte -->
<script lang="ts">
  import { onMount, setContext } from 'svelte';
  import { writable } from 'svelte/store';

  const pending = writable(0);

  setContext('suspense', {
    register: () => pending.update(n => n + 1),
    resolve: () => pending.update(n => n - 1)
  });
</script>

{#if $pending > 0}
  <slot name="fallback">
    <div class="suspense-fallback">Loading...</div>
  </slot>
{:else}
  <slot />
{/if}
```

---

## Quick Reference: Loading Patterns

### Decision Tree

```
Is operation instant (<100ms)?
├─ Yes → No loading indicator
└─ No → Continue...
    │
    Can you predict content shape?
    ├─ Yes → Skeleton screen
    └─ No → Continue...
        │
        Is progress determinable?
        ├─ Yes → Progress bar
        └─ No → Spinner (with delay)
```

### Timing Guidelines

| Action | Max Wait Before Indicator |
|--------|--------------------------|
| Button click | 300ms |
| Form submission | 500ms |
| Page navigation | 200ms |
| Data refresh | 300ms |
| File upload | Immediate (progress bar) |

### CLS Prevention

```css
/* Always reserve space for content */
.content-placeholder {
  min-height: 200px;
  contain: layout;
}

/* Use aspect-ratio for images */
.image-skeleton {
  aspect-ratio: 16/9;
  width: 100%;
}
```

---

**Sources**: [web.dev Loading Patterns](https://web.dev/patterns/web-vitals-patterns/), [Material Design Progress Indicators](https://m3.material.io/components/progress-indicators/), [Nielsen Norman Group Response Times](https://www.nngroup.com/articles/response-times-3-important-limits/)
