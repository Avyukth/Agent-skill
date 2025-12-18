# Leptos (Rust/WASM) Translation Guide

Patterns for implementing shadcn/ui components in Leptos. This guide helps translate the React/Radix patterns into idiomatic Rust.

## Critical Reactivity Rules

**NEVER rely on component function re-execution for updates.** Unlike React's VDOM, Leptos runs the component function ONCE to set up the reactive graph. Signals bind directly to DOM nodes.

```rust
// ❌ WRONG - evaluates once at setup, never updates
let button_class = if count > 5 { "red" } else { "blue" };

// ✅ CORRECT - creates a reactive closure that updates the DOM
let button_class = move || if count.get() > 5 { "red" } else { "blue" };
```

## Setup Requirements

### Cargo.toml Dependencies
```toml
[dependencies]
leptos = { version = "0.6", features = ["csr"] }  # Or "ssr", "hydrate"
wasm-bindgen = "0.2"
web-sys = { version = "0.3", features = ["Element", "HtmlElement", "KeyboardEvent", "FocusEvent"] }

# CVA equivalent - RECOMMENDED for variant management
tailwind_fuse = "0.3"

# For fallback behaviors when primitives are missing
leptos-use = "0.10"

# Icons (lucide-react equivalent)
icondata = "0.3"
leptos_icons = "0.3"

# Radix primitives (use feature flags for what you need)
radix-leptos-dialog = { version = "0.1", features = ["dialog"] }
radix-leptos-popover = { version = "0.1", features = ["popover"] }
radix-leptos-switch = { version = "0.1", features = ["switch"] }
radix-leptos-checkbox = { version = "0.1", features = ["checkbox"] }
```

### Tailwind Setup
1. Install Tailwind CSS for your Leptos project (via Trunk)
2. Add the shadcn CSS variables to your `globals.css` (see `assets/base-css/globals.css`)
3. Configure `tailwind.config.js` to scan `.rs` files: `content: ["./src/**/*.rs"]`

## Core Patterns

### CVA Equivalent: `tailwind_fuse` (Recommended)

The `tailwind_fuse` crate provides compile-time CVA equivalent with `TwClass` and `TwVariant` derive macros:

```rust
use tailwind_fuse::*;

// Define the main class struct with base classes
#[derive(TwClass)]
#[tw(class = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50")]
pub struct ButtonClass {
    pub variant: ButtonVariant,
    pub size: ButtonSize,
}

// Define variant enum
#[derive(TwVariant)]
pub enum ButtonVariant {
    #[tw(default, class = "bg-primary text-primary-foreground hover:bg-primary/90")]
    Default,
    #[tw(class = "bg-destructive text-destructive-foreground hover:bg-destructive/90")]
    Destructive,
    #[tw(class = "border border-input bg-background hover:bg-accent hover:text-accent-foreground")]
    Outline,
    #[tw(class = "bg-secondary text-secondary-foreground hover:bg-secondary/80")]
    Secondary,
    #[tw(class = "hover:bg-accent hover:text-accent-foreground")]
    Ghost,
    #[tw(class = "text-primary underline-offset-4 hover:underline")]
    Link,
}

// Define size enum
#[derive(TwVariant)]
pub enum ButtonSize {
    #[tw(default, class = "h-10 px-4 py-2")]
    Default,
    #[tw(class = "h-9 rounded-md px-3")]
    Sm,
    #[tw(class = "h-11 rounded-md px-8")]
    Lg,
    #[tw(class = "h-10 w-10")]
    Icon,
}

// Usage - generates merged class string
let classes = ButtonClass {
    variant: ButtonVariant::Destructive,
    size: ButtonSize::Lg,
}.with_class("my-custom-class"); // Appends additional classes
```

### Class Merging with `tw_merge!`

For dynamic class merging (cn() equivalent):

```rust
use tailwind_fuse::tw_merge;

// Merges classes, later values override conflicting earlier ones
let class = tw_merge!(
    "text-red-500 p-4",
    is_error.then_some("font-bold"),  // Conditional class
    custom_class.unwrap_or_default()  // Optional additional class
);
```

