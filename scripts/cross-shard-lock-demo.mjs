import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';

await rm('demo-output', { recursive: true, force: true });
await mkdir('demo-output', { recursive: true });

const runShard = (index) =>
  new Promise((resolve) => {
    const child = spawn(
      'pnpm',
      [
        'exec',
        'playwright',
        'test',
        'tests/e2e/locking/with-lock-*.spec.ts',
        '--project=e2e',
        '--no-deps',
        `--shard=${index}/2`,
        '--workers=1',
        '--reporter=line',
      ],
      {
        env: { ...process.env, DEMO_SHARD: `${index}/2` },
        stdio: 'inherit',
        shell: true,
      },
    );
    child.on('exit', (code) => resolve(code ?? 1));
  });

console.log('Launching two independent Playwright processes (simulated CI shards)…');
const results = await Promise.all([runShard(1), runShard(2)]);
console.log(`Shard exit codes: ${results.join(', ')}`);
console.log(
  'Expected lesson: named Test locks do not coordinate separate Playwright invocations. ' +
    'At least one shard may report a collision/failure. Use isolated resources or an external distributed lock in CI.',
);

// This is a teaching script: an observed collision is its expected output.
process.exitCode = 0;
