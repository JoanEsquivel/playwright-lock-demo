# Playwright sharding and Test locks

A guided tour of Playwright 1.63 **Test locks**: what problem they solve, how to
see them working in this repo, and the one place where they silently stop
working.

Read this top to bottom the first time. Every command here is runnable and the
output shown was captured from a real run.

## Setup

```bash
corepack enable
corepack pnpm install
corepack pnpm exec playwright install chromium --with-deps
cp .env.example .env   # then fill in E2E_USERNAME and E2E_PASSWORD
```

The application under test is a public training site, so its seeded customer
credentials are published on its own login page.

## 1. The problem

You have 200 tests and you run them on 4 workers to keep the suite fast. Two of
those tests both update the same thing — one customer account, one payment
sandbox, one inventory record. They land on different workers, they run at the
same instant, and one of them fails.

You have three bad options and one good one:

- Drop to `--workers=1`. The suite is now correct and four times slower.
- Mark the file `test.describe.serial`. That only helps if both tests live in
  the same file.
- Add sleeps and retries. Now the failure is rarer but not gone.
- **Declare the shared resource.** Playwright serializes only those tests and
  leaves the other 198 running in parallel.

That last one is Test locks.

## 2. The API

A lock is a name you attach to a test. Playwright acquires it before the test
starts and releases it when the test finishes.

```ts
// One resource
test('updates a shared account', { lock: 'shared-account' }, async () => {});

// Several resources: waits until all of them are free
test('charges the account', { lock: ['shared-account', 'payment-sandbox'] }, async () => {});

// A whole group
test.describe('account writes', { lock: 'shared-account' }, () => {});
```

The name is just a string. Two tests coordinate because they spell the same
name — there is nothing to register or configure.

## 3. See it fail, then see it pass

```bash
pnpm demo:locks
```

This runs four tests on four workers. Two of them write to an unprotected
resource; two write to a protected one. Each test creates a directory as its
shared resource — `mkdir` either succeeds or reports `EEXIST`, so a collision
is unambiguous.

The unprotected pair (`no-lock-a.spec.ts`, `no-lock-b.spec.ts`) declares no
lock. One test gets in, the other crashes into it:

```text
[demo] {"event":"acquired","test":"should expose that writer B may collide","worker":3,...}
[demo] {"event":"collision","test":"should expose that writer A may collide","worker":2,...}
```

The protected pair (`with-lock-a.spec.ts`, `with-lock-b.spec.ts`) declares
`{ lock: 'shared-account' }`. Both acquire, and the timestamps show they did it
one after the other:

```text
[demo] {"event":"acquired","test":"should give writer A exclusive access","worker":1,...,"timestamp":"...:45.622Z","resource":"shared-account"}
[demo] {"event":"acquired","test":"should make writer B wait for the same named lock","worker":2,...,"timestamp":"...:46.541Z","resource":"shared-account"}
```

Two different workers, no collision, and a gap of about 900 ms — exactly how
long writer A holds the resource. Writer B was queued, not slowed down.

Meanwhile the unrelated UI tests never waited for anything. That is the whole
point: the lock costs you serialization on two tests, not on the suite.

Every `[demo]` line is also appended to `demo-output/timeline.jsonl`, so you
can sort the run by timestamp after the fact.

### The rule that bites people

A lock only holds back tests that name it. A test that touches
`shared-account` without declaring the lock is invisible to the scheduler and
will still collide. Every participant has to opt in.

## 4. Worker, project, shard

Three words that sound similar and are not.

**Worker** — an OS process. `pnpm demo:locks` uses `--workers=4`, so four Node
processes run tests at once. They have separate browser contexts and separate
memory: a module-level variable in one worker does not exist in the others.
That is why the demo uses the filesystem, not a JS variable, to represent a
shared resource.

**Project** — a named configuration in `playwright.config.ts`. This repo has
three: `setup` (logs in), `ui`, and `e2e`. One run executes several projects
using the same pool of workers. Locks apply across projects, because it is
still one run.

**Shard** — a fraction of the suite, launched as its own process:

```bash
pnpm test:shard:1   # in one terminal
pnpm test:shard:2   # in another
```

Each command collects a complementary slice — in CI these would be two
machines. `fullyParallel: true` lets Playwright distribute individual tests
rather than whole files, so the slices come out balanced.

