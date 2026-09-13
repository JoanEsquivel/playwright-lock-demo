import { mkdir, rm } from 'node:fs/promises';

await rm('demo-output', { recursive: true, force: true });
await mkdir('demo-output', { recursive: true });
console.log('Cleared demo-output/.');
