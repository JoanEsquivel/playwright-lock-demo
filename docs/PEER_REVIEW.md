# Peer review guide

A checklist for presenting or reviewing this demo. Work through it with the
teaching guide, [`PLAYWRIGHT_SHARDING_AND_LOCK.md`](PLAYWRIGHT_SHARDING_AND_LOCK.md),
open beside you.

## Verify the claims

- [ ] `pnpm lint` passes on Playwright 1.63.
- [ ] `pnpm demo:locks` logs a `collision` for the unprotected pair and none
      for the protected pair.
- [ ] The two protected `acquired` timestamps are about 900 ms apart — writer B
      waited for writer A's hold to end.
- [ ] The protected tests ran on different workers and still did not overlap.
- [ ] Unrelated UI tests finished while the lock was held.
- [ ] `pnpm demo:cross-shard` reports exit codes `0, 1` — the same two tests
      that passed together now collide across processes.
- [ ] `pnpm test:shard:1` and `pnpm test:shard:2` collect complementary slices.
- [ ] The `setup` project runs before `ui` and `e2e`.
- [ ] Authenticated tests start logged in without replaying the login UI.

## Discussion prompts

1. Could this resource be made unique per test instead of locked?
2. Is the resource shared only inside one run, or across CI jobs too?
3. Would locking serialize enough tests to cancel out the benefit of sharding?
4. Is the lock protecting a real external resource, or hiding test coupling?
5. Should CI allocate one account or tenant per shard instead?

## Expected limitations

- Timing varies between runs; the demo asserts outcomes, never scheduling
  order.
- The site keeps its backend in `localStorage`, which is already isolated per
  browser context. The filesystem probe supplies the genuinely shared resource.
- `pnpm demo:cross-shard` is *supposed* to produce one failing child shard.
  That failure is the evidence that locks are runner-local.
- Generated auth state, reports, traces, and demo output are gitignored.
