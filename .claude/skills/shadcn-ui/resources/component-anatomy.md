# Component Anatomy Reference

Framework-agnostic specifications for all shadcn/ui components. Use this to understand the structure, behavior, and styling of each component before translating to your target framework.

## Button

### Variants
| Variant | Description | Base Classes |
|---------|-------------|--------------|
| default | Primary action | `bg-primary text-primary-foreground hover:bg-primary/90` |
| destructive | Dangerous action | `bg-destructive text-destructive-foreground hover:bg-destructive/90` |
| outline | Secondary importance | `border border-input bg-background hover:bg-accent hover:text-accent-foreground` |
| secondary | Alternative action | `bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| ghost | Minimal emphasis | `hover:bg-accent hover:text-accent-foreground` |
| link | Looks like link | `text-primary underline-offset-4 hover:underline` |

### Sizes
| Size | Classes |
|------|---------|
| default | `h-10 px-4 py-2` |
| sm | `h-9 rounded-md px-3` |
| lg | `h-11 rounded-md px-8` |
| icon | `h-10 w-10` |

### Base Classes
```
inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium
ring-offset-background transition-colors
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
disabled:pointer-events-none disabled:opacity-50
```

---

## Input

### Structure
```
<input type="text" />
```

### Classes
```
flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
ring-offset-background
file:border-0 file:bg-transparent file:text-sm file:font-medium
placeholder:text-muted-foreground
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
disabled:cursor-not-allowed disabled:opacity-50
```

---

## Card

### Structure
```
Card
├── CardHeader
│   ├── CardTitle
│   └── CardDescription
├── CardContent
└── CardFooter
```

### Classes
| Part | Classes |
|------|---------|
| Card | `rounded-lg border bg-card text-card-foreground shadow-sm` |
| CardHeader | `flex flex-col space-y-1.5 p-6` |
| CardTitle | `text-2xl font-semibold leading-none tracking-tight` |
| CardDescription | `text-sm text-muted-foreground` |
| CardContent | `p-6 pt-0` |
| CardFooter | `flex items-center p-6 pt-0` |

---

## Dialog / Modal

### Structure
```
Dialog
├── DialogTrigger (button that opens)
├── DialogPortal
│   ├── DialogOverlay (backdrop)
│   └── DialogContent
│       ├── DialogHeader
│       │   ├── DialogTitle
│       │   └── DialogDescription
│       ├── {children}
│       ├── DialogFooter
│       └── DialogClose (X button)
```

### Classes
| Part | Classes |
|------|---------|
| Overlay | `fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0` |
| Content | `fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg` |
| Header | `flex flex-col space-y-1.5 text-center sm:text-left` |
| Footer | `flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2` |
| Title | `text-lg font-semibold leading-none tracking-tight` |
| Description | `text-sm text-muted-foreground` |

### Behavior
- Opens on trigger click
- Closes on overlay click, close button, or Escape key
- Traps focus inside modal
- Returns focus to trigger on close

---

## Select

### Structure
```
Select
├── SelectTrigger
│   ├── SelectValue
│   └── ChevronDown icon
└── SelectContent (portal)
    ├── SelectGroup (optional)
    │   ├── SelectLabel
    │   └── SelectItem[]
    └── SelectSeparator (optional)
```

### Classes
| Part | Classes |
|------|---------|
| Trigger | `flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1` |
| Content | `relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2` |
| Item | `relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50` |

---

## Accordion

### Structure
```
Accordion (type="single" or "multiple")
└── AccordionItem[]
    ├── AccordionTrigger
    │   ├── {title}
    │   └── ChevronDown icon (rotates)
    └── AccordionContent
