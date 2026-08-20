// Which transform pipeline compiled this module (decides svelte codegen:
// vite-plugin-svelte emits server codegen under Vitest's SSR transform).
export const COMPILE_ENV = import.meta.env.SSR ? 'ssr-transform' : 'web-transform';

/** Flat form: one overridable derived over one $state seed. */
export function createFlat() {
  let evals = 0;
  let seed = $state(1);
  let d = $derived.by(() => {
    evals++;
    return seed * 10;
  });
  return {
    get d() {
      return d;
    },
    set d(v: number) {
      d = v;
    },
    set seed(v: number) {
      seed = v;
    },
    get evals() {
      return evals;
    }
  };
}

/** Chained form: the override target is read through a second derived. */
export function createChained() {
  let innerEvals = 0;
  let outerEvals = 0;
  let seed = $state(1);
  let inner = $derived.by(() => {
    innerEvals++;
    return seed * 10;
  });
  const outer = $derived.by(() => {
    outerEvals++;
    return inner + 1;
  });
  return {
    get outer() {
      return outer;
    },
    set inner(v: number) {
      inner = v;
    },
    set seed(v: number) {
      seed = v;
    },
    get innerEvals() {
      return innerEvals;
    },
    get outerEvals() {
      return outerEvals;
    }
  };
}
