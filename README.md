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

Every demo prints JSON records containing timestamp, PID, worker index,
parallel index, and shard. The same records are saved to
`demo-output/timeline.jsonl`.

Read [`docs/PLAYWRIGHT_SHARDING_AND_LOCK.md`](docs/PLAYWRIGHT_SHARDING_AND_LOCK.md)
before presenting the demo. Review notes are in
[`docs/PEER_REVIEW.md`](docs/PEER_REVIEW.md).

## Architecture

```text
docs/                 teaching guide and review checklist
playwright/.auth/      generated customer storageState (gitignored)
tests/auth/            setup project and authenticated examples
tests/parallel/        safe, independent browser work
tests/locking/         protected and deliberately unprotected resources
tests/sharding/        evenly distributable examples
utils/                 JSON timeline and exclusive-resource probe
scripts/               cleanup and cross-shard demonstration
cursor-standards/      copied agent standards kit
```
