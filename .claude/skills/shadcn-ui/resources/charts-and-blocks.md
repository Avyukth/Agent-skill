# Charts and Block Patterns

Complete architectural guide for shadcn/ui charts and layout blocks, with Leptos/Rust translations.

## Chart System Architecture

### ChartContainer and ChartConfig Pattern

shadcn wraps Recharts with a thin abstraction layer. The `ChartContainer` injects CSS variables from a `ChartConfig` object:

```typescript
type ChartConfig = {
  [key: string]: {
    label: string;
    color: string;  // "hsl(var(--chart-1))" or "#2563eb"
    icon?: React.ComponentType;
  }
}

const chartConfig = {
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
} satisfies ChartConfig
```

**Leptos Equivalent:**

```rust
#[derive(Clone)]
pub struct ChartConfig {
    pub items: HashMap<String, ChartItem>,
}

#[derive(Clone)]
pub struct ChartItem {
    pub label: String,
    pub color: String,
}

#[component]
pub fn ChartContainer(
    #[prop(into)] config: ChartConfig,
    #[prop(into)] class: String,
    children: Children,
) -> impl IntoView {
    let style = config.items.iter()
        .map(|(k, v)| format!("--color-{}: {}", k, v.color))
        .collect::<Vec<_>>()
        .join(";");

    view! {
        <div class={format!("min-h-[200px] w-full {}", class)} style={style}>
            {children()}
        </div>
    }
}
```

### Chart Type Patterns

#### Area Charts
- `type` prop: `"natural"` (curved), `"linear"` (straight), `"step"` (discrete)
- Stacking: `stackId="a"`
- Gradients in `<defs>` with `<linearGradient>`

```tsx
<AreaChart>
  <defs>
    <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8}/>
      <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1}/>
    </linearGradient>
  </defs>
  <Area type="natural" fill="url(#fillDesktop)" stroke="var(--color-desktop)"/>
</AreaChart>
```

#### Bar Charts
- Horizontal: `layout="vertical"`
- Stacking: `stackId`
- Rounded corners: `radius={4}` or `radius={[4, 4, 0, 0]}` for stacked
- Negative values render automatically below axis

#### Line Charts
- Clean lines: `strokeWidth={2}`, `dot={false}`
- Data points: `dot={{ fill: "var(--color-desktop)" }}`
- Hover state: `activeDot={{ r: 6 }}`

#### Pie/Donut Charts
- Donut hole: `innerRadius={60}`
- Center text: `<Label>` with `viewBox.cx` and `viewBox.cy`
- Active sector: `activeShape` prop with custom `<Sector>`

#### Radar Charts
- Components: `<RadarChart>`, `<PolarAngleAxis>`, `<PolarGrid>`, `<Radar>`
- Circular grid: `gridType="circle"`
- No spokes: `radialLines={false}`

#### Radial Charts
- Arc extent: `startAngle`/`endAngle`
- Progress indicators: single-item data with background bar

### Common Axis Configuration

All shadcn charts follow consistent axis styling:

```tsx
<XAxis
  dataKey="month"
  tickLine={false}      // Remove tick marks
  axisLine={false}      // Remove axis line
  tickMargin={10}       // Space between axis and labels
  tickFormatter={(value) => value.slice(0, 3)}  // Abbreviate
/>
<CartesianGrid vertical={false}/>  // Horizontal lines only
```

### Tooltip and Legend

```tsx
<ChartTooltip content={<ChartTooltipContent
  indicator="dot"        // "dot", "line", or "dashed"
  hideLabel={false}
  nameKey="browser"
  labelFormatter={customFn}
/>}/>

<ChartLegend content={<ChartLegendContent nameKey="browser"/>}/>
```

---

## Block Architecture

### Sidebar System (16 Variants)

```
SidebarProvider (context + cookie persistence)
├── Sidebar (container: side, variant, collapsible props)
│   ├── SidebarHeader (sticky top)
│   ├── SidebarContent (scrollable)
│   │   └── SidebarGroup → SidebarMenu → SidebarMenuItem
│   │       └── SidebarMenuSub (nested items)
│   └── SidebarFooter (sticky bottom)
├── SidebarInset (main content wrapper)
└── SidebarTrigger (toggle button)
```

