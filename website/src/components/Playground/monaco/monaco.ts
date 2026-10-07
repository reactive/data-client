import type * as Monaco from 'monaco-editor';

import { installMonacoWorkers } from './workers';

/**
 * Loads Monaco's bundled ESM build in three stages, through the entry points
 * Monaco publishes: the editor core, every editor feature, then everything
 * else in `monaco-editor`. Evaluating it all at once is one long task that
 * blocks the page; yielding between stages lets the browser handle input and
 * paint in between. Resolves to the same namespace as `import 'monaco-editor'`.
 */
export async function loadMonaco(): Promise<typeof Monaco> {
  await import(/* webpackChunkName: 'monaco-core' */ 'monaco-editor/editor');
  // the core was the big download; the TS worker's now overlaps the rest
  installMonacoWorkers();
  await yieldToMain();
  await import(
    /* webpackChunkName: 'monaco-features' */ 'monaco-editor/features/register.all'
  );
  await yieldToMain();
  return import(/* webpackChunkName: 'monaco' */ 'monaco-editor');
}

function yieldToMain() {
  return new Promise(resolve => setTimeout(resolve));
}
