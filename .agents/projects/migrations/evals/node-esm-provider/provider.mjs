// Vitest 2 resolved @data-client/react to its ESM build (the `module`
// condition) and let Node load it natively, so Node resolved that build's own
// imports. Run with `node --conditions=module` to do the same without Vitest.
import { DataProvider } from '@data-client/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

const html = renderToString(
  createElement(DataProvider, null, createElement('div', null, 'ok')),
);
if (!html.includes('>ok<')) {
  console.error(`DataProvider rendered ${html}`);
  process.exit(1);
}
console.log('DataProvider rendered ok');
