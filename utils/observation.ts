import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { TestInfo } from '@playwright/test';

export type Observation = {
  event: 'start' | 'finish' | 'acquired' | 'collision';
  test: string;
  worker: number;
  parallelIndex: number;
  pid: number;
  shard: string;
  timestamp: string;
  resource?: string;
};

const outputDirectory = path.resolve('demo-output');

export async function observe(
  testInfo: TestInfo,
  event: Observation['event'],
  resource?: string,
): Promise<void> {
  await mkdir(outputDirectory, { recursive: true });
  const record: Observation = {
    event,
    test: testInfo.title,
    worker: testInfo.workerIndex,
    parallelIndex: testInfo.parallelIndex,
    pid: process.pid,
    shard: process.env.DEMO_SHARD ?? 'single-run',
    timestamp: new Date().toISOString(),
    resource,
  };

  console.log(`[demo] ${JSON.stringify(record)}`);
  await appendFile(
    path.join(outputDirectory, 'timeline.jsonl'),
    `${JSON.stringify(record)}\n`,
    'utf8',
  );
}

export async function observedDelay(
  testInfo: TestInfo,
  milliseconds = 700,
): Promise<void> {
  await observe(testInfo, 'start');
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
  await observe(testInfo, 'finish');
}
