# Playwright sharding and Test locks

This project targets Playwright **1.63.0**, the stable release that introduced
the official feature named **Test locks**. The API is additional test details:

```ts
test('updates a shared account', { lock: 'shared-account' }, async () => {});
test('needs two resources', { lock: ['database', 'payment-sandbox'] }, async () => {});
test.describe('protected group', { lock: 'shared-account' }, () => {});
```

Sources: [release notes](https://playwright.dev/docs/release-notes),
[Test locks](https://playwright.dev/docs/test-parallel#test-locks), and
[sharding](https://playwright.dev/docs/test-sharding).

## The three levels of concurrency

1. A **worker** is an OS process managed by one Playwright Test invocation.
   Workers have separate browser contexts and cannot share in-memory globals.
2. A **project** is a test configuration, often a browser or environment. One
   invocation can execute several projects using the same worker pool.
3. A **shard** is an independently launched fraction of the suite, normally a
   separate CI job or machine (`--shard=2/4`).

`fullyParallel: true` lets Playwright distribute individual tests rather than
whole files, producing better-balanced shards.

## What Test locks guarantee

- Playwright acquires every named lock before a test starts and releases it
  after the test finishes.
- Tests sharing a lock do not overlap across files, workers, or projects
  **inside one Playwright invocation**.
- Unrelated tests remain parallel.
- A test may require several locks; acquisition waits until all are available.
- In default or serial file mode, a lock used by any test is held for the whole
  file. This repo uses `fullyParallel` to make the examples test-granular.

Test locks are exclusive mutexes. They are not read/write locks and do not
express “many readers, one writer.” Use no lock for truly independent reads,
unique resources for isolated writes, and a named lock only for a scarce
exclusive resource.

## The shard boundary

Shards are separate Playwright invocations. Their schedulers do not communicate,
so the same lock name in two CI jobs is **not a distributed lock**. Locks cannot
coordinate separate processes launched as separate test runs, containers,
machines, or CI agents.

Prefer, in order:

1. isolate data per test with `testInfo.testId`;
2. allocate a resource/account per worker or shard;
3. make backend operations idempotent;
4. use an external distributed lock only when the real resource cannot be
   partitioned.

Never use a Playwright lock to hide test dependencies, force a desired order,
or protect an in-memory variable that workers cannot share anyway.

## Observe the behavior

```bash
pnpm demo:locks
```

The two `WITHOUT lock` tests contend for an atomic directory representing a
shared account. One can log a `collision`. The two `WITH lock` tests use
`{ lock: 'shared-account' }`; both acquire their equivalent protected probe,
one after the other. The probes have separate filesystem names so both cases
can run concurrently without contaminating the comparison.

Every participant touching a resource must declare the same lock. A test that
omits it is invisible to Playwright's lock scheduler and can still collide
with protected tests.

```bash
pnpm demo:cross-shard
```

This launches two independent test processes. Both schedulers believe they own
the same named lock; the external filesystem probe exposes the overlap. A shard
failure is expected evidence, and the teaching script exits successfully after
explaining it.

For distribution:

```bash
pnpm test:shard:1
pnpm test:shard:2
```

Run those in two terminals. Compare `[demo]` records or
`demo-output/timeline.jsonl`. `worker` and `parallelIndex` belong to each
invocation; they are not globally unique across CI machines. These two commands
teach suite distribution only; use `demo:cross-shard` for the lock-boundary
lesson because shard allocation is intentionally controlled there.

## Authentication architecture

`auth-setup` logs in once as the public seeded customer and writes
`playwright/.auth/customer.json`. The `chromium` project depends on setup and
loads that state into each isolated browser context. This avoids repeated UI
login while preserving per-test context isolation.

The hosted application stores its simulated backend and token in browser
`localStorage`; storage state captures that origin-scoped state. Therefore,
contexts do not actually mutate one common remote database. The locking demo
uses an atomic filesystem resource to make genuine cross-worker contention
observable. In a production application, that resource would be a shared user,
tenant, payment sandbox, device, or mutable backend record.

The seeded credentials are intentionally published by the training site:
`customer@example.com` / `Password123!`. Do not copy this pattern for real
credentials; use CI secrets and never commit generated auth state.

## Choosing the right tool

| Situation | Technique |
|---|---|
| Independent UI reads | Parallel tests, no lock |
| Writable data can be partitioned | Unique test/worker/shard resource |
| One exclusive resource within one run | Named Test lock |
| Resource shared across CI jobs/machines | External coordination or partitioning |
| Tests depend on each other | Redesign for isolation; do not lock |
| Login reused by many tests | Setup project + `storageState` |