**Note:** Use `.then_some()` for conditional classes (Rust equivalent of `&&` short-circuit in JS).

### Props Pattern with `MaybeProp`

Use `MaybeProp<T>` for optional props that should auto-coerce:

```rust
use leptos::*;
use tailwind_fuse::*;

#[component]
pub fn Button(
    /// Button variant - uses MaybeProp for ergonomic API
    #[prop(optional, into)]
    variant: MaybeProp<ButtonVariant>,
    /// Button size
    #[prop(optional, into)]
    size: MaybeProp<ButtonSize>,
    /// Additional CSS classes - MaybeProp auto-coerces String, &str, etc.
    #[prop(optional, into)]
    class: MaybeProp<String>,
    /// Disabled state
    #[prop(default = false)]
    disabled: bool,
    /// HTML attributes spreading ({...props} equivalent)
    #[prop(attrs)]
    attributes: Vec<(&'static str, Attribute)>,
    /// Button content
    children: Children,
) -> impl IntoView {
    // Create reactive class computation
    let class = move || {
        let variant = variant.get().unwrap_or(ButtonVariant::Default);
        let size = size.get().unwrap_or(ButtonSize::Default);
        ButtonClass { variant, size }
            .with_class(class.get().unwrap_or_default())
    };

    view! {
        <button
            {..attributes}  // Spread HTML attributes
            class=class
            disabled=disabled
        >
            {children()}
        </button>
    }
}
```

### Attribute Spreading (`{...props}` Equivalent)

React's `{...props}` for passing arbitrary HTML attributes:

```rust
#[component]
pub fn Input(
    #[prop(optional, into)] class: MaybeProp<String>,
    // This captures all HTML attributes passed to the component
    #[prop(attrs)] attributes: Vec<(&'static str, Attribute)>,
) -> impl IntoView {
    view! {
        <input
            {..attributes}  // Spreads all captured attributes
            class=move || tw_merge!("base-classes", class.get().unwrap_or_default())
        />
    }
}

// Usage - any HTML attribute works
view! {
    <Input
        type="email"
        placeholder="Enter email"
        required=true
        class="w-full"
    />
}
```

## Radix-Leptos Capabilities Matrix

Check this before generating code. Use the crate if supported; otherwise, implement fallback.

| Shadcn Component | Radix Crate | Status | Fallback Strategy |
|------------------|-------------|--------|-------------------|
| Dialog | `radix-leptos-dialog` | ✅ Supported | - |
| Popover | `radix-leptos-popover` | ✅ Supported | - |
| Switch | `radix-leptos-switch` | ✅ Supported | - |
| Checkbox | `radix-leptos-checkbox` | ✅ Supported | - |
| Accordion | `radix-leptos-accordion` | ✅ Supported | - |
| Separator | `radix-leptos-separator` | ✅ Supported | - |
| Tabs | `radix-leptos-tabs` | ⚠️ Partial | Manual keyboard nav |
| Select | - | ❌ Missing | `leptos-use` + manual |
| Command | - | ❌ Missing | Manual implementation |
| Calendar | - | ❌ Missing | Manual or `chrono` |
| Context Menu | - | ❌ Missing | `on_click_outside` |

## Fallback Strategies with `leptos-use`

When radix-leptos primitives are missing, use `leptos-use` hooks:

### Click Outside (for Popovers, Dropdowns, Context Menus)

```rust
use leptos::*;
use leptos::html::Div;
use leptos_use::on_click_outside;

#[component]
pub fn CustomPopover(
    #[prop(into)] open: RwSignal<bool>,
    children: Children,
) -> impl IntoView {
    let target = NodeRef::<Div>::new();

    // Close when clicking outside the target div
    let _ = on_click_outside(target, move |_| {
        open.set(false);
    });

    view! {
        <Show when=move || open.get()>
            <div node_ref=target class="popover-content">
                {children()}
            </div>
        </Show>
    }
}
```

### Focus Trap (for Modals)

