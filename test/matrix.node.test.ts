import { expect, it } from 'vitest';
import { runMatrix } from '../src/matrix.svelte.ts';

it('measures the override lifetime matrix (node env)', () => {
  const rows = runMatrix();
  console.log(`\n=== MATRIX node env ===\n${JSON.stringify(rows, null, 2)}`);
  expect(rows).toHaveLength(3);
});
