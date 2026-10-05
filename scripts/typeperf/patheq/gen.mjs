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
let seed = 1;
const rnd = n => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed % n;
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
let out = `import type { PathKeys, PathArgs, ShortenPath, PathArgsAndSearch, KeysToArgs } from '@data-client/rest';\n${orig}\n`;
out += `type Eq<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;\nfunction ok<T extends true>() {}\n`;
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
