// Fixture asserting @data-client/rest's PathKeys/PathArgs/ShortenPath/PathArgsAndSearch/KeysToArgs
// match the frozen pre-#4173 implementation in orig.ts for a fixed-seed fuzzed corpus of paths.
import fs from 'node:fs';
const chars = [
  '/',
  '\\\\',
  '%',
  '&',
  '*',
  ':',
  '{',
  '}',
  ';',
  ',',
  '!',
  '@',
  '"',
  'a',
  'b',
  'id',
  'x',
  '-',
  '.',
  '?',
  '+',
  '(',
  ')',
  '#',
  ' ',
  '0',
];
// mulberry32: a fixed seed keeps the corpus (and its instantiation count) stable
let seed = 1;
const rnd = n => {
  let t = (seed = (seed + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) % n;
};
const fixed = [
  '',
  '/',
  ':',
  '*',
  '::',
  '**',
  ':*',
  '*:',
  '/a/:',
  '/a/*',
  '/a/:b',
  '/a/*b',
  '/a/:b/:c',
  '/a/:b{/:c}',
  '/a{/:b}/:c',
  '/org/:org0/repo/:repo/issues/:issue/comments/:comment{/:sub}/x/:y',
  '/files/*rest/:x{/*opt}',
  '/a\\\\:b/:c\\\\*d/:e',
  '/a/:"quoted"/:b;:c,:d!:e@:f%:g&:h',
  '/a/:b\\\\}c',
  '/:a/:b/:c/:d/:e/:f/:g/:h/:i/:j',
  '/a/:b@c/d',
  '/a/:b/c@d',
  ':a/b:c',
  '/a/:b{',
  '/a/:b}',
  '/a/{:b}',
  '/a/:b{/:c{/:d}}',
  '/a/*b{/*c}',
  '/x/:id.json',
  '/x/:id-:slug',
  '/x/:id?q=1',
  '/:a:b:c',
  '/a\\\\',
  '\\\\:',
  '\\\\:a',
  '/a/:"b"',
  '/a/:"b',
  '/a/*"b"',
  '/a/:b"c"',
  'http://x.com/:id',
  '/a/:b\\\\',
  '/:a\\\\*b',
];
const paths = [...fixed];
for (let i = 0; i < 1500; i++) {
  let s = '';
  const len = 1 + rnd(14);
  for (let j = 0; j < len; j++) s += chars[rnd(chars.length)];
  paths.push(s);
}
const orig = fs.readFileSync(new URL('./orig.ts', import.meta.url), 'utf8');
let out = `import type { PathKeys, PathArgs, ShortenPath, PathArgsAndSearch, KeysToArgs } from '@data-client/rest';\n${orig}
type Eq<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;\nfunction ok<T extends true>() {}\n`;
paths.forEach(p => {
  const l = "'" + p.replace(/'/g, "\\'") + "'";
  out += `ok<Eq<PathKeys<${l}>, OPathKeys<${l}>>>(); ok<Eq<PathArgs<${l}>, OPathArgs<${l}>>>(); ok<Eq<ShortenPath<${l}>, OShortenPath<${l}>>>(); ok<Eq<PathArgsAndSearch<${l}>, OPathArgsAndSearch<${l}>>>();\n`;
});
const ktas = [
  `'a'`,
  `'a}'`,
  `'*a'`,
  `'*a}'`,
  `'a' | '*a'`,
  `'a}' | '*a}'`,
  `'a' | 'a}'`,
  `'"a"' | 'a'`,
  `'"a"}' | '*"a"'`,
  `string`,
  `'a' | 'b}' | '*c' | '*d}' | '"e"' | '"f"}'`,
  `never`,
  `'' | '}'`,
  `'*' | '*}'`,
  `'"' | '""' | '"}'`,
  `\`\${string}}\``,
  `\`*\${string}\``,
];
// KTA: KeysToArgs identity on hand-picked key unions
ktas.forEach(k => {
  out += `ok<Eq<KeysToArgs<${k}>, OKeysToArgs<${k}>>>();\n`;
});
export default () => out;
