import React, { memo } from 'react';

function MonacoPreloads() {
  return (
    <>
      {monacoPreloads.map((href, i) => (
        <link
          key={i}
          rel="preload"
          href={href}
          as={href.endsWith('.js') ? 'script' : 'style'}
        />
      ))}
      {workerPreloads.map((href, i) => (
        <link
          key={i + monacoPreloads.length}
          rel="prefetch"
          href={href}
          as="script"
        />
      ))}
    </>
  );
}
export default memo(MonacoPreloads);

const monacoPreloads = [
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/editor/editor.main.js',
  //'https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/editor/editor.main.css',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/editor/editor.main.nls.js',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/basic-languages/typescript/typescript.js',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/language/typescript/tsMode.js',
];
const workerPreloads = [
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/base/worker/workerMain.js',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/language/typescript/tsWorker.js',
];
