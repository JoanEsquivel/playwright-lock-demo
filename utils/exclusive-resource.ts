import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import type { TestInfo } from '@playwright/test';
import { observe } from './observation.js';

const resourcesDirectory = path.resolve('demo-output/resources');

export async function useExclusiveResource(
  testInfo: TestInfo,
  resourceName: string,
  holdForMs = 900,
): Promise<boolean> {
  await mkdir(resourcesDirectory, { recursive: true });
  const resourcePath = path.join(resourcesDirectory, resourceName);
  let acquired = false;

  try {
    await mkdir(resourcePath);
    acquired = true;
    await observe(testInfo, 'acquired', resourceName);
    await new Promise((resolve) => setTimeout(resolve, holdForMs));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    await observe(testInfo, 'collision', resourceName);
  } finally {
    if (acquired) await rm(resourcePath, { recursive: true, force: true });
  }

  return acquired;
}
