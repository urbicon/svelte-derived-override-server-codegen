import { flushSync } from 'svelte';
import { COMPILE_ENV, createFlat, createChained } from './scenario.svelte.ts';

export interface Row {
  context: string;
  compile: string;
  effectsRun: boolean | null;
  afterOverride: number; // read right after `d = 999` (999 = override visible)
  afterDepChange: number; // read after seed change (20/21 = discarded, 999 = survived)
  afterPlainReread: number; // second read with NO further change (999 = stable)
  evals: string;
}

/** Does an inner $effect inside $effect.root actually run here? (server build: no) */
function probeEffects(): boolean | null {
  try {
    let fired = false;
    const stop = $effect.root(() => {
      $effect(() => {
        fired = true;
      });
    });
    flushSync();
    stop();
    return fired;
  } catch {
    return null;
  }
}

function runFlat(context: string, wrap: (fn: () => Omit<Row, 'context' | 'compile' | 'effectsRun'>) => Omit<Row, 'context' | 'compile' | 'effectsRun'>): Row {
  const body = () => {
    const s = createFlat();
    void s.d; // initial read
    s.d = 999; // override
    const afterOverride = s.d;
    s.seed = 2; // dependency change
    const afterDepChange = s.d;
    const afterPlainReread = s.d;
    return { afterOverride, afterDepChange, afterPlainReread, evals: `flat:${s.evals}` };
  };
  return { context, compile: COMPILE_ENV, effectsRun: probeEffects(), ...wrap(body) };
}

function runChained(context: string, wrap: (fn: () => Omit<Row, 'context' | 'compile' | 'effectsRun'>) => Omit<Row, 'context' | 'compile' | 'effectsRun'>): Row {
  const body = () => {
    const s = createChained();
    void s.outer; // initial read (outer = inner + 1)
    s.inner = 999; // override the inner derived
    const afterOverride = s.outer; // 1000 = override visible through the chain
    s.seed = 2; // dependency change
    const afterDepChange = s.outer; // 21 = discarded, 1000 = survived
    const afterPlainReread = s.outer;
    return {
      afterOverride,
      afterDepChange,
      afterPlainReread,
      evals: `inner:${s.innerEvals} outer:${s.outerEvals}`
    };
  };
  return { context, compile: COMPILE_ENV, effectsRun: probeEffects(), ...wrap(body) };
}

const plain = (fn: () => Omit<Row, 'context' | 'compile' | 'effectsRun'>) => fn();

const owned = (fn: () => Omit<Row, 'context' | 'compile' | 'effectsRun'>) => {
  let result: Omit<Row, 'context' | 'compile' | 'effectsRun'> | undefined;
  const stop = $effect.root(() => {
    // flushSync between the steps so the effect graph settles like a real app
    result = (() => {
      const s = createFlat();
      void s.d;
      s.d = 999;
      flushSync();
      const afterOverride = s.d;
      s.seed = 2;
      flushSync();
      const afterDepChange = s.d;
      const afterPlainReread = s.d;
      return { afterOverride, afterDepChange, afterPlainReread, evals: `flat:${s.evals}` };
    })();
  });
  flushSync();
  stop();
  if (!result) {
    // server build: the effect-root body never runs — report, don't crash
    return { afterOverride: -1, afterDepChange: -1, afterPlainReread: -1, evals: 'n/a (effect root body never ran)' };
  }
  return result;
};

export function runMatrix(): Row[] {
  return [
    runFlat('unowned flat', plain),
    runChained('unowned chained', plain),
    runFlat('owned flat ($effect.root)', owned)
  ];
}