Note that `worker` and `parallelIndex` in the `[demo]` records are numbered per
invocation. Worker 0 on shard 1 and worker 0 on shard 2 are unrelated
processes.

## 5. The gotcha: locks do not cross shards

**A Test lock is a mutex inside one Playwright process. It is not a
distributed lock.**

Two shards are two independent `playwright test` invocations. Their schedulers
never talk to each other. Both believe they hold `shared-account`, and both are
right — about their own process.

```bash
pnpm demo:cross-shard
```

This launches the two protected tests as two separate invocations, each with
one worker. The lock names are identical. The result:

```text
  1 failed
    [e2e] › tests/e2e/locking/with-lock-b.spec.ts:5:7 › ... should make writer B wait for the same named lock
  1 passed (1.5s)
Shard exit codes: 0, 1
```

The failure is the lesson, so the demo script exits 0. The same two tests pass
together in section 3 and fail here — the only thing that changed is that they
were split across processes.

### What to do instead in CI

In order of preference:

1. **Make the resource unique per test.** Key data on `testInfo.testId` so
   nothing is shared and nothing needs a lock.
2. **Allocate one resource per worker or shard.** One account per shard, one
   tenant per job.
3. **Make the backend operation idempotent**, so overlap is harmless.
4. **Reach for an external distributed lock** only when the real resource
   genuinely cannot be partitioned.

And never use a lock to force test order or to paper over tests that depend on
each other. Locks control access, not sequence.

## 6. Choosing the right tool

| Situation | Technique |
|---|---|
| Independent UI reads | Parallel tests, no lock |
| Writable data can be partitioned | Unique test/worker/shard resource |
| One exclusive resource within one run | Named Test lock |
| Resource shared across CI jobs/machines | External coordination or partitioning |
| Tests depend on each other | Redesign for isolation; do not lock |
| Login reused by many tests | Setup project + `storageState` |

Test locks are exclusive mutexes. They are not read/write locks — there is no
"many readers, one writer."

One more detail worth knowing: in default (non-`fullyParallel`) file mode, a
lock declared by any test is held for the whole file. This repo sets
`fullyParallel: true` so the examples are test-granular.

## 7. How authentication is set up

The `setup` project runs `tests/setup/auth.setup.ts`, logs in once through the
UI, and writes `.auth/user.json`. The `ui` and `e2e` projects declare
`dependencies: ['setup']` and load that file as `storageState`, so every test
starts authenticated in its own isolated context without repeating the login.

Credentials come from `.env` through `utils/env.ts` — never hardcoded in a
spec. Use CI secrets for anything real, and never commit generated auth state.

## 8. Why the demo uses the filesystem

The training site keeps its simulated backend in browser `localStorage`, which
is scoped per browser context. Contexts are already isolated, so nothing there
is genuinely shared — there would be no contention to demonstrate.

So `utils/exclusive-resource.ts` creates a directory as a real cross-process
resource, and `utils/observation.ts` adds fixed delays so the overlap is
visible. Both are teaching instrumentation. In a production suite that resource
would be a shared user, tenant, payment sandbox, device, or mutable record —
and your UI tests should use web-first assertions, never fixed delays.

The probes live in `utils/`, outside the specs, so the specs stay declarative
and the timing can be removed without touching the page objects.

## 9. Project standards

The active contract is the root `AGENTS.md`. In short:

- `.cursor/`, `.claude/`, `AGENTS.md`, and Copilot instructions live at the
  repo root so the tooling actually applies them;
- base URL and credentials are read only through `utils/env.ts` and `.env`;
- page objects own navigation, load guards, actions, and described locators;
- every page object is wired through `fixtures/page.fixtures.ts`;
- specs import only from `fixtures/index.fixtures`, hold the assertions, and
  carry `@ui` or `@e2e` tags;
- `tests/setup` for authentication, `tests/ui` for independent UI examples,
  `tests/e2e` for authenticated and shared-resource examples;
- `pnpm lint` gates architecture and TypeScript.

`cursor-standards/` holds the original copied kit, kept for reference only.

## Reference

- [Test locks](https://playwright.dev/docs/test-parallel#test-locks)
- [Sharding](https://playwright.dev/docs/test-sharding)
- [Release notes](https://playwright.dev/docs/release-notes)
