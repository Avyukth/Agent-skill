# Comprehensive Testing Strategy

## Overview

Testing is not optional—it's the safety net that catches bugs before production. This guide establishes a multi-layer testing strategy with 100% coverage targets, property-based testing, fuzzing, and formal verification for safety-critical components.

---

## Testing Philosophy

### Solaris-Class Standards

1. **100% line coverage** for all production code (measured, not aspirational)
2. **Test error paths**, not just happy paths
3. **Each bug gets a regression test** before fixing
4. **Tests are documentation** of expected behavior
5. **Fast feedback loop** - unit tests run in \u003c1 second

### Toyota Way Principles

- **Jidoka**: Tests stop the line when they fail (no merging on red)
- **Kaizen**: Continuously improve test quality and coverage
- **Genchi Genbutsu**: Test real usage patterns, not just units in isolation

---

## Layer 1: Unit Testing

### Coverage Target: 100%

**Measure with cargo-llvm-cov or tarpaulin:**

```bash
# Install coverage tools
cargo install cargo-llvm-cov

# Generate coverage report
cargo llvm-cov --html

# CI enforcement
cargo llvm-cov --fail-under-lines 100
```

### Structure for Testability

```rust
// ✅ GOOD: Pure functions easy to test
pub fn calculate_discount(price: Money, tier: CustomerTier) -> Money {
    match tier {
        CustomerTier::Bronze => price * 0.95,
        CustomerTier::Silver => price * 0.90,
        CustomerTier::Gold => price * 0.85,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bronze_discount() {
        let price = Money::from_dollars(100);
        let discount = calculate_discount(price, CustomerTier::Bronze);
        assert_eq!(discount, Money::from_dollars(95));
    }

    #[test]
    fn test_silver_discount() {
        let price = Money::from_dollars(100);
        let discount = calculate_discount(price, CustomerTier::Silver);
        assert_eq!(discount, Money::from_dollars(90));
    }

    #[test]
    fn test_gold_discount() {
        let price = Money::from_dollars(100);
        let discount = calculate_discount(price, CustomerTier::Gold);
        assert_eq!(discount, Money::from_dollars(85));
    }
}
```

### Test All Public APIs

**Every public function/method must have tests:**

```rust
pub struct UserService {
    repo: Arc<dyn UserRepository>,
}

impl UserService {
    pub async fn create_user(&self, data: CreateUserData) -> Result<User> {
        // Implementation
    }

    pub async fn get_user(&self, id: UserId) -> Result<User> {
        // Implementation
    }

    pub async fn delete_user(&self, id: UserId) -> Result<()> {
        // Implementation
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_user_success() { /* ... */ }

    #[tokio::test]
    async fn test_create_user_duplicate_email() { /* ... */ }

    #[tokio::test]
    async fn test_get_user_found() { /* ... */ }

    #[tokio::test]
    async fn test_get_user_not_found() { /* ... */ }

    #[tokio::test]
    async fn test_delete_user_success() { /* ... */ }

    #[tokio::test]
    async fn test_delete_user_not_found() { /* ... */ }
}
```

### Test Error Paths

**Don't just test happy paths:**

```rust
#[tokio::test]
async fn test_transfer_insufficient_funds() {
    let service = setup_service().await;

    // Create account with $50
    let account = service.create_account(Money::from_dollars(50)).await.unwrap();

    // Attempt to transfer $100 (should fail)
    let result = service.transfer(account.id, dest_id, Money::from_dollars(100)).await;

    assert!(matches!(result, Err(Error::InsufficientFunds)));

    // Verify account balance unchanged
    let account = service.get_account(account.id).await.unwrap();
    assert_eq!(account.balance, Money::from_dollars(50));
}
```

### Regression Tests for Every Bug

```rust
// Bug #1234: Discount calculation failed for zero prices
#[test]
fn test_discount_zero_price_regression() {
    let price = Money::from_dollars(0);
    let discount = calculate_discount(price, CustomerTier::Gold);
    assert_eq!(discount, Money::from_dollars(0));
}
```

---

## Layer 2: Property-Based Testing

### Use proptest or quickcheck

**Property-based testing finds edge cases you didn't think of:**

