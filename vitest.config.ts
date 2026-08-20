import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte()],
  test: {
    projects: [
      {
        plugins: [svelte()],
        test: { name: 'node', environment: 'node', include: ['test/matrix.node.test.ts'] }
      },
      {
        plugins: [svelte()],
        test: { name: 'jsdom', environment: 'jsdom', include: ["test/matrix.jsdom.test.ts", "test/probe.jsdom.test.ts"] }
      },
      {
        plugins: [svelte()],
        resolve: { conditions: ['browser'] },
        test: {
          name: 'jsdom-browser',
          environment: 'jsdom',
          include: ['test/matrix.jsdom.test.ts', 'test/probe.jsdom.test.ts']
        }
      }
    ]
  }
});
