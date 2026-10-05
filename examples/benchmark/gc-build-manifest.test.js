/**
 * Node GC sourceDigest includes repo babel.config.js.
 * Webpack's babel-loader uses rootMode: 'upward', so that file compiles the bundle.
 *
 *   node --test examples/benchmark/gc-build-manifest.test.js
 */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  computeSourceDigest,
  listRelevantSourcePaths,
} from './gc-build-manifest.js';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const babelPath = path.join(repoRoot, 'babel.config.js');

test('repo babel.config.js is a sourceDigest input', () => {
  assert.ok(listRelevantSourcePaths().includes('babel.config.js'));
});

test('a babel.config.js change changes sourceDigest and restores', () => {
  const original = readFileSync(babelPath);
  const before = computeSourceDigest();
  try {
    writeFileSync(babelPath, `${original.toString('utf8')}\n`);
    const after = computeSourceDigest();
    assert.notEqual(after, before);
  } finally {
    writeFileSync(babelPath, original);
  }
  assert.equal(computeSourceDigest(), before);
});
