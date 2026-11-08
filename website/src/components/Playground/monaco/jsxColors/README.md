# JSX colors for Monaco

Monaco's TypeScript grammar has no JSX, so it shows tag names, attribute
names and JSX text as plain code. This add-on paints them as semantic tokens:

- at once, from a quick reading of the code that you pass in;
- then from TypeScript's own reading, in Monaco's TypeScript worker. It
  repaints only where the two differ.

Only `typescript` models with a `.tsx` path get JSX colors.

## Use

1. Load `worker.js` as text ahead of your worker script, and extend
   `self.withJsxSpans(TypeScriptWorker)` in `self.customTSWorkerFactory`:

   ```ts
   import jsxWorker from '!!raw-loader!./jsxColors/worker.js';
   import myWorker from '!!raw-loader!./myWorker.js';

   monaco.typescript.typescriptDefaults.setWorkerOptions({
     customWorkerPath: `data:text/javascript;charset=utf-8,${encodeURIComponent(jsxWorker + myWorker)}`,
   });
   ```

   ```js
   // myWorker.js
   self.customTSWorkerFactory = TypeScriptWorker =>
     class extends self.withJsxSpans(TypeScriptWorker) {};
   ```

2. Register the provider with a quick reader, which returns JSX spans
   (`spans.ts`). Here it is the playground's Prism reading:

   ```ts
   registerJsxColors(monaco, jsxSpans);
   ```

3. Turn on `'semanticHighlighting.enabled': true` in the editor options, and
   color the token types `jsxTag`, `jsxComponent` (a capitalized tag),
   `jsxAttribute` and `jsxText` in your theme's rules.

`hasJsxColors(model)` says whether a model shows its JSX colors yet, for
waiting until an editor is fully painted.
