/**
 * Side-effect module: import it from any component that renders Monaco, and
 * render that editor only once `useMonacoReady()` is true.
 *
 * It runs once per page load, as soon as the importing chunk evaluates (before
 * any editor mounts), so Monaco, its TypeScript worker and our type libs
 * download while the page hydrates. Mobile and bots never render Monaco (see
 * ../userAgent.ts), so they skip all of these downloads.
 */
import { loader } from '@monaco-editor/react';
import { useEffect, useState } from 'react';

import { isMobileOrBot } from '../userAgent';
import { registerEditorOpener, registerImportCompletions } from './navigation';
import { definePrismTheme } from './theme';
import { addTypeLibs, fetchTypeLibs } from './typeLibs';
import { installMonacoWorkers } from './workers';

let monacoReady = false;
let monacoPromise: Promise<unknown> | undefined;

if (typeof window !== 'undefined' && !isMobileOrBot()) {
  // Both start downloading now, in parallel; type libs apply once Monaco is ready
  const typeLibsPromise = fetchTypeLibs();
  monacoPromise = import(/* webpackChunkName: 'monaco' */ './monaco').then(
    monaco => {
      installMonacoWorkers();
      // @monaco-editor/react uses this instance instead of its CDN loader
      loader.config({ monaco });
      monaco.typescript.typescriptDefaults.setCompilerOptions({
        allowNonTsExtensions: true,
        target: monaco.typescript.ScriptTarget.ES2017,
        jsx: monaco.typescript.JsxEmit.ReactJSX,
        strict: true,
        strictNullChecks: true,
        exactOptionalPropertyTypes: true,
        lib: ['dom', 'esnext'],
        module: monaco.typescript.ModuleKind.ESNext,
        moduleResolution: monaco.typescript.ModuleResolutionKind.NodeJs,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        skipDefaultLibCheck: true,
        noImplicitAny: false,
      });
      definePrismTheme(monaco);
      registerEditorOpener(monaco);
      registerImportCompletions(monaco);
      monacoReady = true;

      typeLibsPromise.then(libs => {
        addTypeLibs(monaco, libs);
        monaco.typescript.typescriptDefaults.setEagerModelSync(true);
      });
    },
  );
}

/**
 * Whether Monaco is loaded and configured. Until then render the loading
 * view: an editor mounted earlier would make @monaco-editor/react fetch its
 * own copy of Monaco from a CDN.
 */
export function useMonacoReady() {
  const [ready, setReady] = useState(monacoReady);
  useEffect(() => {
    if (!ready) monacoPromise?.then(() => setReady(true));
  }, [ready]);
  return ready;
}
