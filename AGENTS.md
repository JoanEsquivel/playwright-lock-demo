# playwright-lock-demo — Agent Contract

Playwright test framework following the **Playwright standards kit**. The application under test is a **parameter** read from `.env`; never hard-code it.

## Parameters

| Env var | Meaning |
|---|---|
| `BASE_URL` | UI under test; page object `url`s are relative to it |
| `E2E_USERNAME` / `E2E_PASSWORD` | Customer seed account: `utils/e2e` `login()`, the setup project and the session-reader tests |
| `E2E_ADMIN_USERNAME` / `E2E_ADMIN_PASSWORD` | Admin seed account: `utils/e2e` `loginAsAdmin()`, used by the session-writer test |
| `BROWSERS` | Optional `chromium,firefox,webkit` → extra `ui-<b>` / `e2e-<b>` projects |
| `WORKERS` | Optional worker count (`1` = serial) |

Read them only through `utils/env` (`env.BASE_URL`, …). If a value is missing, ask once, then add it to `.env` and `.env.example`.

## Commands

```bash
pnpm install && pnpm exec playwright install chromium --with-deps
pnpm test            # setup → ui, e2e (session specs hold `lock: 'shared-session'`)
pnpm demo:race       # the same session specs WITHOUT locks: expected to fail (playwright.race.config.ts)
pnpm demo:locks      # full suite with locks, 4 workers, repeat-each 2, no retries
pnpm lint            # blocking gate
pnpm test:debug <spec> && pnpm exec playwright-cli attach <session>
pnpm exec playwright-cli open <url>       # live browser: snapshot, click, fill, eval, close
```

## Layout

```
pages/       Page objects: locators (.describe()), load(), waitLoad(), actions. No assertions.
utils/       e2e (multi-page flows, bridge guard) · env (typed env access)
fixtures/    page · e2e · api → index.fixtures (mergeTests + toMatchSchema); only spec import
tests/       setup/ · ui/ · e2e/ · demo/race/ (lock-free copies, only reachable through playwright.race.config.ts)
data/        *.json test data (never credentials)
.github/     workflows: lint, playwright-parallel, playwright-locks · actions/setup-playwright
```

## Non-negotiable rules

1. Assertions live in specs. `pages/**` and `api/**` never call `expect`. (lint)
2. Guards are not assertions: `waitFor()` inside `waitLoad()`, and one bridge `expect` inside a `utils/e2e` flow, wrapped in `test.step`.
3. Specs import `test`/`expect` only from `fixtures/index.fixtures`. (lint)
4. Locators: `getByRole`/`getByLabel` → `[data-test]`/`[data-testid]` → `getByText`; always `.describe()`. Never CSS classes or XPath.
5. Verify locators on the live page with `playwright-cli` before writing or changing them.
6. No `page.goto()` in specs; use `<page>.load()` + `waitLoad()`. (lint)
7. No credentials in code or data files; use `env.*`. (lint)
8. Isolated, deterministic tests: no `waitForTimeout`, no `if` in tests, web-first assertions, tags on every test. (lint)
9. Every page object gets a fixture entry; every client is wired in the api fixture. Orphans are removed on delete.
10. Done = `lint` clean and the targeted `playwright test` run green. Never weaken an assertion; file a bug report instead.

## Documented exceptions

- Page-object `url`s have **no leading slash** (`'account/login'`, `'./'`) because `BASE_URL` carries the GitHub Pages sub-path; a leading slash would escape it.
- `tests/demo/race/` sits outside the standard folders on purpose: it holds byte-identical copies of the session specs without `lock`, so the tutorial can show the failure. No project in `playwright.config.ts` points at it.
- The `timeline` auto fixture prints start/end lines per test; it is a teaching aid for the locks demo, not a reporting layer.

## Choosing a test style

| Situation | Style | Location |
|---|---|---|
| Single page behavior | UI | `tests/ui` |
| Multi-page journey | E2E | `tests/e2e` |
| Auth once per run | setup | `tests/setup` |

Tags: `@smoke` on every PR, `@regression` on full runs, `@ui`/`@api`/`@e2e` on the describe.

## Skills and agent

Skills in `.claude/skills/` (`playwright-architecture`, `playwright-create-test`, `playwright-fix-test`, `playwright-delete-test`, `playwright-ci`, `playwright-cli`). Agent: `qa-playwright-engineer` (`.claude/agents/qa-playwright-engineer.md`). Usage guide: `docs/agent-guide.md`.
