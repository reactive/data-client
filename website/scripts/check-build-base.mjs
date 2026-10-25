#!/usr/bin/env node
// Fails when a page loads a static file from outside its own build's baseUrl
// (/next/, /es/, /next/es/). An installed app's offline worker only serves
// its own build, so a root path like <img src="/img/x.svg"> breaks offline
// there. In MDX, write useBaseUrl('/img/x.svg') or Markdown ![](/img/x.svg),
// which Docusaurus prefixes with the baseUrl.
//
//   node website/scripts/check-build-base.mjs
//     (CI) run after `yarn workspace rdc-website build`, with the same DOCS_NEXT
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, sep } from 'node:path';

const { DEFAULT_LOCALE, LOCALES } = createRequire(import.meta.url)(
  '../translate/locales.js',
);

const buildDir = 'website/build';
// as docusaurus.config.ts's isNext and buildBase
const nextRoot =
  existsSync('website/versionCurrent.json') && process.env.DOCS_NEXT === '1' ?
    '/next'
  : '';
const localeDirs = new Set(
  Object.keys(LOCALES).filter(locale => locale !== DEFAULT_LOCALE),
);
// Page links (no extension) may leave the build, e.g. the locale menu
const STATIC =
  /\.(?:avif|css|gif|ico|jpe?g|js|json|mp4|png|svg|ttf|webm|webmanifest|webp|woff2?)$/;
// Minified HTML leaves most attribute values unquoted
const URLS =
  /\b(?:src|href|poster)=["']?(\/[^/\s"'>][^\s"'>]*)|\bsrcset=(?:"([^"]*)"|'([^']*)'|([^\s>]+))|url\(\s*["']?(\/[^/\s"')][^\s"')]*)/g;

const problems = new Set();
for (const entry of readdirSync(buildDir, {
  recursive: true,
  withFileTypes: true,
})) {
  if (!entry.isFile() || !/\.(?:html|css)$/.test(entry.name)) continue;
  const file = join(entry.parentPath, entry.name);
  const top = relative(buildDir, file).split(sep)[0];
  const base = `${nextRoot}/${localeDirs.has(top) ? `${top}/` : ''}`;
  for (const [, url, quoted, single, bare, cssUrl] of readFileSync(
    file,
    'utf8',
  ).matchAll(URLS)) {
    const srcset = quoted ?? single ?? bare;
    const urls =
      srcset !== undefined ?
        srcset.split(',').map(candidate => candidate.trim().split(/\s/)[0])
      : [url ?? cssUrl];
    for (const path of urls) {
      if (
        path.startsWith('/') &&
        !path.startsWith(base) &&
        STATIC.test(path.split(/[?#]/)[0])
      )
        problems.add(`${relative(buildDir, file)}: ${path} (base ${base})`);
    }
  }
}

if (problems.size) {
  console.error(
    `::error::${problems.size} static files load from outside their build's baseUrl, so they break offline in that build's installed app.` +
      " Use useBaseUrl('/img/...') (or Markdown ![](/img/...)) instead of a root path.",
  );
  console.error([...problems].join('\n'));
  process.exit(1);
}
console.log("Every static file loads from its own build's baseUrl");