```rust
use leptos::*;
use leptos_use::use_focus_trap;

#[component]
pub fn FocusTrappedDialog(
    #[prop(into)] open: RwSignal<bool>,
    children: Children,
) -> impl IntoView {
    let container = NodeRef::<html::Div>::new();
    
    // Trap focus within container when open
    let _ = use_focus_trap(container, UseFocusTrapOptions::default());

    view! {
        <Show when=move || open.get()>
            <div node_ref=container tabindex="-1" role="dialog" aria-modal="true">
                {children()}
            </div>
        </Show>
    }
}
```

### Escape Key Handler

```rust
use leptos::*;
use leptos_use::{use_event_listener, use_document};

#[component]
pub fn EscapeCloseable(
    #[prop(into)] open: RwSignal<bool>,
    children: Children,
) -> impl IntoView {
    // Listen for Escape key on document
    let _ = use_event_listener(use_document(), ev::keydown, move |e| {
        if e.key() == "Escape" && open.get() {
            open.set(false);
        }
    });

    view! {
        <Show when=move || open.get()>
            {children()}
        </Show>
    }
}
```

### Scroll Lock (for Modals)

```rust
use leptos_use::use_scroll_lock;

// In your modal component:
let is_locked = use_scroll_lock(use_document().body());

create_effect(move |_| {
    is_locked.set(open.get()); // Lock scroll when modal opens
});
```

## Component Implementations

### Input (with MaybeProp pattern)

```rust
use leptos::*;
use tailwind_fuse::tw_merge;

#[component]
pub fn Input(
    #[prop(optional, into)] r#type: MaybeProp<String>,
    #[prop(optional, into)] placeholder: MaybeProp<String>,
    #[prop(optional, into)] class: MaybeProp<String>,
    #[prop(default = false)] disabled: bool,
    #[prop(optional, into)] value: Option<RwSignal<String>>,
    #[prop(attrs)] attributes: Vec<(&'static str, Attribute)>,
) -> impl IntoView {
    let class = move || {
        tw_merge!(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            class.get().unwrap_or_default()
        )
    };

    view! {
        <input
            {..attributes}
            type=move || r#type.get().unwrap_or_else(|| "text".to_string())
            class=class
            placeholder=move || placeholder.get().unwrap_or_default()
            disabled=disabled
            prop:value=move || value.map(|v| v.get()).unwrap_or_default()
            on:input=move |e| {
                if let Some(signal) = value {
                    signal.set(event_target_value(&e));
                }
            }
        />
    }
}
```

### Card (Compound Component with tw_merge)

```rust
use leptos::*;
use tailwind_fuse::tw_merge;

#[component]
pub fn Card(
    #[prop(optional, into)] class: MaybeProp<String>,
    #[prop(attrs)] attributes: Vec<(&'static str, Attribute)>,
    children: Children,
) -> impl IntoView {
    let class = move || {
        tw_merge!(
            "rounded-lg border bg-card text-card-foreground shadow-sm",
            class.get().unwrap_or_default()
        )
    };

    view! {
        <div {..attributes} class=class>
            {children()}
        </div>
    }
}

#[component]
pub fn CardHeader(
    #[prop(optional, into)] class: MaybeProp<String>,
    children: Children,
) -> impl IntoView {
    let class = move || {
        tw_merge!("flex flex-col space-y-1.5 p-6", class.get().unwrap_or_default())
    };

    view! { <div class=class>{children()}</div> }
}

#[component]
pub fn CardTitle(
    #[prop(optional, into)] class: MaybeProp<String>,
    children: Children,
) -> impl IntoView {
    let class = move || {
        tw_merge!(
            "text-2xl font-semibold leading-none tracking-tight",
            class.get().unwrap_or_default()
        )
    };

    view! { <h3 class=class>{children()}</h3> }
}

#[component]
pub fn CardDescription(
    #[prop(optional, into)] class: MaybeProp<String>,
    children: Children,
) -> impl IntoView {
    let class = move || {
        tw_merge!("text-sm text-muted-foreground", class.get().unwrap_or_default())
    };

    view! { <p class=class>{children()}</p> }
}

#[component]
pub fn CardContent(
    #[prop(optional, into)] class: MaybeProp<String>,
    children: Children,
) -> impl IntoView {
    let class = move || tw_merge!("p-6 pt-0", class.get().unwrap_or_default());
    view! { <div class=class>{children()}</div> }
}

#[component]
pub fn CardFooter(
    #[prop(optional, into)] class: MaybeProp<String>,
    children: Children,
) -> impl IntoView {
    let class = move || {
        tw_merge!("flex items-center p-6 pt-0", class.get().unwrap_or_default())
    };

    view! { <div class=class>{children()}</div> }
}
```

