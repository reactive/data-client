import pkg from 'monaco-editor/package.json';
import React, { memo } from 'react';

import { MOBILE_OR_BOT_UA_REGEX } from './isMobileOrBot';

function MonacoPreloads() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: preloadScript }}
      type="application/javascript"
    />
  );
}
export default memo(MonacoPreloads);

export const MONACO_CDN_VS = `https://cdn.jsdelivr.net/npm/monaco-editor@${pkg.version}/min/vs`;

const monacoPreloads = [
  `${MONACO_CDN_VS}/editor/editor.main.js`,
  //`${MONACO_CDN_VS}/editor/editor.main.css`, if we load this early the css doesn't work right
  `${MONACO_CDN_VS}/loader.js`,
  `${MONACO_CDN_VS}/nls.messages-loader.js`,
  `${MONACO_CDN_VS}/basic-languages/monaco.contribution.js`,
  `${MONACO_CDN_VS}/editor.api-CalNCsUg.js`,
  `${MONACO_CDN_VS}/workers-DcJshg-q.js`,
];
const workerPreloads = [
  `${MONACO_CDN_VS}/typescript-DfOrAzoV.js`,
  `${MONACO_CDN_VS}/tsMode-CZz1Umrk.js`,
  `${MONACO_CDN_VS}/assets/ts.worker-CMbG-7ft.js`,
  `${MONACO_CDN_VS}/assets/editor.worker-Be8ye1pW.js`,
];

const preloadScript = `
if (!/${MOBILE_OR_BOT_UA_REGEX.source}/i.test(
  navigator.userAgent,
) && !window.monacoPreloaded) {
window.monacoPreloaded = true;
[${monacoPreloads.map(href => `'${href}'`).join(',')}].forEach(href => {
var link = document.createElement("link");
link.href = href;
link.rel = "preload";
link.as = href.endsWith('.js') ? 'script' : 'style';
document.head.appendChild(link);
});
[${workerPreloads.map(href => `'${href}'`).join(',')}].forEach(href => {
var link = document.createElement("link");
link.href = href;
link.rel = "prefetch";
link.as = 'script';
document.head.appendChild(link);
});
}
`;
