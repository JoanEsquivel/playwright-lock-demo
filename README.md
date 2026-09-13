# Playwright Sharding + Test Locks Demo

An educational Playwright + TypeScript project showing how tests are divided
between workers and shards, how Playwright 1.63 **Test locks** serialize access
inside one run, why locks do not coordinate independent CI jobs, and how an
authentication setup project produces reusable `storageState`.

Application under test:
<https://joanesquivel.github.io/the-test-automation-website/>

## Install

```bash
corepack enable
corepack pnpm install
corepack pnpm exec playwright install chromium --with-deps
```

## Guided runs

```bash
pnpm test:serial        # one worker
pnpm test:parallel      # four worker processes
pnpm demo:locks         # compare collisions without locks vs serialization
pnpm test:shard:1       # shard 1 of 2 (run both shard commands concurrently)
pnpm test:shard:2       # shard 2 of 2
pnpm demo:cross-shard   # proves locks do not cross Playwright invocations
```

Copy `.env.example` to `.env` first. The hosted training site's public customer
credentials are documented on its login page; `.env` remains gitignored.

Every demo prints JSON records containing timestamp, PID, worker index,
parallel index, and shard. The same records are saved to
`demo-output/timeline.jsonl`.

Read [`docs/PLAYWRIGHT_SHARDING_AND_LOCK.md`](docs/PLAYWRIGHT_SHARDING_AND_LOCK.md)
before presenting the demo. Review notes are in
[`docs/PEER_REVIEW.md`](docs/PEER_REVIEW.md).

## Architecture

```text
docs/                 teaching guide and review checklist
pages/                semantic locators, load/waitLoad, actions only
fixtures/             the only test/expect import point for specs
.auth/                generated customer storageState (gitignored)
tests/setup/          authentication setup project
tests/ui/             independent UI and sharding examples
tests/e2e/            authenticated and locking examples
utils/                env, flows, JSON timeline, exclusive-resource probe
scripts/               cleanup and cross-shard demonstration
.cursor/ + .claude/   active rules, skills, and QA agent
AGENTS.md             active project contract
cursor-standards/     original copied kit for reference
```

## Standards compliance

This project was rebuilt from the copied `playwright-scaffold` skill after an
initial proof of concept did not activate or follow the kit. The rebuilt
version keeps runtime values in `.env`, puts navigation in page objects,
describes every locator, wires pages through fixtures, imports specs only from
`fixtures/index.fixtures`, tags tests, and gates completion with `pnpm lint`.

See the “Standards used in this project” section in the teaching guide for the
reasoning and trade-offs specific to the artificial timing/resource probes.