### Dialog (using radix-leptos-dialog)

When radix-leptos-dialog is available, use it for proper accessibility:

```rust
use leptos::*;
use radix_leptos_dialog::*;
use tailwind_fuse::tw_merge;
use leptos_icons::Icon;
use icondata as i;

// Re-export primitives that don't need styling
pub use radix_leptos_dialog::{Dialog, DialogTrigger, DialogPortal, DialogClose};

#[component]
pub fn DialogOverlay(
    #[prop(optional, into)] class: MaybeProp<String>,
) -> impl IntoView {
    let class = move || {
        tw_merge!(
            "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            class.get().unwrap_or_default()
        )
    };

    view! { <radix_leptos_dialog::DialogOverlay class=class /> }
}

#[component]
pub fn DialogContent(
    #[prop(optional, into)] class: MaybeProp<String>,
    children: Children,
) -> impl IntoView {
    let class = move || {
        tw_merge!(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
            class.get().unwrap_or_default()
        )
    };

    view! {
        <DialogPortal>
            <DialogOverlay />
            <radix_leptos_dialog::DialogContent class=class>
                {children()}
                <DialogClose class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <Icon icon=i::LuX class="h-4 w-4" />
                    <span class="sr-only">"Close"</span>
                </DialogClose>
            </radix_leptos_dialog::DialogContent>
        </DialogPortal>
    }
}

#[component]
pub fn DialogHeader(
    #[prop(optional, into)] class: MaybeProp<String>,
    children: Children,
) -> impl IntoView {
    let class = move || {
        tw_merge!(
            "flex flex-col space-y-1.5 text-center sm:text-left",
            class.get().unwrap_or_default()
        )
    };
    view! { <div class=class>{children()}</div> }
}

#[component]
pub fn DialogTitle(
    #[prop(optional, into)] class: MaybeProp<String>,
    children: Children,
) -> impl IntoView {
    let class = move || {
        tw_merge!(
            "text-lg font-semibold leading-none tracking-tight",
            class.get().unwrap_or_default()
        )
    };
    // Use radix DialogTitle for proper aria-labelledby
    view! { <radix_leptos_dialog::DialogTitle class=class>{children()}</radix_leptos_dialog::DialogTitle> }
}

#[component]
pub fn DialogDescription(
    #[prop(optional, into)] class: MaybeProp<String>,
    children: Children,
) -> impl IntoView {
    let class = move || {
        tw_merge!("text-sm text-muted-foreground", class.get().unwrap_or_default())
    };
    view! { <radix_leptos_dialog::DialogDescription class=class>{children()}</radix_leptos_dialog::DialogDescription> }
}

#[component]
pub fn DialogFooter(
    #[prop(optional, into)] class: MaybeProp<String>,
    children: Children,
) -> impl IntoView {
    let class = move || {
        tw_merge!(
            "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
            class.get().unwrap_or_default()
        )
    };
    view! { <div class=class>{children()}</div> }
}
```

### Dialog Fallback (when radix-leptos-dialog unavailable)

If the radix crate is missing, implement manually with leptos-use:

