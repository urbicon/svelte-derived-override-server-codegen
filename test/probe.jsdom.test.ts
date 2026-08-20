import { flushSync } from 'svelte';
import { expect, it } from 'vitest';
import { probeDirect } from '../src/probe.svelte.ts';

it('effect probe sanity (jsdom)', () => {
  const result = probeDirect();
  console.log('probe result:', JSON.stringify(result));
  expect(result).toBeDefined();
  void flushSync;
});
