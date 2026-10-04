/**
 * Side-effect module: import it from any component that renders Monaco.
 *
 * It runs once per page load, as soon as the importing chunk evaluates (before
 * any editor mounts), so Monaco's CDN files and our type libs download while
 * the page hydrates. Mobile and bots never render Monaco (see ../userAgent.ts),
 * so they skip all of these downloads.
 */
import { loader } from '@monaco-editor/react';

import { isMobileOrBot } from '../userAgent';
import { registerEditorOpener, registerImportCompletions } from './navigation';
import { MONACO_CDN_VS } from './preloadManifest';
import { injectMonacoResourceHints } from './resourceHints';
import { definePrismTheme } from './theme';
import { addTypeLibs, fetchTypeLibs } from './typeLibs';

if (typeof window !== 'undefined' && !isMobileOrBot()) {
  injectMonacoResourceHints();
  loader.config({
    paths: {
      vs: MONACO_CDN_VS,
    },
  });
  const monacoPromise = loader.init();

  // Fetch type libs in parallel with Monaco CDN bootstrap (no webpackPreload —
  // that raced high-priority against editor.main). Apply them only after init.
  const typeLibsPromise = fetchTypeLibs();

  monacoPromise.then(async monaco => {
    if (!monaco) return;
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

    addTypeLibs(monaco, await typeLibsPromise);
    monaco.typescript.typescriptDefaults.setEagerModelSync(true);
  });
}