```rust
use leptos::*;
use leptos::html::Div;
use leptos_use::{on_click_outside, use_event_listener, use_document, use_focus_trap};
use tailwind_fuse::tw_merge;

#[component]
pub fn DialogFallback(
    open: RwSignal<bool>,
    #[prop(optional)] on_close: Option<Callback<()>>,
    children: Children,
) -> impl IntoView {
    let dialog_ref = NodeRef::<Div>::new();

    // Close on Escape
    let _ = use_event_listener(use_document(), ev::keydown, move |e| {
        if e.key() == "Escape" && open.get() {
            open.set(false);
            if let Some(handler) = &on_close {
                handler.call(());
            }
        }
    });

    // Focus trap
    let _ = use_focus_trap(dialog_ref, Default::default());

    // Focus dialog on open
    create_effect(move |_| {
        if open.get() {
            if let Some(el) = dialog_ref.get() {
                let _ = el.focus();
            }
        }
    });

    let handle_overlay_click = move |_| {
        open.set(false);
        if let Some(handler) = &on_close {
            handler.call(());
        }
    };

    view! {
        <Show when=move || open.get()>
            <div class="fixed inset-0 z-50">
                <div
                    class="fixed inset-0 bg-black/80 animate-in fade-in-0"
                    on:click=handle_overlay_click
                />
                <div
                    node_ref=dialog_ref
                    tabindex="-1"
                    role="dialog"
                    aria-modal="true"
                    class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg animate-in fade-in-0 zoom-in-95"
                >
                    {children()}
                </div>
            </div>
        </Show>
    }
}
```

### Switch (using radix-leptos-switch or manual)

```rust
use leptos::*;
use tailwind_fuse::tw_merge;

// If using radix-leptos-switch:
// use radix_leptos_switch::*;

#[component]
pub fn Switch(
    checked: RwSignal<bool>,
    #[prop(default = false)] disabled: bool,
    #[prop(optional, into)] class: MaybeProp<String>,
    #[prop(optional)] on_change: Option<Callback<bool>>,
) -> impl IntoView {
    let toggle = move |_| {
        if !disabled {
            let new_value = !checked.get();
            checked.set(new_value);
            if let Some(handler) = &on_change {
                handler.call(new_value);
            }
        }
    };

    let root_class = move || {
        tw_merge!(
            "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
            if checked.get() { "bg-primary" } else { "bg-input" },
            class.get().unwrap_or_default()
        )
    };

    let thumb_class = move || {
        tw_merge!(
            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
            if checked.get() { "translate-x-5" } else { "translate-x-0" }
        )
    };

    view! {
        <button
            type="button"
            role="switch"
            aria-checked=move || checked.get().to_string()
            class=root_class
            disabled=disabled
            on:click=toggle
        >
            <span class=thumb_class />
        </button>
    }
}
```

### Checkbox

```rust
use leptos::*;
use leptos_icons::Icon;
use icondata as i;
use tailwind_fuse::tw_merge;

#[component]
pub fn Checkbox(
    checked: RwSignal<bool>,
    #[prop(default = false)] disabled: bool,
    #[prop(optional, into)] class: MaybeProp<String>,
    #[prop(optional)] on_change: Option<Callback<bool>>,
) -> impl IntoView {
    let toggle = move |_| {
        if !disabled {
            let new_value = !checked.get();
            checked.set(new_value);
            if let Some(handler) = &on_change {
                handler.call(new_value);
            }
        }
    };

    let root_class = move || {
        tw_merge!(
            "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            checked.get().then_some("bg-primary text-primary-foreground"),
            class.get().unwrap_or_default()
        )
    };

    view! {
        <button
            type="button"
            role="checkbox"
            aria-checked=move || checked.get().to_string()
            class=root_class
            disabled=disabled
            on:click=toggle
        >
            <Show when=move || checked.get()>
                <span class="flex items-center justify-center text-current">
                    <Icon icon=i::LuCheck class="h-4 w-4" />
                </span>
            </Show>
        </button>
    }
}
```

## React Hooks → Leptos Signals Translation

| React Concept | React Syntax | Leptos Equivalent | Notes |
|---------------|--------------|-------------------|-------|
| State | `useState(0)` | `create_signal(0)` | React returns `[val, setVal]`; Leptos returns `(getter, setter)`. **Call getter as function**: `val.get()` |
| Side Effect | `useEffect(() => ...)` | `create_effect(move \|\| ...)` | Avoid when possible; prefer derived signals |
| Reference | `useRef(null)` | `NodeRef::new()` | Bound via `node_ref=my_ref` |
| Memoization | `useMemo(() => ...)` | `create_memo(move \|\| ...)` | Cached derived value |
| Context | `useContext(Ctx)` | `use_context::<Ctx>()` | Leptos context typed by struct |
| Callback | `useCallback(...)` | `move \|\| ...` | Just use closures |

