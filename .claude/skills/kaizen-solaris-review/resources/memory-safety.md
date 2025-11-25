# Memory Safety & Correctness

## Overview

Memory safety is the foundation of Rust's value proposition and the first line of defense in code reviews. This guide establishes zero-tolerance policies for unsafe code and comprehensive correctness verification.

---

## 1. Zero Unsafe Code Tolerance

### Default Stance

**All application code should forbid unsafe:**

```rust
#![forbid(unsafe_code)]
```

This prevents any unsafe code from being introduced without explicit, conscious decision-making.

### When Unsafe is Absolutely Necessary

Unsafe code is only acceptable when interfacing with:
- Hardware (embedded systems, device drivers)
- Foreign Function Interface (FFI to C libraries)
- Performance-critical primitives (after profiling proves necessity)
- Low-level concurrency primitives

### SAFETY Comment Standard

Every unsafe block MUST have a `// SAFETY:` comment explaining why undefined behavior cannot occur:

```rust
unsafe {
    // SAFETY: This is safe because:
    // 1. The pointer came from Box::into_raw(), so it's non-null and aligned
    // 2. We have exclusive ownership (no other references exist)
    // 3. The memory layout matches T exactly
    // 4. This is the only place we reconstruct the Box (no double-free)
    Box::from_raw(ptr)
}
```

**SAFETY comments must address:**
1. **Pointer validity** - Non-null, properly aligned, valid for reads/writes
2. **Ownership** - No aliasing violations, exclusive access guaranteed
3. **Lifetime** - Memory outlives all references
4. **Invariants** - Type invariants maintained (e.g., UTF-8 for str)

### Unsafe Review Group

**All unsafe code requires approval from designated unsafe-code reviewers:**

- Reviewers must have deep Rust expertise (3+ years)
- Understanding of:
  - Rust memory model
  - Undefined behavior (UB) scenarios
  - Aliasing rules (Stacked Borrows/Tree Borrows)
  - Platform-specific issues (alignment, endianness)
- Run Miri on all unsafe code

**Review Process:**
1. Author submits PR with unsafe code
2. Standard review process + unsafe review group notification
3. Unsafe reviewer examines each unsafe block
4. Miri verification in CI (if applicable)
5. Two approvals required: one standard + one unsafe specialist

### Minimize Unsafe Scope

**Pattern: Unsafe core with safe interface**

```rust
// ✅ GOOD: Unsafe contained in small, audited function
pub struct MyBuffer {
    ptr: *mut u8,
    len: usize,
    cap: usize,
}

impl MyBuffer {
    /// Creates a new buffer. Safe because all invariants established.
    pub fn new(capacity: usize) -> Self {
        unsafe {
            // SAFETY: Layout is non-zero and aligned for u8
            let layout = Layout::array::<u8>(capacity).unwrap();
            let ptr = alloc(layout);
            if ptr.is_null() {
                handle_alloc_error(layout);
            }
            Self {
                ptr,
                len: 0,
                cap: capacity,
            }
        }
    }

    /// Safe API: bounds checking prevents unsafe access
    pub fn get(&self, index: usize) -> Option<u8> {
        if index < self.len {
            unsafe {
                // SAFETY: Index bounds checked above, ptr is valid
                Some(*self.ptr.add(index))
            }
        } else {
            None
        }
    }
}

impl Drop for MyBuffer {
    fn drop(&mut self) {
        unsafe {
            // SAFETY: ptr came from alloc with this layout, deallocating exactly once
            let layout = Layout::array::<u8>(self.cap).unwrap();
            dealloc(self.ptr, layout);
        }
    }
}
```

---

## 2. Type System Enforcement

### Strong Newtypes (No Primitive Obsession)

```rust
// ❌ BAD: Primitive types can be mixed up
fn transfer_money(from: i64, to: i64, amount: f64) -> Result<()> {
    // Easy to swap 'from' and 'to' accidentally
}

// ✅ GOOD: Type system prevents errors
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct AccountId(i64);

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Money(f64); // Or better: use rust_decimal

fn transfer_money(from: AccountId, to: AccountId, amount: Money) -> Result<()> {
    // Cannot accidentally swap parameters—type error at compile time
}
```