**Key Variants:**
| Variant | Description | Width |
|---------|-------------|-------|
| `floating` | No border | 19rem |
| `inset` | Secondary navigation style | - |
| `collapsible="icon"` | Collapses to icon-only | - |
| `side="right"` | Right-aligned | - |

**State Management Hook:**
```typescript
const { state, open, setOpen, openMobile, isMobile, toggleSidebar } = useSidebar()
```

**Leptos Equivalent:**
```rust
#[derive(Clone, Copy)]
pub struct SidebarState {
    pub collapsed: RwSignal<bool>,
    pub mobile_open: RwSignal<bool>,
}

#[component]
pub fn SidebarProvider(children: Children) -> impl IntoView {
    let state = SidebarState {
        collapsed: RwSignal::new(false),
        mobile_open: RwSignal::new(false),
    };

    // LocalStorage persistence
    Effect::new(move |_| {
        if let Some(window) = web_sys::window() {
            if let Ok(Some(storage)) = window.local_storage() {
                let _ = storage.set_item("sidebar_collapsed",
                    if state.collapsed.get() { "true" } else { "false" });
            }
        }
    });

    provide_context(state);
    children()
}
```

### Login Block Patterns (5 Variants)

| Variant | Layout | Key Classes |
|---------|--------|-------------|
| login-01 | Centered card | `flex min-h-svh items-center justify-center`, `max-w-sm` |
| login-02 | Two-column split | `grid min-h-svh lg:grid-cols-2`, cover image |
| login-03 | Muted background | `bg-muted flex flex-col items-center justify-center` |
| login-04 | Card with image | `max-w-sm md:max-w-4xl` |
| login-05 | Email-only | Simplified form |

**Form Structure Pattern:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Login</CardTitle>
    <CardDescription>Enter your email...</CardDescription>
  </CardHeader>
  <CardContent>
    <form>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required/>
        </div>
        <Button type="submit" className="w-full">Login</Button>
      </div>
    </form>
  </CardContent>
</Card>
```

### Dashboard Layout Composition

```tsx
<SidebarProvider>
  <AppSidebar/>
  <SidebarInset>
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1"/>
      <Separator orientation="vertical" className="mr-2 h-4"/>
      <Breadcrumb>...</Breadcrumb>
    </header>
    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
      {/* Stats cards */}
    </div>
  </SidebarInset>
</SidebarProvider>
```

**Stats Card Pattern:**
```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
    <DollarSign className="h-4 w-4 text-muted-foreground"/>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">$1,250.00</div>
    <p className="text-xs text-muted-foreground">
      <span className="text-green-500">+12.5%</span> from last month
    </p>
  </CardContent>
</Card>
```

---

## Rust Chart Library Recommendations

### Primary: leptos-chartistry

Native Leptos integration with signals:

```rust
use leptos_chartistry::*;

view! {
    <Chart
        aspect_ratio=AspectRatio::from_outer_ratio(600.0, 300.0)
        top=RotatedLabel::middle("Monthly Revenue")
        left=TickLabels::aligned_floats()
        bottom=TickLabels::timestamps()
        inner=[
            AxisMarker::left_edge().into_inner(),
            XGridLine::default().into_inner(),
            YGuideLine::over_mouse().into_inner(),
        ]
        tooltip=Tooltip::left_cursor()
        series=Series::new(|d: &Data| d.x)
            .line(Line::new(|d: &Data| d.desktop).with_name("Desktop"))
            .line(Line::new(|d: &Data| d.mobile).with_name("Mobile"))
        data=data_signal
    />
}
```

### Alternative: charming (ECharts bindings)

Best feature parity with shadcn animations:

```rust
use charming::{Chart, WasmRenderer};
use charming::series::Bar;
use charming::element::ItemStyle;

let chart = Chart::new()
    .series(Bar::new()
        .data(vec![186, 305, 237])
        .item_style(ItemStyle::new().border_radius(4)));