```

### Classes
| Part | Classes |
|------|---------|
| Item | `border-b` |
| Trigger | `flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180` |
| Content | `overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down` |
| ContentInner | `pb-4 pt-0` |

### Behavior
- Single: Only one item open at a time
- Multiple: Any number of items can be open
- Keyboard: Arrow keys navigate, Enter/Space toggle

---

## Tabs

### Structure
```
Tabs
├── TabsList
│   └── TabsTrigger[]
└── TabsContent[]
```

### Classes
| Part | Classes |
|------|---------|
| List | `inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground` |
| Trigger | `inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm` |
| Content | `mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` |

---

## Alert

### Variants
| Variant | Classes |
|---------|---------|
| default | `bg-background text-foreground` |
| destructive | `border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive` |

### Structure & Classes
```
Alert: relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground
├── Icon (optional)
├── AlertTitle: mb-1 font-medium leading-none tracking-tight
└── AlertDescription: text-sm [&_p]:leading-relaxed
```

---

## Badge

### Variants
| Variant | Classes |
|---------|---------|
| default | `border-transparent bg-primary text-primary-foreground hover:bg-primary/80` |
| secondary | `border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| destructive | `border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80` |
| outline | `text-foreground` |

### Base Classes
```
inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors
focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
```

---

## Switch

### Structure
```
Switch (role="switch")
└── SwitchThumb (the sliding circle)
```

### Classes
| Part | Classes |
|------|---------|
| Root | `peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input` |
| Thumb | `pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0` |

---

## Checkbox

### Structure
```
Checkbox (role="checkbox")
└── CheckIcon (visible when checked)
```

### Classes
```
Root: peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background 
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
      disabled:cursor-not-allowed disabled:opacity-50 
      data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground
Indicator: flex items-center justify-center text-current
```

---

## Toast

### Structure
```
ToastProvider
├── ToastViewport (container for all toasts)
└── Toast[]
    ├── ToastTitle
    ├── ToastDescription
    ├── ToastAction (optional button)
    └── ToastClose
```

### Classes
| Part | Classes |
|------|---------|
| Viewport | `fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]` |
| Toast | `group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full` |

### Variants
| Variant | Additional Classes |
|---------|-------------------|
| default | `border bg-background text-foreground` |
| destructive | `destructive group border-destructive bg-destructive text-destructive-foreground` |

---

## Avatar

### Structure
```
Avatar
├── AvatarImage (if src loads successfully)
└── AvatarFallback (shown during load or on error)
```

### Classes
| Part | Classes |
|------|---------|
| Root | `relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full` |
| Image | `aspect-square h-full w-full` |
| Fallback | `flex h-full w-full items-center justify-center rounded-full bg-muted` |

---

## Skeleton

### Classes
```
animate-pulse rounded-md bg-muted
```

Use with explicit dimensions: `h-4 w-[250px]`, `h-12 w-12 rounded-full`, etc.

---

## Separator

### Classes
```
Horizontal: shrink-0 bg-border h-[1px] w-full
Vertical: shrink-0 bg-border w-[1px] h-full
```

---

## Progress

### Structure
```
Progress (role="progressbar")
└── ProgressIndicator (the filled portion)
```

### Classes
| Part | Classes |
|------|---------|
| Root | `relative h-4 w-full overflow-hidden rounded-full bg-secondary` |
| Indicator | `h-full w-full flex-1 bg-primary transition-all` |

Indicator uses `transform: translateX(calc(-100% + value%))` for progress.

---

## Tooltip

### Structure
```
TooltipProvider
└── Tooltip
    ├── TooltipTrigger
    └── TooltipContent (portal)
```

### Classes
| Part | Classes |
|------|---------|
| Content | `z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2` |

---

## Dropdown Menu

### Structure
```
DropdownMenu
├── DropdownMenuTrigger
└── DropdownMenuContent (portal)
    ├── DropdownMenuLabel
    ├── DropdownMenuSeparator
    ├── DropdownMenuItem
    ├── DropdownMenuCheckboxItem
    ├── DropdownMenuRadioGroup
    │   └── DropdownMenuRadioItem[]
    └── DropdownMenuSub
        ├── DropdownMenuSubTrigger
        └── DropdownMenuSubContent
```

### Key Classes
| Part | Classes |
|------|---------|
| Content | `z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2` |
| Item | `relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50` |
| Separator | `-mx-1 my-1 h-px bg-muted` |
| Label | `px-2 py-1.5 text-sm font-semibold` |