### Make Illegal States Unrepresentable

```rust
// ❌ BAD: State machine with invalid states possible
pub struct Connection {
    state: String,  // "connecting", "connected", "disconnected"
    session_id: Option<String>,  // Only valid when connected
}

// ✅ GOOD: Type system enforces valid states
pub enum Connection {
    Connecting,
    Connected { session_id: String },  // session_id only exists when connected
    Disconnected { reason: String },
}
```

### Leverage Enums for Exhaustiveness

```rust
// ✅ GOOD: Compiler ensures all cases handled
pub enum PaymentMethod {
    CreditCard { last_four: String },
    BankTransfer { iban: String },
    Crypto { address: String },
}

fn process_payment(method: &PaymentMethod) -> Result<()> {
    match method {
        PaymentMethod::CreditCard { last_four } => {
            // Compiler error if we add a new variant and forget this case
        }
        PaymentMethod::BankTransfer { iban } => { }
        PaymentMethod::Crypto { address } => { }
    }
    Ok(())
}
```

---

## 3. Assertion Density (NASA Rule 5)

**Minimum two runtime checks per function** via:
1. Compile-time guarantees (type system) - PREFERRED
2. Runtime assertions (`debug_assert!`, explicit checks)
3. Type invariants enforced by constructors

### Pattern: Validate at Boundaries

```rust
// ✅ GOOD: Input validation with informative errors
pub fn process_batch(items: &[Item]) -> Result<Vec<Output>> {
    // Assertion 1: Non-empty input
    if items.is_empty() {
        return Err(Error::EmptyBatch);
    }

    // Assertion 2: All items have valid IDs
    for item in items {
        if item.id.0 == 0 {
            return Err(Error::InvalidItemId(item.clone()));
        }
    }

    // Proceed with validated inputs
    items.iter().map(|item| transform(item)).collect()
}
```

### Pattern: Maintain Invariants

```rust
pub struct CircularBuffer<T> {
    buffer: Vec<T>,
    head: usize,
    tail: usize,
}

impl<T> CircularBuffer<T> {
    pub fn push(&mut self, item: T) {
        debug_assert!(self.head < self.buffer.len());
        debug_assert!(self.tail < self.buffer.len());

        self.buffer[self.head] = item;
        self.head = (self.head + 1) % self.buffer.len();

        // Invariant: head and tail always valid indices
        debug_assert!(self.head < self.buffer.len());
    }
}
```

### Use expect() Instead of unwrap()

```rust
// ❌ BAD: No context on failure
let config = parse_config().unwrap();

// ✅ GOOD: Clear message for debugging
let config = parse_config()
    .expect("Failed to parse config.toml: file should be validated during build");
```

---

## 4. Must-Use Attributes

**Mark fallible functions with `#[must_use]`:**

```rust
#[must_use = "Query must be executed to have any effect"]
pub struct Query<'a> {
    sql: &'a str,
    params: Vec<Value>,
}

impl<'a> Query<'a> {
    #[must_use]
    pub fn execute(self) -> Result<QueryResult> {
        // Execute query
    }
}

// Compiler error if user forgets to call .execute()
// let query = Query::new("DELETE FROM users");  // WARNING
```

**Standard library types already marked:**
- `Result<T, E>` - must use or explicitly ignore with `let _ =`
- Iterators - must consume or compiler warns

---

## 5. Miri for Unsafe Code Verification

**Miri detects undefined behavior at runtime:**

```bash
# Install Miri
rustup +nightly component add miri

# Run Miri on tests
cargo +nightly miri test

# Run Miri on specific binary
cargo +nightly miri run --bin my_app
```

**Miri detects:**
- Use-after-free
- Out-of-bounds access
- Data races
- Uninitialized memory reads
- Invalid pointer arithmetic
- Alignment violations

**CI Integration:**

```yaml
# .github/workflows/ci.yml
miri:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: dtolnay/rust-toolchain@nightly
      with:
        components: miri
    - name: Run Miri
      run: cargo miri test
```