WasmRenderer::new(800, 400).render("chart-id", &chart);
```

### Maximum Control: Direct SVG

Full CSS variable support, smallest bundle:

```rust
#[component]
fn LineChart(data: Vec<(f64, f64)>) -> impl IntoView {
    let path = data.iter().enumerate()
        .map(|(i, (_, y))| {
            let x = 40.0 + (i as f64 * 60.0);
            let y_scaled = 180.0 - (y * 1.5);
            if i == 0 { format!("M {} {}", x, y_scaled) }
            else { format!("L {} {}", x, y_scaled) }
        })
        .collect::<Vec<_>>()
        .join(" ");

    view! {
        <svg viewBox="0 0 400 200" class="w-full">
            <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--chart-1)" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="var(--chart-1)" stop-opacity="0"/>
                </linearGradient>
            </defs>
            <g class="stroke-muted stroke-1">
                {(0..5).map(|i| view! {
                    <line x1="40" y1={i * 40} x2="380" y2={i * 40} stroke-dasharray="4"/>
                }).collect_view()}
            </g>
            <path d={path} fill="none" stroke="var(--chart-1)" stroke-width="2"/>
        </svg>
    }
}
```

---

## Calendar Implementation

### Using leptos-use Hook

```rust
use leptos_use::{use_calendar_with_options, UseCalendarOptions};

let options = UseCalendarOptions::default()
    .first_day_of_the_week(0)  // Sunday
    .initial_date(RwSignal::new(Some(today)));

let UseCalendarReturn { dates, weekdays, previous_month, next_month, .. } =
    use_calendar_with_options(options);
```

### Manual Implementation with chrono

```rust
use chrono::{NaiveDate, Datelike, Days, Months};

pub fn generate_calendar_grid(year: i32, month: u32) -> Vec<Option<NaiveDate>> {
    let mut grid = Vec::with_capacity(42);
    let first_of_month = NaiveDate::from_ymd_opt(year, month, 1).unwrap();
    let start_offset = first_of_month.weekday().num_days_from_sunday();

    // Previous month padding
    if start_offset > 0 {
        let prev_last = first_of_month.pred_opt().unwrap();
        for i in (0..start_offset).rev() {
            grid.push(Some(prev_last - Days::new(i as u64)));
        }
    }

    // Current month + next month padding to 42 cells
    // ... implementation
    grid
}
```

### Date Picker Styling States

| State | Classes |
|-------|---------|
| Selected single | `bg-primary text-primary-foreground` |
| Range start | `bg-primary rounded-l-md` |
| Range middle | `bg-accent rounded-none` |
| Range end | `bg-primary rounded-r-md` |
| Today | `bg-accent text-accent-foreground rounded-md` |
| Outside month | `text-muted-foreground` |
| Disabled | `opacity-50 cursor-not-allowed` |

---

## Leptos Component Patterns

### Slots Pattern

```rust
#[slot]
struct CardHeader { children: ChildrenFn }

#[slot]
struct CardContent { children: ChildrenFn }

#[component]
fn Card(header: CardHeader, content: CardContent) -> impl IntoView {
    view! {
        <div class="bg-card text-card-foreground rounded-xl border shadow-sm">
            <div class="p-6 pb-2">{(header.children)()}</div>
            <div class="p-6 pt-0">{(content.children)()}</div>
        </div>
    }
}
```

### Form Handling with Server Functions

```rust
#[server]
pub async fn login(email: String, password: String) -> Result<(), ServerFnError> {
    // Authentication logic
}

#[component]
fn LoginForm() -> impl IntoView {
    let login_action = ServerAction::<Login>::new();
    let pending = login_action.pending();

    view! {
        <ActionForm action=login_action>
            <input type="email" name="email" class="flex h-10 w-full rounded-md border px-3"/>
            <input type="password" name="password" class="flex h-10 w-full rounded-md border px-3"/>
            <button type="submit" disabled=pending class="w-full bg-primary text-primary-foreground rounded-md h-10">
                {move || if pending.get() { "Loading..." } else { "Login" }}
            </button>
        </ActionForm>
    }
}
```

### Interactive Chart State

```rust
#[component]
fn InteractiveChart() -> impl IntoView {
    let chart_data = RwSignal::new(vec![/* data */]);
    let selected_series = RwSignal::new("desktop".to_string());

    let max_y = Memo::new(move |_| {
        chart_data.get().iter().map(|p| p.y).fold(f64::MIN, f64::max)
    });

    view! {
        <div class="flex gap-2 mb-4">
            <button
                class:bg-primary=move || selected_series.get() == "desktop"
                on:click=move |_| selected_series.set("desktop".to_string())
            >"Desktop"</button>
            <button
                class:bg-primary=move || selected_series.get() == "mobile"
                on:click=move |_| selected_series.set("mobile".to_string())
            >"Mobile"</button>
        </div>
        // Chart rendering with selected_series
    }
}
```
