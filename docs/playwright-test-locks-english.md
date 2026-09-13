# 🔒 Playwright Test Locks

> **New feature introduced in Playwright 1.63**

**Test Locks** allow Playwright to preserve parallel execution while preventing tests that share the same resource from running at the same time.

---

## 1. What problem does it solve?

Suppose we run Playwright with multiple workers:

```bash
npx playwright test --workers=4
```

Playwright can execute:

```text
Worker 1 → Test A
Worker 2 → Test B
Worker 3 → Test C
Worker 4 → Test D
```

This is great for reducing execution time.

The problem appears when two tests modify the **same shared resource**.

For example:

```text
Test A → changes the user's name
Test C → changes the same user's email
```

If both tests use the same account, they can interfere with each other and create unstable or flaky tests.

---

## 2. Solution: `lock`

We can assign a lock to tests that use the same resource.

```ts
test('change username', {
  lock: 'user-settings'
}, async ({ page }) => {
  // ...
});
```

And another test:

```ts
test('change email', {
  lock: 'user-settings'
}, async ({ page }) => {
  // ...
});
```

Both use:

```text
lock: user-settings
```

Playwright prevents those tests from running simultaneously.

The rest of the test suite can continue running in parallel.

---

## 3. Real-world example

Suppose we have a shared account:

```text
qa-user@test.com
```

And three tests:

```ts
import { test, expect } from '@playwright/test';

test('change username', {
  lock: 'qa-user'
}, async ({ page }) => {

  await page.goto('/profile');

  await page.getByLabel('Name').fill('Joan');
  await page.getByRole('button', { name: 'Save' }).click();

});

test('change email', {
  lock: 'qa-user'
}, async ({ page }) => {

  await page.goto('/profile');

  await page.getByLabel('Email').fill('joan@test.com');
  await page.getByRole('button', { name: 'Save' }).click();

});

test('open homepage', async ({ page }) => {

  await page.goto('/');

});
```

With multiple workers, execution could look like this:

```text
Worker 1
🔒 change username
   lock: qa-user
   ███████████

Worker 2
⏳ change email
   waiting for qa-user
              ███████████

Worker 3
▶ open homepage
   █████
```

The third test does not require the lock, so it can continue running normally.

### Important

`lock` **does not make the entire test suite serial**.

It only coordinates tests that share the same lock.

---

## 4. Before: serial execution

A traditional alternative would be:

```ts
test.describe.configure({
  mode: 'serial'
});
```

This can significantly reduce parallelism:

```text
A ──────────
            B ──────────
                        C ──────────
                                    D ──────────
```

With locks, we can instead have:

```text
A [database] ──────────
B [database]            ──────────

C [payments] ──────────
D [search]   ─────
E [login]    ────────
```

Only **A and B** need to coordinate with each other.

The other tests can continue running in parallel.

---

## 5. Multiple locks

A test can also require multiple shared resources.

For example:

```ts
test('reset environment', {
  lock: ['database', 'external-api']
}, async ({ request }) => {

  // reset database
  // reset external service

});
```

Conceptually:

```text
Test
 │
 ├── 🔒 database
 │
 └── 🔒 external-api
```

Playwright waits until the required resources are available before running the test.

Once the test finishes, the locks are released.

---

## 6. Locks at the `describe` level

A lock can also be applied to a group of tests.

```ts
test.describe('User Management', {
  lock: 'admin-user'
}, () => {

  test('change username', async ({ page }) => {
    // ...
  });

  test('change permissions', async ({ page }) => {
    // ...
  });

  test('change email', async ({ page }) => {
    // ...
  });

});
```

The tests inside the group use the corresponding lock.

This is useful when an entire group of tests shares the same resource.

---

# 7. Example: API + UI

Suppose we have:

```text
users-ui.spec.ts
users-api.spec.ts
admin.spec.ts
```

All three files manipulate the same user.

### `users-ui.spec.ts`

```ts
test('update user from UI', {
  lock: 'user-123'
}, async ({ page }) => {

  // modify user 123

});
```

### `users-api.spec.ts`

```ts
test('update user through API', {
  lock: 'user-123'
}, async ({ request }) => {

  // modify user 123

});
```

### `admin.spec.ts`

```ts
test('delete user', {
  lock: 'user-123'
}, async ({ page }) => {

  // delete user 123

});
```

Conceptually:

```text
users-ui.spec.ts
        │
        └──────┐
               │
users-api.spec.ts ─── 🔒 user-123
               │
admin.spec.ts ──┘
```

The tests may live in different files and execute through different workers, while the lock coordinates access to the shared resource within the supported Playwright execution scope.

---

# 8. Locks + Workers

Locks are especially useful when running multiple workers.