---

## 6. Compile-Time Verification with Const

**Leverage const for compile-time checks:**

```rust
// ✅ GOOD: Configuration validated at compile time
const MAX_USERS: usize = 1000;
const CACHE_SIZE: usize = MAX_USERS * 2;

// Compile error if constraint violated
const _: () = assert!(CACHE_SIZE <= 10000, "Cache size exceeds maximum");

// Type-level validation
pub struct Buffer<const N: usize> {
    data: [u8; N],
}

impl<const N: usize> Buffer<N> {
    pub const fn new() -> Self {
        assert!(N > 0, "Buffer size must be positive");
        assert!(N <= 4096, "Buffer size exceeds maximum");
        Self { data: [0; N] }
    }
}
```

---

## 7. Review Checklist for Memory Safety

### Unsafe Code Review

- [ ] Every unsafe block has detailed SAFETY comment
- [ ] SAFETY comment addresses all UB sources (pointers, aliasing, lifetimes, invariants)
- [ ] Unsafe code reviewed by unsafe specialist
- [ ] Miri passes on all tests involving unsafe code
- [ ] Unsafe code minimized to smallest possible scope
- [ ] Public API is safe (unsafe contained internally)
- [ ] Alternative safe approaches considered and documented

### Type Safety Review

- [ ] No primitive obsession (newtypes for domain concepts)
- [ ] Illegal states made unrepresentable
- [ ] Enums used for sum types (exhaustive pattern matching)
- [ ] `#[must_use]` on all fallible operations
- [ ] Type invariants enforced by constructors (not public fields)

### Correctness Review

- [ ] Minimum two checks per function (type system or runtime)
- [ ] All input parameters validated at boundaries
- [ ] Panic conditions documented in `# Panics` section
- [ ] `expect()` used with descriptive messages instead of `unwrap()`
- [ ] `debug_assert!` used for internal invariants
- [ ] Preconditions and postconditions clear

---

## 8. Common Anti-Patterns

### ❌ Overuse of unsafe

```rust
// BAD: Unsafe used unnecessarily
unsafe {
    let mut vec = Vec::new();
    vec.push(42);
}
```

**Why bad:** Standard library methods are already safe. Wrapping them in unsafe adds no value and may hide actual unsafe operations.

### ❌ Transmute Abuse

```rust
// BAD: Transmute without justification
let x: u64 = unsafe { std::mem::transmute(my_struct) };
```

**Why bad:** Transmute bypasses all type safety. Use only when absolutely necessary and document extensively.

### ❌ Pointer Arithmetic Without Bounds

```rust
// BAD: Unchecked pointer arithmetic
unsafe {
    let value = *ptr.add(offset);  // No bounds checking
}
```

**Why bad:** Undefined behavior if offset is out of bounds. Always validate indices or use safe alternatives.

### ❌ Long-Lived Raw Pointers

```rust
// BAD: Raw pointer outlives its allocation
let ptr = {
    let vec = vec![1, 2, 3];
    vec.as_ptr()
};  // vec dropped here, ptr now dangling
unsafe { *ptr }  // UB: use-after-free
```

**Why bad:** Classic use-after-free. Prefer references with explicit lifetimes.

---

## 9. Best Practices Summary

1. **Default to `#![forbid(unsafe_code)]`** for all application code
2. **Minimize unsafe scope** - contain in small, well-audited functions
3. **Every unsafe block needs SAFETY comment** addressing all UB sources
4. **Unsafe specialist approval** required for all unsafe code
5. **Run Miri** on all code paths involving unsafe
6. **Use newtypes** to prevent primitive type confusion
7. **Make illegal states unrepresentable** with the type system
8. **Validate all inputs** at trust boundaries
9. **Two checks per function minimum** (type system or runtime)
10. **Mark fallible operations** with `#[must_use]`

---

**Remember:** The compiler is your ally. Unsafe code should be rare, well-justified, and thoroughly reviewed. When in doubt, find the safe alternative—Rust's standard library provides safe abstractions for most needs.
