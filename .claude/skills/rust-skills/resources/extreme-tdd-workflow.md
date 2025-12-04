# Extreme TDD Workflow for Rust

A disciplined test-driven development workflow with atomic commits, quality gates, and PMAT integration.

---

## The RED-GREEN-REFACTOR Cycle

### Philosophy

Every ticket follows three phases with distinct commits:

1. **RED** - Write tests that fail (define the contract)
2. **GREEN** - Write minimal code to pass tests (make it work)
3. **REFACTOR** - Clean up while maintaining green (make it right)

### Why This Matters

- **Tests define behavior** before implementation
- **Minimal code** prevents over-engineering
- **Quality gates** enforce standards
- **Atomic commits** enable bisecting and rollback
- **Squashed final commit** keeps history clean

---

## Phase 1: RED (Failing Tests)

### What to Do

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_user_success() {
        // Arrange
        let pool = create_test_pool().await;
        let ctx = Ctx::root_ctx();
        let mm = ModelManager::new(pool);

        let user_data = UserForCreate {
            username: "testuser".to_string(),
            email: "test@example.com".to_string(),
        };

        // Act
        let result = UserBmc::create(&ctx, &mm, user_data).await;

        // Assert
        assert!(result.is_ok());
        let user_id = result.unwrap();
        assert!(user_id > 0);
    }

    #[tokio::test]
    async fn test_create_user_duplicate_email_fails() {
        // Test error case
    }
}
```

### Commit

```bash
git add tests/
git commit -m "[RED] PROJ-123: Add failing tests for user creation

- Unit tests for UserBmc::create
- Error case for duplicate email
- Property tests for username validation

Tests: 3 new | Status: FAILING (expected)"
```

### Quality Checklist

- [ ] Tests compile (`cargo test --no-run`)
- [ ] Tests fail with expected errors
- [ ] No implementation code written yet
- [ ] Tests cover happy path AND error cases
- [ ] Property-based tests for invariants

---

## Phase 2: GREEN (Minimal Implementation)

### What to Do

```rust
pub struct UserBmc;

impl UserBmc {
    pub async fn create(
        ctx: &Ctx,
        mm: &ModelManager,
        data: UserForCreate,
    ) -> Result<i64> {
        // MINIMAL code to pass tests - no extras!
        let user_id = sqlx::query_scalar!(
            r#"
            INSERT INTO users (username, email, created_by)
            VALUES ($1, $2, $3)
            RETURNING id
            "#,
            data.username,
            data.email,
            ctx.user_id()
        )
        .fetch_one(mm.db())
        .await?;

        Ok(user_id)
    }
}
```

### Commit

```bash
git add src/
git commit -m "[GREEN] PROJ-123: Implement user creation

- UserBmc::create with SQLx
- Basic error handling
- All tests passing

Tests: 3 passing | Coverage: 78%"
```

### Quality Checklist

- [ ] All tests pass (`cargo test`)
- [ ] No extra features beyond tests
- [ ] No premature optimization
- [ ] Code compiles without warnings

---

## Phase 3: REFACTOR (Quality Gates)

### What to Do

```rust
// Add documentation
/// Creates a new user in the system.
///
/// # Arguments
/// * `ctx` - Request context with user info
/// * `mm` - Model manager with database pool
/// * `data` - User creation data
///
/// # Errors
/// Returns `Error::DuplicateEmail` if email exists.
pub async fn create(
    ctx: &Ctx,
    mm: &ModelManager,
    data: UserForCreate,
) -> Result<i64> {
    // Validate input
    validate_username(&data.username)?;
    validate_email(&data.email)?;

    // Check for duplicate
    if Self::email_exists(mm, &data.email).await? {
        return Err(Error::DuplicateEmail(data.email));
    }

    // Create user
    let user_id = sqlx::query_scalar!(
        // ...
    )
    .fetch_one(mm.db())
    .await
    .map_err(|e| Error::Database(e.to_string()))?;

    Ok(user_id)
}
```

### Run Quality Checks

```bash
# Coverage check
cargo tarpaulin --out html
# Must be ≥85%

# Mutation testing
cargo mutants --timeout 60
# Or with PMAT
pmat mutate --target src/model/user.rs --threshold 80

# Technical debt grading
pmat analyze tdg --path src/model/user.rs
# Must be grade A or B

# Clippy
cargo clippy -- -D warnings

# Format
cargo fmt --check
```

### Commit

```bash
git add .
git commit -m "[REFACTOR] PROJ-123: Clean up user creation

- Add input validation
- Improve error handling
- Add documentation
- Optimize query

