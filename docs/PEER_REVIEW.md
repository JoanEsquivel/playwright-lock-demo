# Peer review guide

Use this checklist when teaching or reviewing the proof of concept.

## Verify the claims

- [ ] `pnpm typecheck` passes on Playwright 1.63.
- [ ] `pnpm demo:locks` shows an unprotected collision and no protected collision.
- [ ] Protected tests do not overlap, regardless of which workers receive them.
- [ ] Unrelated tests continue while a named lock is held.
- [ ] `pnpm demo:cross-shard` demonstrates that independent runners do not share locks.
- [ ] `pnpm test:shard:1` and `pnpm test:shard:2` collect complementary tests.
- [ ] The auth setup runs before the Chromium project.
- [ ] Authenticated tests begin as Casey Customer without repeating the login UI.

## Discussion prompts

1. Could this resource be made unique per test instead of locked?
2. Is the protected resource shared only inside one run or across CI jobs?
3. Would locking reduce throughput enough to erase the benefit of sharding?
4. Is the lock protecting a real external resource, or masking test coupling?
5. Should CI allocate one account/tenant per shard instead?

## Expected limitations

- Timing output varies; scheduling order is intentionally not asserted.
- The hosted application uses localStorage as its backend, so its data is
  isolated by browser context. The filesystem probe supplies the genuinely
  shared resource for this demo.
- The cross-shard command may report one failing child shard; that failure is
  expected proof that Test locks are runner-local.
- Generated auth state, reports, traces, and demo output are gitignored.