```rust
use proptest::prelude::*;

// Property: Encoding then decoding should return original value
proptest! {
    #[test]
    fn test_encode_decode_roundtrip(data in any::<Vec<u8>>()) {
        let encoded = encode(&data);
        let decoded = decode(&encoded).unwrap();
        prop_assert_eq!(data, decoded);
    }
}

// Property: Adding then subtracting should return original
proptest! {
    #[test]
    fn test_money_addition_subtraction(
        amount in 0i64..1_000_000,
        delta in 0i64..1_000_000
    ) {
        let original = Money::from_cents(amount);
        let added = original + Money::from_cents(delta);
        let result = added - Money::from_cents(delta);
        prop_assert_eq!(original, result);
    }
}
```

### When to Use Property-Based Testing

**Ideal for:**
- Parsers and serializers (roundtrip properties)
- Mathematical operations (commutativity, associativity)
- Data structures (invariants maintained)
- Encoders/decoders
- Compression algorithms
- Sorting and searching

**Example: Parser roundtrip property**

```rust
proptest! {
    #[test]
    fn test_url_parser_roundtrip(url_str in r"https?://[a-z]+\.(com|org|net)/[a-z]*") {
        let parsed = Url::parse(&url_str).unwrap();
        let serialized = parsed.to_string();
        let reparsed = Url::parse(&serialized).unwrap();
        prop_assert_eq!(parsed, reparsed);
    }
}
```

### Shrinking for Minimal Failing Cases

**Proptest automatically finds minimal failing examples:**

```rust
// When this test fails, proptest will find the SMALLEST input that fails
proptest! {
    #[test]
    fn test_validate_username(username in "[a-zA-Z0-9_]{1,20}") {
        // If validation fails, proptest shrinks to minimal failing case
        prop_assert!(validate_username(&username).is_ok());
    }
}
```

---

## Layer 3: Documentation Testing

### All Examples Must Compile and Run

```rust
/// Calculates the total price including tax.
///
/// # Examples
///
/// ```
/// use myapp::Money;
/// use myapp::calculate_total;
///
/// let subtotal = Money::from_dollars(100);
/// let tax_rate = 0.08;
/// let total = calculate_total(subtotal, tax_rate);
/// assert_eq!(total, Money::from_dollars(108));
/// ```
pub fn calculate_total(subtotal: Money, tax_rate: f64) -> Money {
    subtotal * (1.0 + tax_rate)
}
```

**Run doctests:**

```bash
cargo test --doc
```

### Test README Examples

```rust
// In lib.rs
#![doc = include_str!("../README.md")]
```

Now `cargo test --doc` will run examples in README.md.

### Mark Examples Requiring External Resources

```rust
/// # Examples
///
/// ```no_run
/// // This example requires a running database
/// let pool = connect_database().await?;
/// ```
```

---

## Layer 4: Fuzzing

### Coverage-Guided Fuzzing with cargo-fuzz

**Install:**

```bash
cargo install cargo-fuzz
```

**Initialize fuzz target:**

```bash
cargo fuzz init
```

**Create fuzz target:**

```rust
// fuzz/fuzz_targets/parse_request.rs
#![no_main]
use libfuzzer_sys::fuzz_target;
use myapp::parse_request;

fuzz_target!(|data: &[u8]| {
    // Fuzzer will generate random byte sequences
    let _ = parse_request(data);
});
```

**Run fuzzing:**

```bash
# Run for 10 minutes
cargo fuzz run parse_request -- -max_total_time=600
```

### When to Use Fuzzing

**Ideal for:**
- Parsers (HTTP, JSON, custom protocols)
- Image/audio/video decoders
- Compression/decompression
- Cryptographic implementations
- Any code handling untrusted input

### Integrate Fuzzing in CI

```yaml
# .github/workflows/fuzz.yml
name: Fuzzing
on: [push, pull_request]

