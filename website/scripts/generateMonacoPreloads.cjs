'use strict';

/* eslint-disable no-undef */

/**
 * Generates Monaco CDN preload/prefetch path lists from the installed
 * monaco-editor package so content-hashed filenames stay in sync.
 *
 * Invoked from docusaurus.config.ts (Node). Browser code must import only
 * the generated manifest — never this module.
 */

const fs = require('fs');
const path = require('path');

const WEBSITE_ROOT = path.join(__dirname, '..');
const MONACO_ROOT = path.dirname(
  require.resolve('monaco-editor/package.json', { paths: [WEBSITE_ROOT] }),
);
const VS_ROOT = path.join(MONACO_ROOT, 'min', 'vs');
const MANIFEST_PATH = path.join(
  WEBSITE_ROOT,
  'src/components/Playground/monacoPreloadManifest.ts',
);

/** @returns {{ monacoVersion: string, preloadPaths: string[], prefetchPaths: string[] }} */
function computeMonacoPreloadManifest() {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(MONACO_ROOT, 'package.json'), 'utf8'),
  );
  const monacoVersion = pkg.version;
  if (!fs.existsSync(VS_ROOT)) {
    throw new Error(`monaco-editor min/vs missing at ${VS_ROOT}`);
  }

  const mainPath = path.join(VS_ROOT, 'editor/editor.main.js');
  const mainSource = fs.readFileSync(mainPath, 'utf8');
  const defineMatch = mainSource.match(
    /define\(\s*["']vs\/editor\/editor\.main["']\s*,\s*\[([^\]]+)\]/,
  );
  if (!defineMatch) {
    throw new Error(
      'Failed to parse AMD dependency array from editor/editor.main.js — Monaco packaging may have changed',
    );
  }

  /** @type {string[]} */
  const amdDeps = [];
  const depLiteral = /["']([^"']+)["']/g;
  let depMatch;
  while ((depMatch = depLiteral.exec(defineMatch[1]))) {
    amdDeps.push(depMatch[1]);
  }
  if (amdDeps.length < 5) {
    throw new Error(
      `Suspiciously few AMD deps parsed from editor.main (${amdDeps.length}): ${amdDeps.join(', ')}`,
    );
  }

  /** @type {string[]} */
  const preloadPaths = ['loader.js', 'editor/editor.main.js'];

  for (const dep of amdDeps) {
    if (dep === 'exports' || dep === 'require') continue;
    if (dep.endsWith('.css')) {
      throw new Error(
        `Refusing to preload CSS dependency from editor.main: ${dep}`,
      );
    }
    if (
      dep === 'vs/nls.messages-loader!' ||
      dep.startsWith('vs/nls.messages-loader')
    ) {
      preloadPaths.push('nls.messages-loader.js');
      continue;
    }
    if (dep.startsWith('../')) {
      const relative = `${dep.slice(3)}.js`.replace(/\.js\.js$/, '.js');
      preloadPaths.push(relative);
      continue;
    }
    throw new Error(`Unrecognized editor.main AMD dependency: ${dep}`);
  }

  const prefetchPaths = [
    ...exactGlob(VS_ROOT, /^typescript-.+\.js$/),
    ...exactGlob(VS_ROOT, /^tsMode-.+\.js$/),
    ...exactGlob(
      path.join(VS_ROOT, 'assets'),
      /^(?:ts|editor)\.worker-.+\.js$/,
    ).map(name => `assets/${name}`),
  ];

  const normalizedPreload = [...new Set(preloadPaths)];
  const normalizedPrefetch = uniqueSorted(prefetchPaths);

  validatePathsExist(normalizedPreload, 'preload');
  validatePathsExist(normalizedPrefetch, 'prefetch');

  const contributions = normalizedPreload.filter(p =>
    p.startsWith('monaco.contribution-'),
  );
  if (contributions.length < 1) {
    throw new Error(
      'Expected at least one monaco.contribution-* preload path from editor.main deps',
    );
  }
  if (normalizedPrefetch.length < 2) {
    throw new Error(
      'Expected typescript/tsMode and worker prefetch paths; found none/too few',
    );
  }

  return {
    monacoVersion,
    preloadPaths: normalizedPreload,
    prefetchPaths: normalizedPrefetch,
  };
}

/** @param {string} dir @param {RegExp} pattern */
function exactGlob(dir, pattern) {
  if (!fs.existsSync(dir)) return [];
  const matches = fs.readdirSync(dir).filter(name => pattern.test(name));
  if (matches.length === 0) {
    throw new Error(
      `No files matching ${pattern} under ${path.relative(WEBSITE_ROOT, dir)}`,
    );
  }
  return matches.sort();
}

/** @param {string[]} paths */
function uniqueSorted(paths) {
  return [...new Set(paths)].sort();
}

/** @param {string[]} paths @param {string} label */
function validatePathsExist(paths, label) {
  for (const relative of paths) {
    if (relative.endsWith('.css')) {
      throw new Error(`Refusing to include CSS in ${label}: ${relative}`);
    }
    const absolute = path.join(VS_ROOT, relative);
    if (!fs.existsSync(absolute)) {
      throw new Error(`Monaco ${label} path missing: ${relative}`);
    }
  }
}

/** @returns {{ monacoVersion: string, preloadPaths: string[], prefetchPaths: string[], wrote: boolean }} */
function ensureMonacoPreloadManifest() {
  const manifest = computeMonacoPreloadManifest();
  const source = formatManifestSource(manifest);
  const previous =
    fs.existsSync(MANIFEST_PATH) ?
      fs.readFileSync(MANIFEST_PATH, 'utf8')
    : null;
  if (previous === source) {
    return { ...manifest, wrote: false };
  }
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, source);
  return { ...manifest, wrote: true };
}

/** @param {{ monacoVersion: string, preloadPaths: string[], prefetchPaths: string[] }} manifest */
function formatManifestSource(manifest) {
  const preload = manifest.preloadPaths.map(p => `    '${p}',`).join('\n');
  const prefetch = manifest.prefetchPaths.map(p => `    '${p}',`).join('\n');
  return `/* eslint-disable */
// Generated by website/scripts/generateMonacoPreloads.cjs — do not edit.
// Re-run via docusaurus.config.ts (ensureMonacoPreloadManifest) or:
//   node website/scripts/generateMonacoPreloads.cjs

export const monacoPreloadManifest = {
  preloadPaths: [
${preload}
  ],
  prefetchPaths: [
${prefetch}
  ],
} as const;

export const MONACO_CDN_VS =
  'https://cdn.jsdelivr.net/npm/monaco-editor@${manifest.monacoVersion}/min/vs';
`;
}

module.exports = {
  ensureMonacoPreloadManifest,
};

if (require.main === module) {
  const result = ensureMonacoPreloadManifest();
  const action = result.wrote ? 'Wrote' : 'Unchanged';
  console.log(
    `${action} Monaco preload manifest for v${result.monacoVersion} (${result.preloadPaths.length} preload, ${result.prefetchPaths.length} prefetch)`,
  );
}
