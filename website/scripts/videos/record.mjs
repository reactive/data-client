#!/usr/bin/env node
/** Records the docs/blog clips played by <AutoPlayVideo>
 *
 * Usage: yarn workspace rdc-website record-videos [clip...]
 * See README.md in this directory.
 */
import { build } from 'esbuild';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');
const outDir = join(here, '../../static/videos/blog');

/** name -> scene entry; each records to static/videos/blog/<name>.webm */
const CLIPS = {
  'batch-set-devtools': 'batch-set-devtools.tsx',
};

const size = { width: 1120, height: 630 };
const origin = 'http://clips.local';

const requested = process.argv.slice(2);
const unknown = requested.filter(name => !(name in CLIPS));
if (unknown.length) {
  console.error(
    `Unknown clip(s): ${unknown.join(', ')}\nAvailable: ${Object.keys(CLIPS).join(', ')}`,
  );
  process.exit(1);
}

async function record(name, entry) {
  const script = await bundle(join(here, entry));
  const context = await browser.newContext({
    viewport: size,
    deviceScaleFactor: 1,
    recordVideo: { dir: tmpdir(), size },
  });
  await context.route(`${origin}/**`, route =>
    route.request().url().endsWith('.js') ?
      route.fulfill({ contentType: 'text/javascript', body: script })
    : route.fulfill({ contentType: 'text/html', body: PAGE }),
  );
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error));
  await page.goto(`${origin}/`);
  await page.evaluate(() => window.clipDone);
  await context.close();
  if (errors.length) throw errors[0];

  const file = join(outDir, `${name}.webm`);
  await page.video().saveAs(file);
  await page.video().delete();
  console.log(`Recorded ${file}`);
}

async function bundle(entryPoint) {
  const result = await build({
    entryPoints: [entryPoint],
    bundle: true,
    write: false,
    format: 'esm',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"development"' },
    // use workspace sources, like jest does
    plugins: [
      {
        name: 'data-client-src',
        setup(build) {
          // workspace sources, like moduleNameMapper in jest.config.js
          build.onResolve({ filter: /^@data-client\// }, args => {
            const src = args.path.replace(/^@data-client\/([^/]+)/, '$1/src');
            return build.resolve(`./packages/${src}`, {
              kind: args.kind,
              resolveDir: root,
            });
          });
        },
      },
    ],
    logLevel: 'error',
  });
  return result.outputFiles[0].text;
}

const PAGE = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  html, body, #root { margin: 0; height: 100%; }
  body { background: #1b1b1d; color: #e3e3e3; font: 15px system-ui, sans-serif; }
  main { height: 100%; display: flex; flex-direction: column; padding: 16px; gap: 12px; }
  h1 { margin: 0; font-size: 20px; font-weight: 600; }
  h2 { margin: 0 0 6px; font-size: 18px; }
  code { font: 14px ui-monospace, monospace; color: #61dafb; }
  .columns { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  section { display: flex; flex-direction: column; min-height: 0; border: 1px solid #444; border-radius: 8px; overflow: hidden; }
  header { padding: 12px; background: #242526; }
  .prices { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 10px; font: 13px ui-monospace, monospace; }
  .price { display: flex; flex-direction: column; }
  .price span:first-child { color: #999; }
  .count { margin: 10px 0 0; font-size: 16px; }
  .count strong { font-size: 28px; color: #f5a623; font-variant-numeric: tabular-nums; }
  .monitor { flex: 1; min-height: 0; position: relative; }
  .monitor > * { position: absolute; inset: 0; }
</style>
</head>
<body><div id="root"></div><script type="module" src="/scene.js"></script></body>
</html>`;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
});
try {
  for (const name of requested.length ? requested : Object.keys(CLIPS)) {
    await record(name, CLIPS[name]);
  }
} finally {
  await browser.close();
}
