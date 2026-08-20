import { flushSync } from 'svelte';

export function probeDirect() {
  let firedInsideFlush = false;
  let firedAfterStop = false;
  const stop = $effect.root(() => {
    $effect(() => {
      firedInsideFlush = true;
    });
  });
  const beforeFlush = firedInsideFlush;
  flushSync();
  const afterFlush = firedInsideFlush;
  stop();
  firedAfterStop = firedInsideFlush;
  return { beforeFlush, afterFlush, firedAfterStop };
}
