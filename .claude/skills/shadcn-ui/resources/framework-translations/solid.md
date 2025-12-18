# SolidJS Translation Guide

Patterns for implementing shadcn/ui components in SolidJS. SolidJS is similar to React in JSX syntax but uses fine-grained reactivity instead of virtual DOM.

## Setup Requirements

### Dependencies
```json
{
  "dependencies": {
    "solid-js": "^1.8.0",
    "@kobalte/core": "^0.12.0",  // Radix-like primitives for Solid
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  }
}
```

Note: [@kobalte/core](https://kobalte.dev/) provides accessible primitives similar to Radix UI for SolidJS.

### CSS Setup
Same as React - use the shadcn CSS variables in your `globals.css`.

## Core Patterns

### Class Merging (cn)

```tsx
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### CVA Equivalent

```tsx
// Same as React - CVA works with SolidJS
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### Key Differences from React

| React | SolidJS |
|-------|---------|
| `useState` | `createSignal` |
| `useEffect` | `createEffect` |
| `useMemo` | `createMemo` |
| `useRef` | `let ref` with `ref={el => ref = el}` |
| `children` prop | `props.children` (accessed via `children()` helper) |
| Conditional with `&&` | Use `<Show>` component |
| Lists with `.map()` | Use `<For>` component |

## Component Implementations

### Button

```tsx
import { Component, JSX, splitProps } from "solid-js";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(/* ... */);

interface ButtonProps
  extends JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button: Component<ButtonProps> = (props) => {
  const [local, others] = splitProps(props, ["variant", "size", "class"]);
  
  return (
    <button
      class={cn(buttonVariants({ variant: local.variant, size: local.size }), local.class)}
      {...others}
    />
  );
};

export { Button, buttonVariants };
```

### Input

```tsx
import { Component, JSX, splitProps } from "solid-js";
import { cn } from "@/lib/utils";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {}

const Input: Component<InputProps> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  
  return (
    <input
      class={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        local.class
      )}
      {...others}
    />
  );
};

export { Input };
```

### Card

```tsx
import { Component, JSX, splitProps } from "solid-js";
import { cn } from "@/lib/utils";

const Card: Component<JSX.HTMLAttributes<HTMLDivElement>> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div
      class={cn("rounded-lg border bg-card text-card-foreground shadow-sm", local.class)}
      {...others}
    />
  );
};

const CardHeader: Component<JSX.HTMLAttributes<HTMLDivElement>> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div
      class={cn("flex flex-col space-y-1.5 p-6", local.class)}
      {...others}
    />
  );
};

const CardTitle: Component<JSX.HTMLAttributes<HTMLHeadingElement>> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <h3
      class={cn("text-2xl font-semibold leading-none tracking-tight", local.class)}
      {...others}
    />
  );
};

const CardDescription: Component<JSX.HTMLAttributes<HTMLParagraphElement>> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <p
      class={cn("text-sm text-muted-foreground", local.class)}
      {...others}
    />
  );
};

const CardContent: Component<JSX.HTMLAttributes<HTMLDivElement>> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return <div class={cn("p-6 pt-0", local.class)} {...others} />;
};

const CardFooter: Component<JSX.HTMLAttributes<HTMLDivElement>> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div class={cn("flex items-center p-6 pt-0", local.class)} {...others} />
  );
};

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

### Switch (using Kobalte)

```tsx
import { Component, splitProps } from "solid-js";
import { Switch as KobalteSwitch } from "@kobalte/core";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  class?: string;
}

const Switch: Component<SwitchProps> = (props) => {
  const [local, others] = splitProps(props, ["class", "checked", "onChange"]);
  
  return (
    <KobalteSwitch.Root
      class={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary data-[unchecked]:bg-input",
        local.class
      )}
      checked={local.checked}
      onChange={local.onChange}
      {...others}
    >
      <KobalteSwitch.Input />
      <KobalteSwitch.Control>
        <KobalteSwitch.Thumb
          class="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[checked]:translate-x-5 data-[unchecked]:translate-x-0"
        />
      </KobalteSwitch.Control>
    </KobalteSwitch.Root>
  );
};

export { Switch };
```

### Dialog (using Kobalte)

```tsx
import { Component, JSX, splitProps } from "solid-js";
import { Dialog as KobalteDialog } from "@kobalte/core";
import { cn } from "@/lib/utils";

const Dialog = KobalteDialog.Root;
const DialogTrigger = KobalteDialog.Trigger;

const DialogPortal: Component<KobalteDialog.DialogPortalProps> = (props) => {
  return <KobalteDialog.Portal {...props} />;
};

const DialogOverlay: Component<KobalteDialog.DialogOverlayProps> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <KobalteDialog.Overlay
      class={cn(
        "fixed inset-0 z-50 bg-black/80 data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0",
        local.class
      )}
      {...others}
    />
  );
};

const DialogContent: Component<
  KobalteDialog.DialogContentProps & { children: JSX.Element }
> = (props) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <DialogPortal>
      <DialogOverlay />
      <KobalteDialog.Content
        class={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 sm:rounded-lg",
          local.class
        )}
        {...others}
      >
        {local.children}
        <KobalteDialog.CloseButton class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <svg class="h-4 w-4" /* X icon */ />
          <span class="sr-only">Close</span>
        </KobalteDialog.CloseButton>
      </KobalteDialog.Content>
    </DialogPortal>
  );
};

const DialogHeader: Component<JSX.HTMLAttributes<HTMLDivElement>> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div
      class={cn("flex flex-col space-y-1.5 text-center sm:text-left", local.class)}
      {...others}
    />
  );
};

const DialogFooter: Component<JSX.HTMLAttributes<HTMLDivElement>> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div
      class={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        local.class
      )}
      {...others}
    />
  );
};

const DialogTitle: Component<KobalteDialog.DialogTitleProps> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <KobalteDialog.Title
      class={cn("text-lg font-semibold leading-none tracking-tight", local.class)}
      {...others}
    />
  );
};

const DialogDescription: Component<KobalteDialog.DialogDescriptionProps> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <KobalteDialog.Description
      class={cn("text-sm text-muted-foreground", local.class)}
      {...others}
    />
  );
};

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
```

## Kobalte Component Mapping

Kobalte provides most Radix primitives for SolidJS:

| shadcn Component | Kobalte Primitive |
|-----------------|-------------------|
| Dialog | Dialog |
| Alert Dialog | AlertDialog |
| Select | Select |
| Dropdown Menu | DropdownMenu |
| Context Menu | ContextMenu |
| Popover | Popover |
| Tooltip | Tooltip |
| Tabs | Tabs |
| Accordion | Accordion |
| Switch | Switch |
| Checkbox | Checkbox |
| Radio Group | RadioGroup |
| Progress | Progress |
| Separator | Separator |
| Collapsible | Collapsible |

## Data Attributes

Kobalte uses similar but not identical data attributes:

| Radix (React) | Kobalte (Solid) |
|---------------|-----------------|
| `data-state="open"` | `data-expanded` |
| `data-state="closed"` | `data-closed` |
| `data-state="checked"` | `data-checked` |
| `data-state="unchecked"` | `data-unchecked` |
| `data-state="active"` | `data-selected` |

Adjust CSS accordingly:
```css
/* React/Radix */
[data-state="open"] { }

/* Solid/Kobalte */
[data-expanded] { }
```
