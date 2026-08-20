import { expect, it } from 'vitest';
import { runMatrix } from '../src/matrix.svelte.ts';

it('measures the override lifetime matrix (jsdom env)', () => {
  const rows = runMatrix();
  console.log(`\n=== MATRIX jsdom env ===\n${JSON.stringify(rows, null, 2)}`);
  expect(rows).toHaveLength(3);
});
