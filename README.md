# Overridable derived: override lifetime under server codegen

Measured 2026-08-20 · **svelte@5.56.10** · vitest 4.1.11 · @sveltejs/vite-plugin-svelte 7.3.0 · jsdom 30.0.1 · bun/node runner (node v25.2.1 via vitest).

## Sequence

One `$state` seed, one overridable `$derived.by` (`d = seed * 10`), in a plain
`.svelte.ts` module (universal code — the kind a shared store is made of):

```
read → override (d = 999) → read → seed = 2 → read → read
```

Documented lifetime ([docs]( https://svelte.dev/docs/svelte/$derived)):
"temporarily override … recalculated when their dependencies change" — i.e. the
last two reads should yield **20**.

## Result matrix

| vitest project | transform → codegen | `svelte` entry resolved | effects run? | after override | after dep change | eval count |
| --- | --- | --- | --- | --- | --- | --- |
| `node` (env node) | **ssr → server** | server | no (`$effect.root` body never runs) | 999 | **999 — override survives forever** | flat: 1 (never re-evaluated after override) |
| `node`, chained | ssr → server | server | no | 1000 | **1000** | inner: 1, outer: 4 (outer re-evals per read, inner never again) |
| `jsdom` (default, no browser condition) | web → client | **server** (mixed!) | no (`flushSync` is the server no-op) | 999 | 20 (documented) | flat: 2 |
| `jsdom-browser` (`resolve.conditions: ['browser']`) | web → client | client | yes | 999 | 20 (documented) | flat: 2 |
| `jsdom-browser`, owned (`$effect.root`) | web → client | client | yes | 999 | 20 (documented) | flat: 2 |

## Findings

1. **Under server codegen the documented override lifetime does not exist.**
   The derived is evaluated once; after `d = 999` it is never evaluated again,
   so the override survives every dependency change, forever — flat and through
   a chained derived alike.
2. **Client codegen honours the documented lifetime in every context we
   measured** — owned and unowned, flat and chained (unowned per-read
   re-evaluation, the known #15934/#15414 behaviour, does not break it).
3. **A third, mixed state exists and is vitest's jsdom default**: client
   codegen (web transform) + the *server* top-level `svelte` entry (no
   `browser` resolve condition) — override semantics are client-like, but
   `flushSync` is a silent no-op and `$effect.root` effects never fire.
4. Consequence for real apps: a shared `.svelte.ts` store that runs during SSR
   has a *different* override semantics on the server than on the client, and
   nothing in the docs mentions it. In test setups, which of the two worlds you
   are measuring depends on the environment/conditions — which is exactly how
   this was first noticed (the same sequence yielding contradictory results in
   two test files of one repo).

## Run it

```sh
bun install   # or npm/pnpm
bunx vitest run --disable-console-intercept
```

`src/scenario.svelte.ts` is the ~20-line core; `src/matrix.svelte.ts` runs the
sequence in the three contexts; the two/three vitest projects provide the
environment matrix. A REPL cannot show this: the playground always runs mounted
client code (owned, client codegen), which is precisely the one world where the
behaviour matches the docs.
