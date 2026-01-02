import pkg from 'monaco-editor/package.json';
import React, { memo } from 'react';

function MonacoPreloads() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: preloadScript }}
        type="application/javascript"
      />
    </>
  );
}
export default memo(MonacoPreloads);

export const MONACO_VERSION = pkg.version ?? '0.46.0';

const monacoPreloads = [
  `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs/editor/editor.main.js`,
  //`https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs/editor/editor.main.css`, if we load this early the css doesn't work right
  `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs/loader.js`,
  `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs/nls.messages-loader.js`,
  `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs/basic-languages/monaco.contribution.js`,
  `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs/editor.api-CalNCsUg.js`,
  `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs/workers-DcJshg-q.js`,
];
const workerPreloads = [
  `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs/typescript-DfOrAzoV.js`,
  `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs/tsMode-CZz1Umrk.js`,
  `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs/assets/ts.worker-CMbG-7ft.js`,
  `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs/assets/editor.worker-Be8ye1pW.js`,
];

const preloadScript = `
if (!/bot|googlebot|crawler|spider|robot|crawling|Mobile|Android|BlackBerry/i.test(
  navigator.userAgent,
) && !window.monacoPreloaded) {
[${monacoPreloads.map(href => `'${href}'`).join(',')}].forEach(href => {
window.monacoPreloaded = true;
var link = document.createElement("link");
link.href = href;
link.rel = "preload";
link.as = href.endsWith('.js') ? 'script' : 'style';
document.head.appendChild(link);
});
[${workerPreloads.map(href => `'${href}'`).join(',')}].forEach(href => {
window.monacoPreloaded = true;
var link = document.createElement("link");
link.href = href;
link.rel = "prefetch";
link.as = 'script';
document.head.appendChild(link);
});
}
`;
