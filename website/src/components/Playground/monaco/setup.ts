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
import { registerImportCompletions } from './navigation';
import { MONACO_CDN_VS } from './preloadManifest';
import { injectMonacoResourceHints } from './resourceHints';
import { shieldEditorsFromSearchHotkey } from './searchHotkey';
import { recheckSiblingsOnChange } from './siblingDiagnostics';
import { definePrismTheme } from './theme';
import typeCheckFlags from './typeCheckFlags.json';
import { addTypeLibs, fetchTypeLibs } from './typeLibs';

if (typeof window !== 'undefined' && !isMobileOrBot()) {
  injectMonacoResourceHints();
  shieldEditorsFromSearchHotkey();
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
      // shared with the docs example check; noImplicitAny is off since examples
      // leave out types readers don't need
      ...typeCheckFlags,
      lib: ['dom', 'esnext'],
      module: monaco.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.typescript.ModuleResolutionKind.NodeJs,
      allowSyntheticDefaultImports: true,
      skipDefaultLibCheck: true,
    });
    definePrismTheme(monaco);
    registerImportCompletions(monaco);
    recheckSiblingsOnChange(monaco);

    addTypeLibs(monaco, await typeLibsPromise);
    monaco.typescript.typescriptDefaults.setEagerModelSync(true);
  });
}
