#!/usr/bin/env node
// Fails when the Playground Store inspector leaks out of its lazy chunk.
// ESLint keeps static imports of Playground/preview/ out of website/src, but
// can't see MDX, files outside website/src, or a splitChunks change. Any of
// those moves the Store modules out of PreviewWithScope, into an eager chunk
// or a copy per docs page chunk.
//
//   node website/scripts/check-lazy-chunks.mjs
//     (CI) run after `yarn workspace rdc-website build`
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// webpackChunkName in Playground/index.tsx
const CHUNK = 'PreviewWithScope.';
// store.module.css class name, as minified into the CSS module's JS mapping
// (\b so a `.breadcrumbList` class elsewhere doesn't match)
const MARKER = /\bcrumbList_/;

const jsDir = 'website/build/assets/js';
const found = readdirSync(jsDir).filter(
  file =>
    file.endsWith('.js') &&
    MARKER.test(readFileSync(join(jsDir, file), 'utf8')),
);

if (found.length === 1 && found[0].startsWith(CHUNK)) {
  console.log(`Store inspector only ships in ${found[0]}`);
} else {
  console.error(
    `::error::Store inspector (marker ${MARKER}) must ship only in the lazy ${CHUNK}*.js chunk, but was found in: ${found.join(', ') || 'no chunk'}.` +
      ' Something loaded eagerly now imports preview/store/ (or chunks-plugin.js changed), or the marker was renamed.',
  );
  process.exit(1);
}