Coverage: 92% | Mutation: 88% | Grade: A"
```

### Quality Checklist

- [ ] Coverage ≥85% (`cargo tarpaulin`)
- [ ] Mutation score ≥80% (`pmat mutate`)
- [ ] TDG grade A or B (`pmat analyze tdg`)
- [ ] Zero clippy warnings
- [ ] Documentation complete
- [ ] No TODO/FIXME comments

---

## Final: Squash and Merge

### Interactive Rebase

```bash
# Squash RED-GREEN-REFACTOR into one commit
git rebase -i HEAD~3

# In editor, change to:
pick abc1234 [RED] PROJ-123: Add failing tests
squash def5678 [GREEN] PROJ-123: Implement user creation
squash ghi9012 [REFACTOR] PROJ-123: Clean up user creation
```

### Final Commit Message

```
PROJ-123: Add user creation endpoint

Implement UserBmc::create with full validation and error handling.

## Changes
- Add UserForCreate struct with validation
- Implement UserBmc::create with SQLx
- Add duplicate email check
- Handle database errors gracefully

## Testing
- Unit tests for success and error cases
- Property tests for username validation
- Integration test with test database

## Quality Metrics
- Coverage: 92% ✅
- Mutation score: 88% ✅
- Quality grade: A ✅

Closes #123
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Extreme TDD Quality Gates

on:
  pull_request:
    branches: [main, develop]

jobs:
  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install tools
        run: |
          cargo install cargo-tarpaulin cargo-mutants pmat

      - name: Run tests
        run: cargo test --all-features

      - name: Check coverage (≥85%)
        run: |
          cargo tarpaulin --out json > coverage.json
          COVERAGE=$(jq '.coverage' coverage.json)
          if (( $(echo "$COVERAGE < 85" | bc -l) )); then
            echo "Coverage $COVERAGE% < 85%"
            exit 1
          fi

      - name: Mutation testing (≥80%)
        run: pmat mutate --target src/ --threshold 80

      - name: Quality grade (A/B required)
        run: |
          GRADE=$(pmat analyze tdg --format json | jq -r '.grade')
          if [[ "$GRADE" != "A" && "$GRADE" != "A+" && "$GRADE" != "B" && "$GRADE" != "B+" ]]; then
            echo "Grade $GRADE not acceptable (need A or B)"
            exit 1
          fi

      - name: Clippy
        run: cargo clippy -- -D warnings
```

---

## Commit Message Templates

### RED Phase

```
[RED] TICKET-ID: Add failing tests for FEATURE

- Test case 1: description
- Test case 2: description
- Property test: invariant description

Tests: N new | Status: FAILING (expected)
```

### GREEN Phase

```
[GREEN] TICKET-ID: Implement FEATURE

- Implementation detail 1
- Implementation detail 2

Tests: N passing | Coverage: XX%
```

### REFACTOR Phase

```
[REFACTOR] TICKET-ID: Clean up FEATURE

- Improvement 1
- Improvement 2
- Documentation added

Coverage: XX% | Mutation: XX% | Grade: X
```

### Final Squashed

```
TICKET-ID: FEATURE description

Brief explanation of what was implemented and why.

## Changes
- Change 1
- Change 2

## Quality Metrics
- Coverage: XX% ✅
- Mutation score: XX% ✅
- Quality grade: X ✅

Closes #XXX
```

---

## Property-Based Testing

Use `proptest` for invariant testing:

```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn username_validation_never_panics(s in ".*") {
        // Should never panic, only return Result
        let _ = validate_username(&s);
    }

    #[test]
    fn valid_usernames_pass_validation(
        s in "[a-zA-Z][a-zA-Z0-9_]{2,29}"
    ) {
        assert!(validate_username(&s).is_ok());
    }

    #[test]
    fn user_id_is_positive(id in 1i64..=i64::MAX) {
        let user_id = UserId::new(id);
        assert!(user_id.is_ok());
    }
}
```

---

## Quick Reference

| Phase | Commit Prefix | Quality Gate |
|-------|---------------|--------------|
| RED | `[RED]` | Tests compile + fail |
| GREEN | `[GREEN]` | Tests pass |
| REFACTOR | `[REFACTOR]` | Coverage ≥85%, Mutation ≥80%, Grade A/B |
| Final | None | Squashed, all gates pass |

### Commands Cheat Sheet

```bash
# RED phase
cargo test --no-run          # Verify tests compile
cargo test                   # Verify tests fail

# GREEN phase
cargo test                   # All tests pass

# REFACTOR phase
cargo tarpaulin              # Coverage
pmat mutate --threshold 80   # Mutation
pmat analyze tdg             # Quality grade
cargo clippy -- -D warnings  # Lints
cargo fmt --check            # Format

# Final
git rebase -i HEAD~3         # Squash
```

---

## Related Resources

- [testing-guide.md](testing-guide.md) - Detailed testing patterns
- [paiml-mcp-toolkit](../../paiml-mcp-toolkit/SKILL.md) - PMAT integration
- [kaizen-solaris-review](../../kaizen-solaris-review/SKILL.md) - Toyota Way review
