/**
 * Monaco's web workers. Each `new Worker(new URL(…))` becomes its own webpack
 * chunk. Once getWorker exists Monaco asks it for every worker, so each label
 * Monaco uses is listed.
 */
// webpack bundles a worker only when it sees `new Worker(new URL(...))` as one
// expression, so each case spells it out
function createWorker(label: string) {
  const options: WorkerOptions = { name: label, type: 'module' };
  switch (label) {
    case 'typescript':
    case 'javascript':
      return new Worker(
        new URL(
          'monaco-editor/languages/features/typescript/ts.worker',
          import.meta.url,
        ),
        options,
      );
    case 'json':
      return new Worker(
        new URL(
          'monaco-editor/languages/features/json/json.worker',
          import.meta.url,
        ),
        options,
      );
    case 'css':
    case 'scss':
    case 'less':
      return new Worker(
        new URL(
          'monaco-editor/languages/features/css/css.worker',
          import.meta.url,
        ),
        options,
      );
    case 'html':
    case 'handlebars':
    case 'razor':
      return new Worker(
        new URL(
          'monaco-editor/languages/features/html/html.worker',
          import.meta.url,
        ),
        options,
      );
    default:
      return new Worker(
        new URL('monaco-editor/editor/editor.worker', import.meta.url),
        options,
      );
  }
}

/**
 * Creates the TypeScript worker now and hands it to Monaco when the first
 * editor asks for it. Its download and parse are the longest step before
 * hovers and diagnostics work, so start them before editors mount.
 * (Starting it before the Monaco chunk arrives measured slower: the two
 * downloads compete for bandwidth and the editor appears later.)
 */
export function installMonacoWorkers() {
  let earlyTsWorker: Worker | undefined = createWorker('typescript');
  self.MonacoEnvironment = {
    getWorker(_moduleId, label) {
      if (label === 'typescript' && earlyTsWorker) {
        const worker = earlyTsWorker;
        earlyTsWorker = undefined;
        return worker;
      }
      return createWorker(label);
    },
  };
}