jobs:
  fuzz:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@nightly
      - name: Install cargo-fuzz
        run: cargo install cargo-fuzz
      - name: Run fuzz tests (10 min each)
        run: |
          for target in fuzz/fuzz_targets/*.rs; do
            cargo fuzz run $(basename $target .rs) -- -max_total_time=600
          done
```

### Maintain Fuzz Corpus

```bash
# Corpus files saved in fuzz/corpus/
git add fuzz/corpus/
git commit -m "Update fuzz corpus with new findings"
```

**Convert fuzz failures to unit tests:**

```rust
#[test]
fn test_fuzz_finding_20240115() {
    // Input that caused fuzzer to crash
    let input = b"\x00\xff\x00\x00";
    let result = parse_request(input);
    assert!(result.is_err()); // Now handled gracefully
}
```

---

## Layer 5: Integration Testing

### Structure Integration Tests

```
tests/
├── common/
│   └── mod.rs          # Shared test utilities
├── api_tests.rs        # API integration tests
├── database_tests.rs   # Database integration tests
└── e2e_tests.rs        # End-to-end workflows
```

### Test Real Usage Patterns

```rust
// tests/api_tests.rs
use myapp::*;

#[tokio::test]
async fn test_user_registration_flow() {
    let app = setup_test_app().await;

    // 1. Register user
    let response = app.register_user(
        "alice@example.com",
        "secure_password"
    ).await;
    assert_eq!(response.status(), 201);

    // 2. Verify email sent
    let email = app.get_sent_emails().await
        .into_iter()
        .find(|e| e.to == "alice@example.com")
        .expect("Verification email not sent");

    // 3. Confirm email
    let token = extract_token(&email.body);
    let response = app.confirm_email(&token).await;
    assert_eq!(response.status(), 200);

    // 4. Login with confirmed account
    let response = app.login("alice@example.com", "secure_password").await;
    assert_eq!(response.status(), 200);
}
```

### Test Both Single and Multi-Threaded

```rust
#[tokio::test]
async fn test_concurrent_transfers() {
    let service = setup_service().await;
    let account = service.create_account(Money::from_dollars(1000)).await.unwrap();

    // Spawn 10 concurrent transfers
    let handles: Vec<_> = (0..10)
        .map(|_| {
            let service = service.clone();
            let account_id = account.id;
            tokio::spawn(async move {
                service.transfer(account_id, dest_id, Money::from_dollars(10)).await
            })
        })
        .collect();

    // All should succeed
    for handle in handles {
        handle.await.unwrap().unwrap();
    }

    // Final balance should be $900 (1000 - 10*10)
    let final_account = service.get_account(account.id).await.unwrap();
    assert_eq!(final_account.balance, Money::from_dollars(900));
}
```

---

## Layer 6: Formal Verification (Safety-Critical)

### Kani for Bounded Model Checking

**Install:**

```bash
cargo install --locked kani-verifier
cargo kani setup
```

**Verify function:**

```rust
#[cfg(kani)]
#[kani::proof]
fn verify_transfer_preserves_total() {
    let from_balance: u64 = kani::any();
    let to_balance: u64 = kani::any();
    let amount: u64 = kani::any();

    // Precondition
    kani::assume(from_balance >= amount);
    kani::assume(to_balance.checked_add(amount).is_some());

    let total_before = from_balance + to_balance;

    let from_after = from_balance - amount;
    let to_after = to_balance + amount;
    let total_after = from_after + to_after;

    // Postcondition: total preserved
    assert_eq!(total_before, total_after);
}
```

### Loom for Concurrency Verification

**Exhaustive schedule exploration:**

```rust
use loom::sync::Arc;
use loom::sync::atomic::{AtomicUsize, Ordering};
use loom::thread;

#[test]
fn test_concurrent_counter() {
    loom::model(|| {
        let counter = Arc::new(AtomicUsize::new(0));

        let threads: Vec<_> = (0..2)
            .map(|_| {
                let counter = counter.clone();
                thread::spawn(move || {
                    counter.fetch_add(1, Ordering::SeqCst);
                })
            })
            .collect();

        for thread in threads {
            thread.join().unwrap();
        }

        // Loom explores all possible interleavings
        assert_eq!(counter.load(Ordering::SeqCst), 2);
    });
}
```

---

## Test Organization Best Practices

### Use Test Fixtures

```rust
// tests/common/mod.rs
pub struct TestContext {
    pub db: PgPool,
    pub app: TestApp,
}

impl TestContext {
    pub async fn new() -> Self {
        let db = setup_test_database().await;
        let app = TestApp::new(&db).await;
        Self { db, app }
    }
}

impl Drop for TestContext {
    fn drop(&mut self) {
        // Cleanup test data
    }
}

// In tests
#[tokio::test]
async fn test_something() {
    let ctx = TestContext::new().await;
    // Use ctx.db and ctx.app
}
```

### Parameterized Tests with rstest

```rust
use rstest::rstest;

#[rstest]
#[case(0, "zero")]
#[case(1, "one")]
#[case(42, "forty-two")]
fn test_number_to_word(#[case] num: i32, #[case] expected: &str) {
    assert_eq!(number_to_word(num), expected);
}
```

### Table-Driven Tests

```rust
#[test]
fn test_email_validation() {
    let test_cases = vec![
        ("valid@example.com", true),
        ("invalid@", false),
        ("@invalid.com", false),
        ("no-at-sign.com", false),
        ("valid+tag@example.com", true),
    ];

    for (email, should_be_valid) in test_cases {
        assert_eq!(
            validate_email(email).is_ok(),
            should_be_valid,
            "Failed for email: {}",
            email
        );
    }
}
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: dtolnay/rust-toolchain@stable

      - name: Run unit tests
        run: cargo test --all-features

      - name: Run doc tests
        run: cargo test --doc

      - name: Install coverage tool
        run: cargo install cargo-llvm-cov

      - name: Generate coverage
        run: cargo llvm-cov --all-features --html

      - name: Enforce coverage threshold
        run: cargo llvm-cov --fail-under-lines 90

      - name: Upload coverage report
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: target/llvm-cov/html/
```

---

## Review Checklist: Testing

### Unit Tests
- [ ] 100% line coverage for new/modified code
- [ ] All public APIs have tests
- [ ] Error paths tested (not just happy paths)
- [ ] Each bug has regression test
- [ ] Tests run quickly (\u003c5 seconds for unit tests)
- [ ] Tests are deterministic (no flaky tests)

### Property-Based Tests
- [ ] Algorithmic code has property tests
- [ ] Roundtrip properties tested (encode/decode, serialize/deserialize)
- [ ] Invariants tested across random inputs
- [ ] Shrinking produces minimal failing examples

### Documentation Tests
- [ ] All code examples in docs compile
- [ ] README examples tested with `#![doc = include_str!("../README.md")]`
- [ ] Examples requiring external resources marked with `no_run`

### Fuzzing
- [ ] Fuzz targets for all input-handling code
- [ ] Fuzzing integrated into CI (time-limited)
- [ ] Fuzz corpus maintained in version control
- [ ] Fuzz findings converted to unit tests

### Integration Tests
- [ ] Real usage patterns tested in `tests/` directory
- [ ] Both single-threaded and multi-threaded scenarios
- [ ] End-to-end workflows covered
- [ ] Test fixtures and utilities in `tests/common/`

### Formal Verification (if applicable)
- [ ] Safety-critical functions verified with Kani
- [ ] Concurrent code verified with Loom
- [ ] Preconditions and postconditions documented

---

## Anti-Patterns to Avoid

### ❌ Testing Implementation Details

```rust
// BAD: Fragile test coupled to implementation
#[test]
fn test_internal_cache() {
    let service = MyService::new();
    assert_eq!(service.cache.len(), 0);  // Testing internal state
}
```

**Better:** Test observable behavior, not internals.

### ❌ Flaky Tests

```rust
// BAD: Non-deterministic test
#[test]
fn test_timeout() {
    std::thread::sleep(Duration::from_millis(100));
    // Timing-dependent assertion
}
```

**Better:** Use mocked time or explicit synchronization.

### ❌ Tests That Don't Test Anything

```rust
// BAD: Useless test
#[test]
fn test_user_creation() {
    let user = User::new("Alice");
    // No assertions!
}
```

**Better:** Always have assertions checking expected behavior.

---

## Summary: Testing Excellence

1. **100% coverage target** - Measure with cargo-llvm-cov
2. **Test error paths** - Not just happy paths
3. **Property-based testing** - For algorithms and parsers
4. **Fuzz all input handlers** - Find edge cases automatically
5. **Integration tests** - Test real usage patterns
6. **Formal verification** - For safety-critical code
7. **Fast feedback** - Unit tests run in seconds
8. **No flaky tests** - All tests deterministic
9. **Tests as documentation** - Examples in docs must work
10. **Stop the line on red** - Never merge failing tests

**Remember:** Tests are not a checkbox exercise. They're your safety net, your documentation, and your confidence that the code works as intended. Invest in comprehensive testing—it pays dividends in production stability.