For example:

```bash
npx playwright test --workers=8
```

Without locks:

```text
Worker 1 → User Settings Test A
Worker 2 → User Settings Test B
Worker 3 → Checkout
Worker 4 → Search
Worker 5 → Login
Worker 6 → API
Worker 7 → Products
Worker 8 → Reports
```

The first two tests could interfere with each other.

With:

```text
lock: user-settings
```

we can maintain:

```text
Worker 1 → 🔒 User Settings Test A

Worker 2 → ⏳ User Settings Test B

Worker 3 → Checkout ─────────▶
Worker 4 → Search ───────────▶
Worker 5 → Login ────────────▶
Worker 6 → API ──────────────▶
Worker 7 → Products ─────────▶
Worker 8 → Reports ──────────▶
```

The suite remains highly parallel.

---

# 9. Locks + Sharding

It is important to distinguish between **workers** and **sharding**.

## Workers

```bash
npx playwright test --workers=4
```

Workers provide parallel execution within a Playwright test run.

---

## Sharding

```bash
npx playwright test --shard=1/4
npx playwright test --shard=2/4
npx playwright test --shard=3/4
npx playwright test --shard=4/4
```

Each shard can typically run as a separate CI job or process.

For example:

```text
GitHub Actions

          Test Suite
              │
      ┌───────┼───────┐
      │       │       │
      ▼       ▼       ▼
   Shard 1  Shard 2  Shard 3  Shard 4
```

---

## ⚠️ Important

Do not assume that a Test Lock behaves as a **global distributed lock across independent CI machines or processes**.

For example:

```text
Machine 1
Shard 1/4

Test A
🔒 database
```

and:

```text
Machine 2
Shard 2/4

Test B
🔒 database
```

are independent executions.

If different shards truly share the same external resource, another strategy may be required, such as:

- independent data per shard;
- independent users;
- independent environments;
- controlled assignment of specific tests;
- an external distributed locking mechanism.

---

# 10. Example architecture

A test suite could look like this:

```text
tests/

├── auth/
│   ├── login.spec.ts
│   └── logout.spec.ts
│
├── users/
│   ├── profile.spec.ts
│   └── permissions.spec.ts
│
├── payments/
│   └── checkout.spec.ts
│
└── shared-resource/
    └── admin-settings.spec.ts
```

Most tests should run normally in parallel:

```text
95% of tests
      ↓
PARALLEL
████████████████████████████
```

While tests that truly share resources use locks:

```text
5% shared resources
      ↓
LOCKS
████ → ████ → ████
```

Instead of turning the entire suite into:

```text
100% of suite
      ↓
SERIAL
████ → ████ → ████ → ████ → ████
```

---

# 11. When should Test Locks be used?

They are especially useful for resources such as:

```text
Shared User
Shared Database Record
Admin Account
Feature Flags
Global Settings
Shared Tenant
External Test Account
Shared API Resource
Environment Configuration
```

Examples:

```ts
lock: 'admin-user'
```

```ts
lock: 'database-reset'
```

```ts
lock: 'feature-flags'
```

```ts
lock: 'shared-tenant'
```

---

# 12. When NOT to use them

Locks should not be used as an automatic solution for every flaky test.

If we can create:

```text
Test A → user-A
Test B → user-B
Test C → user-C
```

that is generally better than:

```text
Test A ─┐
Test B ─┼── 🔒 shared-user
Test C ─┘
```

The principle should remain:

> **Test isolation first, locks when shared resources are unavoidable.**

---

# 13. Locks vs Serial

### Serial

```ts
test.describe.configure({
  mode: 'serial'
});
```

Conceptually:

```text
Test A
   ↓
Test B
   ↓
Test C
```

### Lock

```ts
lock: 'shared-resource'
```

Conceptually:

```text
               ┌─ Test C ──────────▶
               │
Test A 🔒 ─────┼─ Test D ──────────▶
      ↓        │
Test B 🔒      └─ Test E ──────────▶
```

Only the tests sharing the resource need to wait.

---

# 14. Main idea

The goal of Test Locks is:

> **Preserve parallelism while protecting access to shared resources.**

In a large test suite:

```text
              PLAYWRIGHT
                   │
          ┌────────┴────────┐
          │                 │
     Parallel Tests    Shared Resources
          │                 │
          ▼                 ▼
       Workers            Locks
          │                 │
          └────────┬────────┘
                   ▼
             Faster + Stable
                Test Suite
```

This avoids making large portions of a test suite `serial` simply because a small number of tests share state.

---

# References

- Playwright Release Notes: https://playwright.dev/docs/release-notes
- Playwright Parallelism: https://playwright.dev/docs/test-parallel
