# Playwright Test Locks, explained with a real race

A hands-on tutorial for people who are new to Playwright. You will build (well, run) a small test
framework against a real website, watch two tests corrupt each other when they run in parallel, and
fix it with one option: the **`lock`** setting that shipped in **Playwright 1.63 (September 2026)**.

Everything here is real: the site is live, the failures below were captured from actual runs, and the
GitHub Actions workflow in this repo runs both the broken and the fixed version on every push.

**Target site:** <https://joanesquivel.github.io/the-test-automation-website/> (TAW), a practice app
with a store, a login, a customer role and an admin role.

---

## Table of contents

1. [What is a test lock?](#1-what-is-a-test-lock)
2. [Why do we need it? Workers and shared things](#2-why-do-we-need-it-workers-and-shared-things)
3. [The real case in this repo](#3-the-real-case-in-this-repo)
4. [Set up the project](#4-set-up-the-project)
5. [Step 1 — Watch it break (no locks)](#5-step-1--watch-it-break-no-locks)
6. [Step 2 — Add the lock and watch it pass](#6-step-2--add-the-lock-and-watch-it-pass)
7. [Step 3 — The three ways to declare a lock](#7-step-3--the-three-ways-to-declare-a-lock)
8. [Things that bite people](#8-things-that-bite-people)
9. [When to use a lock (and when not to)](#9-when-to-use-a-lock-and-when-not-to)
10. [Step 4 — Run it in GitHub Actions](#10-step-4--run-it-in-github-actions)
11. [How this project is organised](#11-how-this-project-is-organised)
12. [References](#12-references)

---

## 1. What is a test lock?

Playwright runs your tests in parallel: several **worker processes** each run a test at the same
time. That is great until two tests need the *same thing* at the same time: one test account, one
global setting, one external sandbox.

Since Playwright 1.63 a test can say "I use a shared thing called X":

```ts
test('update user settings', { lock: 'user-settings' }, async ({ page }) => {
  // never runs at the same time as other tests holding 'user-settings'
});
```

From the [1.63.0 release notes](https://github.com/microsoft/playwright/releases/tag/v1.63.0):

> Tests that share a lock name never run concurrently, across files, workers and projects, while
> everything else keeps running in parallel.

And from the [docs](https://playwright.dev/docs/test-parallel#test-locks):

> Playwright acquires all the locks of a test before the test starts and releases them when it
> finishes.

Three things to remember:

- A lock is just a **name** (a string). Nothing to register or configure.
- Two tests with the **same name** take turns. Tests with a different name, or no name, are unaffected.
- The lock is held for the **whole test**, including its fixtures (so before the browser page is even
  created) and released after the test finishes.

## 2. Why do we need it? Workers and shared things

Picture four workers and five tests. Tests A, B and C only read public pages. Tests D and E both
change the same account.

```
              time ─────────────────────────────────────────────────▶
worker 0   [ A ]      [ C ]
worker 1   [ B ]
worker 2   [ D: change the account ...................... ]
worker 3   [ E: read the account ✘ sees D's half-done change ]
```

Without a lock, E can start while D is halfway through, and E fails for a reason that has nothing
to do with the application. This is a **race condition**. It is random, it depends on timing, and a
retry usually hides it. That is the worst kind of failure to have in a suite.

With `lock: 'account'` on D and E:

```
worker 0   [ A ]      [ C ]
worker 1   [ B ]
worker 2   [ D: change the account ...................... ][ E: read ✓ ]
worker 3   (idle until a lock-free test is available)
```

A, B and C are untouched. Only D and E wait for each other. That is the whole feature.

## 3. The real case in this repo

### The shared thing: one signed-in session file

Like most real suites, this one logs in **once** per run. The `setup` project signs in as the
customer and saves the browser session (cookies + localStorage) to `.auth/user.json`. Every other
test starts from that file instead of typing the password again: this is Playwright's
[`storageState`](https://playwright.dev/docs/auth).

```
tests/setup/auth.setup.ts   → signs in as customer → writes .auth/user.json
tests/e2e/session/*.spec.ts → every test starts from .auth/user.json
```

Two kinds of tests touch that file:

| Spec | Role | What it does with `.auth/user.json` |
|---|---|---|
| `tests/e2e/session/customer-account.spec.ts` | **readers** | Load it, open the home page, check the header says *Casey Customer*, the Admin link is hidden, the profile says role `customer`. |
| `tests/e2e/session/admin-area.spec.ts` | **writer** | Signs in as *Alex Admin*, **overwrites the file** with the admin session, checks the admin dashboard and profile, then signs in as the customer again and **writes the file back**. Holds the file for about 6 seconds. |

If a reader starts while the writer holds the file, the reader loads the **admin** session and its
assertions fail: the header says *Alex Admin*, the Admin link is visible.

### An honest note about this site

The deployed site runs "in-browser mode": its API is a service worker and its data lives in
`localStorage`, so every Playwright browser context is isolated and **nothing on the site itself is
shared between workers**. That is why the shared resource in this tutorial lives on the test runner
(the session file). The *shape* of the problem is exactly the one you will meet with a real backend:
one seeded test account that several tests modify. The TAW repository's own end-to-end suite hit
that in its backend mode and solved it by disabling parallelism (`fullyParallel: false`). Locks are
the surgical version of that fix.

Could we avoid the shared file by keeping one session file per role? Yes, and in a real project that
is the better design when it is possible. Locks are for resources you **cannot** duplicate. Keep
that in mind; section 9 comes back to it.

## 4. Set up the project

Prerequisites: Node 20.11+ and [corepack](https://nodejs.org/api/corepack.html) (ships with Node).

```bash
git clone https://github.com/JoanEsquivel/playwright-lock-demo.git
cd playwright-lock-demo
corepack pnpm install
corepack pnpm exec playwright install chromium
cp .env.example .env
```

Open `.env` and fill in the two seed accounts. The site publishes them on its login page
(<https://joanesquivel.github.io/the-test-automation-website/account/login>, panel "Seed accounts");
they are practice credentials, not secrets, but the framework still refuses to hard-code them:

```bash
BASE_URL=https://joanesquivel.github.io/the-test-automation-website/
E2E_USERNAME=<customer email from the login page>
E2E_PASSWORD=<customer password from the login page>
E2E_ADMIN_USERNAME=<admin email from the login page>
E2E_ADMIN_PASSWORD=<admin password from the login page>
```

Quick check that everything is wired:

```bash
corepack pnpm lint     # ESLint + TypeScript, must be clean
corepack pnpm test     # setup → ui + e2e; should be green (this is the WITH-locks version)
```

> If `pnpm` alone is not on your PATH, prefix every command with `corepack` as above.

## 5. Step 1 — Watch it break (no locks)

`tests/demo/race/` contains **copies** of the two session specs. Apart from a header comment, the
only difference is that the `lock` option is removed. A second config, `playwright.race.config.ts`, runs only that folder
with 4 workers, no retries, and every test repeated three times so the overlap is easy to hit.

```bash
corepack pnpm demo:race
```

Captured output (trimmed; the `▶`/`■` lines come from a tiny "timeline" fixture that prints when
each test starts and ends and on which worker):

```text
Running 13 tests using 4 workers

23:17:37.906 ▶ start  [worker 0] should take over the shared session as admin and hand it back to the customer (run 1)
23:17:37.910 ▶ start  [worker 1] should show the customer name in the header (run 1)
23:17:37.915 ▶ start  [worker 3] should open the customer profile from the header (run 1)
23:17:37.917 ▶ start  [worker 2] should hide the admin shortcut for a customer (run 1)
23:17:38.802 ■ end    [worker 1] should show the customer name in the header (run 1) → passed
  ...
23:17:40.427 ▶ start  [worker 3] should take over the shared session as admin and hand it back to the customer (run 3)
23:17:41.184 ▶ start  [worker 2] should show the customer name in the header (run 3)      ← starts while a writer holds the file
23:17:43.941 ■ end    [worker 0] should take over the shared session as admin and hand it back to the customer (run 1) → passed
  ...
23:17:46.987 ■ end    [worker 2] should show the customer name in the header (run 3) → failed
  ✘  11 [demo-race] › tests/demo/race/customer-account.spec.ts:25:7 › Customer account › should show the customer name in the header (5.7s)

  1) Customer account › should show the customer name in the header
    Error: expect(locator).toHaveText(expected) failed
    Locator:  Header user name link
    Expected: "Casey Customer"
    Received: "Alex Admin"

  1 failed
  12 passed (11.8s)
```

Read it top to bottom:

1. Three writers (`run 1`, `run 2`, `run 3`) and nine readers are queued on 4 workers.
2. The reader on worker 2 (`run 3`) starts at `41.184`, while worker 3's writer (started at `40.427`)
   is in its admin phase and the file contains the **admin** session.
3. The reader's browser context is created from that file, so its header says *Alex Admin*.
4. The assertion fails with a message that looks like an application bug. It is not: the
   application is fine, the tests stepped on each other.

You will not always get the same failing test. Sometimes it is the *Admin link should be hidden*
test (`Expected: hidden, Received: visible`). Sometimes, if a reader opens the file in the few
milliseconds while the writer is still writing it, you get
`Error reading storage state from .auth/user.json: Unexpected end of JSON input`. All three are the
same race. Run `pnpm demo:race` a few times to see the variety; on this machine it failed 3 runs out
of 3.

The **writers never fail**: they only assert on their own browser. Races hurt whoever *reads* the
shared thing.

## 6. Step 2 — Add the lock and watch it pass

The fix is the difference between `tests/demo/race/` and `tests/e2e/session/`:

```diff
-test.describe('Customer account', { tag: ['@e2e'] }, () => {
+test.describe('Customer account', { tag: ['@e2e'], lock: 'shared-session' }, () => {
```

```diff
-test.describe('Admin area', { tag: ['@e2e'] }, () => {
+test.describe('Admin area', { tag: ['@e2e'], lock: 'shared-session' }, () => {
```

Both groups now hold the lock named `shared-session`. Nothing else changed. Run the normal suite,
which also contains three public-page tests in `tests/ui/playground.spec.ts`. Those start logged
out, so they never read the session file, and they declare **no** lock:

```bash
corepack pnpm test --workers=4
```

```text
Running 8 tests using 4 workers

23:17:50.206 ▶ start  [worker 2] should show the home headline (run 1)
23:17:50.213 ▶ start  [worker 1] should show the store entrance (run 1)
23:17:50.215 ▶ start  [worker 0] should show the playground categories (run 1)
23:17:50.220 ▶ start  [worker 3] should take over the shared session as admin and hand it back to the customer (run 1)
23:17:51.057 ■ end    [worker 2] should show the home headline (run 1) → passed
23:17:51.597 ■ end    [worker 0] should show the playground categories (run 1) → passed
23:17:51.637 ■ end    [worker 1] should show the store entrance (run 1) → passed
23:17:56.750 ■ end    [worker 3] should take over the shared session as admin and hand it back to the customer (run 1) → passed
23:17:56.756 ▶ start  [worker 3] should show the customer name in the header (run 1)          ← only now
23:17:57.511 ■ end    [worker 3] should show the customer name in the header (run 1) → passed
23:17:57.515 ▶ start  [worker 3] should hide the admin shortcut for a customer (run 1)
23:17:58.193 ■ end    [worker 3] should hide the admin shortcut for a customer (run 1) → passed
23:17:58.197 ▶ start  [worker 3] should open the customer profile from the header (run 1)
23:17:59.733 ■ end    [worker 3] should open the customer profile from the header (run 1) → passed

  8 passed (12.3s)
```

What to notice:

- The three public tests ran **in parallel** with the writer on workers 0, 1 and 2. Locks did not
  slow them down at all.
- The first reader started at `56.756`, six milliseconds after the writer finished at `56.750`
  (the lock is released once the writer's teardown is done). The readers then ran one at a time:
  they share the lock with each other too.
- The safety cost nothing measurable: in CI the locked stress run and the broken run both take
  about 30 seconds (see section 10).

To stress it the way CI does (4 workers, every test twice, retries off so nothing can hide):

```bash
corepack pnpm demo:locks     # → 15 passed
```

## 7. Step 3 — The three ways to declare a lock

**On one test.** The most common form. Only this test takes the lock.

```ts
test('should rename the user', { lock: 'user-settings' }, async ({ page }) => { /* … */ });
```

**On a group.** Every test inside the `describe` takes the lock. This repo uses it because *every*
reader depends on the session file, and forgetting one test is exactly how races come back.

```ts
test.describe('Customer account', { tag: ['@e2e'], lock: 'shared-session' }, () => { /* … */ });
```

**Several locks at once.** The test starts only when **all** of them are free. Use it when a test
touches two independent shared things, for example a test account *and* a payment sandbox:

```ts
test('should reset the account and the sandbox', { lock: ['shared-session', 'payment-sandbox'] }, async () => { /* … */ });
```

A test with `lock: ['a', 'b']` blocks tests holding `a`, tests holding `b`, and tests holding both,
but not tests holding `c`.

## 8. Things that bite people

**Everyone must opt in.** A lock protects nothing on its own. It is an agreement between tests: a
test that touches the shared file *without* declaring `lock: 'shared-session'` is invisible to the
scheduler and will collide as before. That is why the group form is a good default for readers,
and why the public-page tests in this repo start logged out: a test that does not need the shared
thing should not touch it at all.

**File mode matters.** With the default `fullyParallel: false`, all tests in one file run in order on
one worker as a single unit, and a lock declared by *any* test in the file is held for the *whole*
file. This project sets `fullyParallel: true` in `playwright.config.ts`, so each test acquires and
releases the lock individually. If you add `test.describe.configure({ mode: 'serial' })` to a
locked file, the file becomes one unit again. A `beforeAll`/`afterAll` hook is in between: Playwright
then runs the file's tests in a few chunks, and the lock is held for a whole chunk.

**A lock is not an order.** Locks say "not at the same time", never "A before B". If test B needs
what test A produced, that is a dependency, and the answer is a `setup` project or a fixture, not a
lock.

**A lock lives inside one run.** It is a mutex inside a single `playwright test` process. Two shards
(`--shard=1/2` and `--shard=2/2`) are two processes on two machines: they do not see each other's
locks. The same is true for two CI jobs running at once. For those you need a resource per shard, an
idempotent operation, or an external lock service.

**Retries hide races.** With `retries: 2`, a test that failed because of a collision usually passes
on the retry and you never learn about it. Both demo commands in this repo run with `--retries=0` for
that reason. When you investigate flakiness, turn retries off first.

**Leave it as you found it.** The lock guarantees exclusive access, not cleanup. The writer in this
repo signs the customer back in and rewrites the file before it ends. If it crashed halfway, the
file would stay "admin" and every later reader would fail even with the lock. Restore shared state
at the end of the test **and** in an `afterEach`, which runs even when the test fails and still
inside the lock. The writer in this repo copies the file in `beforeEach` and writes it back in
`afterEach`. The `setup` project recreates it on the next run anyway.

## 9. When to use a lock (and when not to)

| Situation | Do this |
|---|---|
| Tests only read a shared thing | No lock needed. Reads do not conflict. |
| Each test could use its own copy (own user, own record, own file) | **Make it unique per test.** Better than any lock: fully parallel and no coordination. |
| One thing you cannot duplicate: a seeded account, a global setting, a third-party sandbox with one slot, a rate-limited API | **`lock`** on every test that touches it. |
| Several such things | `lock: ['a', 'b']` on the tests that touch both. |
| Shared across CI jobs or shards | A lock will not help. Partition the resource or coordinate outside Playwright. |
| Tests depend on each other's results | Redesign. Locks control access, not sequence. |

Ask in this order: can I remove the sharing? If not, can I make it read-only for most tests? Only
then, add the lock, and add it to *every* participant.

## 10. Step 4 — Run it in GitHub Actions

The repo ships three workflows (`.github/workflows/`):

| Workflow | Trigger | What it runs |
|---|---|---|
| `lint.yml` | push, PR | `pnpm lint` (ESLint + TypeScript) and a check that the generated agent config is up to date |
| `playwright-parallel.yml` | push, PR, manual | The normal suite: `@smoke` on PRs, everything on push to `main` |
| `playwright-locks.yml` | push, PR, manual | **This tutorial in CI**: one job without locks, one job with locks |

`playwright-locks.yml` has two jobs that run at the same time on separate runners:

```yaml
jobs:
  without-locks:
    name: Without locks (expected to fail)
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-playwright
      - name: Run the session specs WITHOUT locks (4 workers, no retries, repeat-each 3)
        id: race
        continue-on-error: true        # the failure is the lesson; the job stays green
        run: pnpm demo:race
      - name: Write the outcome to the job summary
        run: …                          # "Race reproduced" or "No collision this time"
      - run: pnpm exec playwright merge-reports --reporter html ./blob-report
      - uses: actions/upload-artifact@v4
        with: { name: playwright-report-without-locks, path: playwright-report/ }

  with-locks:
    name: With locks (must be green)
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-playwright
      - name: Run the whole suite WITH locks (4 workers, repeat-each 2, no retries)
        run: pnpm demo:locks            # a real failure here fails the workflow
      - run: pnpm exec playwright merge-reports --reporter html ./blob-report
      - uses: actions/upload-artifact@v4
        with: { name: playwright-report-with-locks, path: playwright-report/ }
```

Real run from this repo (pull request #1, run
[34789444329](https://github.com/JoanEsquivel/playwright-lock-demo/actions/runs/34789444329)):

| Job | Result | Playwright output |
|---|---|---|
| Without locks (expected to fail) | green job, red step | `5 failed, 8 passed (33.0s)` — three different symptoms: `Received: "Alex Admin"`, `Received: visible` (Admin link), `Received: "admin"` (profile role) |
| With locks (must be green) | green | `15 passed (30.0s)` |

The CI runner collided more often than a laptop does (5 of 9 readers instead of 1): slower
machines widen the window in which the writer holds the file.

How to read a run:

- **Without locks** is green as a job but its *step* is red. Open the job summary: it says whether
  the race was reproduced. Download `playwright-report-without-locks` to see the failing test with
  its screenshot and trace. The race is timing-dependent, so once in a while a run will not collide;
  re-run it.
- **With locks** must be green. If it ever goes red, either a lock is missing somewhere or the
  site itself was unreachable: check the failing test's trace before blaming the locks.

Things you need in your own repo:

1. Secrets `E2E_USERNAME`, `E2E_PASSWORD`, `E2E_ADMIN_USERNAME`, `E2E_ADMIN_PASSWORD`
   (`gh secret set E2E_USERNAME` and so on). Optional repository variable `BASE_URL`.
2. The composite action `.github/actions/setup-playwright` (pnpm, Node, dependencies, cached
   Chromium). Every workflow reuses it.
3. `reporter: [['blob'], ['github'], ['list']]` in CI (already in `playwright.config.ts`) so the
   report can be merged and uploaded. The race config drops the `github` reporter on purpose: its
   failures are expected and should not annotate your pull request.

Extra step for beginners: the workers count. `ubuntu-latest` runners have 4 cores, and Playwright's
default is half of them (2 workers). Both demo commands force `--workers=4` so the race is visible;
with 2 workers it would happen less often, which is precisely why such races go unnoticed for months.

## 11. How this project is organised

The framework follows the standards in [`AGENTS.md`](AGENTS.md) (also the contract for the
`qa-playwright-engineer` coding agent). The short version:

```
pages/                      Page objects: locators + load()/waitLoad() + actions. No assertions.
  login.ts                    account/login form
  home.ts                     home heading + the site header (user name, Admin link, Log out)
  profile.ts, admin-dashboard.ts, playground.ts, store.ts
utils/env.ts                The only place that reads process.env (typed getters)
utils/e2e.ts                Flows: login(), loginAsAdmin(), logout() — with one "bridge" expect each
fixtures/                   page objects, flows and the timeline as test fixtures; index.fixtures is the only spec import
data/accounts.json          Expected display names and roles (never credentials)
tests/setup/auth.setup.ts   Customer login → .auth/user.json (the shared resource)
tests/ui/playground.spec.ts Public pages, no lock
tests/e2e/session/          customer-account (readers) + admin-area (writer), both { lock: 'shared-session' }
tests/demo/race/            Same two specs without the lock; only playwright.race.config.ts runs them
playwright.config.ts        fullyParallel, projects setup → ui, e2e, blob reporter in CI
playwright.race.config.ts   The "watch it break" run: 4 workers, retries 0, repeatEach 3
.github/                    lint, playwright-parallel, playwright-locks + the setup-playwright action
```

Rules that matter for this tutorial:

- **Assertions live in specs.** Page objects only find and act. That is why the failure messages
  above name a locator ("Header user name link") — every locator carries a `.describe()`.
- **Locators were verified on the live page** with `playwright-cli` before being written down:
  `corepack pnpm exec playwright-cli open <url>` → `snapshot`.
- **Page-object URLs have no leading slash** (`'account/login'`), because `BASE_URL` includes the
  site's sub-path. `page.goto('/account/login')` would escape it. This is a documented exception to
  the kit's `url = '/route'` template.
- **`tests/demo/race` is a documented exception** to the "four test folders" rule: the copies exist
  so you can diff them against the real specs and see that the lock is the only change.

Useful commands:

```bash
corepack pnpm test                 # the real suite (with locks)
corepack pnpm demo:race            # the broken version, expected to fail
corepack pnpm demo:locks           # the fixed version under stress
corepack pnpm test:smoke           # what a PR runs
corepack pnpm lint                 # blocking quality gate
corepack pnpm report               # open the last HTML report
corepack pnpm exec playwright show-trace test-results/<folder>/trace.zip   # replay a failed test
```

## 12. References

- Playwright docs — [Test locks](https://playwright.dev/docs/test-parallel#test-locks) (section of *Parallelism*)
- Playwright docs — [Parallelism, workers and `fullyParallel`](https://playwright.dev/docs/test-parallel)
- Playwright docs — [Authentication and `storageState`](https://playwright.dev/docs/auth)
- [Playwright 1.63.0 release notes](https://github.com/microsoft/playwright/releases/tag/v1.63.0)
- [The Test Automation Website](https://github.com/JoanEsquivel/the-test-automation-website) — the app under test, including the backend-mode note about the shared seeded account