## Using with RustForWeb/shadcn-ui

The [RustForWeb/shadcn-ui](https://github.com/RustForWeb/shadcn-ui) repository provides partial Leptos ports. Integration strategy:

### Check Existing Components First
```rust
// If RustForWeb has the component, use it:
use rustforweb_shadcn::button::Button;

// For components not yet ported, use patterns from this guide
mod custom_components;
pub use custom_components::*;
```

### Extending Missing Components
When RustForWeb lacks a component:
1. Reference this guide's component anatomy (`references/component-anatomy.md`)
2. Apply `tailwind_fuse` patterns for styling
3. Use `radix-leptos-*` if primitive exists
4. Fall back to `leptos-use` for behavior

### Contributing Back
Generated components following this guide's patterns can be contributed to RustForWeb. Ensure:
- Uses `MaybeProp<T>` for optional props
- Uses `tailwind_fuse` macros
- Includes proper ARIA attributes
- Passes `cargo clippy` with no warnings

## Animation with Leptos

For animations matching shadcn's `data-state` patterns:

```css
/* Add to your CSS (or use tailwindcss-animate plugin) */
.animate-in {
  animation-duration: 150ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  animation-fill-mode: both;
}

.fade-in-0 { animation-name: fadeIn; }
.zoom-in-95 { animation-name: zoomIn; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

In Leptos components, use data attributes for state-based styling:
```rust
view! {
    <div
        class="animate-in fade-in-0 zoom-in-95"
        data-state=move || if open.get() { "open" } else { "closed" }
    >
        // content
    </div>
}
```

## Complete Button Example (Production-Ready)

Putting it all together with `tailwind_fuse`:

```rust
use leptos::*;
use tailwind_fuse::*;

#[derive(TwClass)]
#[tw(class = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50")]
pub struct ButtonClass {
    pub variant: ButtonVariant,
    pub size: ButtonSize,
}

#[derive(TwVariant, Clone, Copy, Default)]
pub enum ButtonVariant {
    #[tw(default, class = "bg-primary text-primary-foreground hover:bg-primary/90")]
    Default,
    #[tw(class = "bg-destructive text-destructive-foreground hover:bg-destructive/90")]
    Destructive,
    #[tw(class = "border border-input bg-background hover:bg-accent hover:text-accent-foreground")]
    Outline,
    #[tw(class = "bg-secondary text-secondary-foreground hover:bg-secondary/80")]
    Secondary,
    #[tw(class = "hover:bg-accent hover:text-accent-foreground")]
    Ghost,
    #[tw(class = "text-primary underline-offset-4 hover:underline")]
    Link,
}

#[derive(TwVariant, Clone, Copy, Default)]
pub enum ButtonSize {
    #[tw(default, class = "h-10 px-4 py-2")]
    Default,
    #[tw(class = "h-9 rounded-md px-3")]
    Sm,
    #[tw(class = "h-11 rounded-md px-8")]
    Lg,
    #[tw(class = "h-10 w-10")]
    Icon,
}

#[component]
pub fn Button(
    #[prop(optional, into)] variant: MaybeProp<ButtonVariant>,
    #[prop(optional, into)] size: MaybeProp<ButtonSize>,
    #[prop(optional, into)] class: MaybeProp<String>,
    #[prop(default = false)] disabled: bool,
    #[prop(attrs)] attributes: Vec<(&'static str, Attribute)>,
    children: Children,
) -> impl IntoView {
    let class = move || {
        let btn = ButtonClass {
            variant: variant.get().unwrap_or_default(),
            size: size.get().unwrap_or_default(),
        };
        btn.with_class(class.get().unwrap_or_default())
    };

    view! {
        <button {..attributes} class=class disabled=disabled>
            {children()}
        </button>
    }
}
```

Usage:
```rust
view! {
    <Button variant=ButtonVariant::Destructive size=ButtonSize::Lg>
        "Delete Account"
    </Button>

    <Button class="w-full">"Full Width"</Button>

    <Button variant=ButtonVariant::Ghost on:click=|_| log!("clicked")>
        "Ghost Button"
    </Button>
}
```
