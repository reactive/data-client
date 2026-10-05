/**
 * Type-checks the Vue code examples in the docs, as Vue pages and Vue skill
 * references render them (docsToMarkdown.mjs, framework 'vue').
 *
 * - Each playground with a `.vue` file is one app: its files import each other
 *   by title (`./Resource` is the block titled `Resource`).
 * - A `.vue` block outside a playground, or a ts block importing
 *   `@data-client/vue`, is checked on its own. Its relative imports resolve to
 *   the page's other titled blocks, or to stubs typed `any`.
 *
 * `@data-client/*` types come from the playground's editor types, which CI
 * keeps in sync with the packages. Add `nocheck` to a fence's meta to skip an
 * illustrative fragment; other files can still import it.
 *
 * Usage: node website/framework-docs/checkVueExamples.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import { docCodeBlocks } from './docsToMarkdown.mjs';
import { ROOT, rel } from './site.mjs';

const require = createRequire(import.meta.url);
const { DOCS_INSTANCES, FRAMEWORKS } = require('./docsInstances.js');
const { walk } = require('./index.js');

const PLAYGROUND = path.join(ROOT, 'website/src/components/Playground');
const EXT = { ts: '.ts', typescript: '.ts', tsx: '.tsx', html: '.vue' };
/**
 * The playground's design system: stand-ins for an app's own components, so
 * examples use them without importing them. Vue imports NumberFlow itself.
 */
const PLACEHOLDERS = [
  ...fs
    .readFileSync(path.join(PLAYGROUND, 'DesignSystem/index.ts'), 'utf8')
    .matchAll(/^export \{ (\w+) \}/gm),
].map(([, name]) => name);
/** `foo.react.md` and `foo.vue.md` render through `foo.md`, when it exists */
const OVERRIDE = new RegExp(`\\.(${FRAMEWORKS.join('|')})\\.mdx?$`);

const titleOf = block => block.meta?.match(/title="([^"]+)"/)?.[1];
const isVue = block => titleOf(block)?.endsWith('.vue');
const checked = block =>
  EXT[block.lang] && (block.lang !== 'html' || isVue(block));
/** File name a block is imported by: `Resource` -> `Resource.ts` */
const fileName = (block, i) => {
  const title = titleOf(block) ?? `untitled${i}`;
  return path.extname(title) ? title : title + EXT[block.lang];
};
/** Code that still exports its types to the example's other files, unchecked */
const noCheck = ({ raw }) =>
  raw.includes('<script') ?
    raw.replace(/<script\b[^>]*>/, '$&\n// @ts-nocheck')
  : `// @ts-nocheck\n${raw}`;
const importsOf = value =>
  [
    ...value.matchAll(
      /^\s*import\s+(?:type\s+)?([^'";]*?)\s+from\s+['"]([^'"]+)['"]/gm,
    ),
  ].map(([, clause, from]) => ({ clause, from }));
const isRelative = from => /^\.{1,2}\//.test(from);
/** Where a stub for a relative import goes */
const stubFile = target =>
  target.endsWith('.vue') ? target : `${target.replace(/\.ts$/, '')}.ts`;

/** Module typing every name its imports ask for as `any` */
function stub(clauses) {
  const names = clauses.flatMap(clause =>
    (clause.match(/\{([^}]*)\}/)?.[1] ?? '')
      .split(',')
      .map(spec =>
        spec
          .replace(/^\s*type\s+/, '')
          .split(/\s+as\s+/)[0]
          .trim(),
      )
      .filter(Boolean),
  );
  return [
    ...(clauses.some(clause => /^\s*[\w$]/.test(clause)) ?
      ['declare const _default: any;\nexport default _default;']
    : []),
    ...[...new Set(names)].map(
      name =>
        `declare const ${name}: any;\ntype ${name} = any;\nexport { ${name} };`,
    ),
  ].join('\n');
}

/** Whether an import's package is installed */
const installed = from =>
  from.startsWith('@data-client/') ||
  fs.existsSync(
    path.join(
      ROOT,
      'node_modules',
      ...from.split('/').slice(0, from.startsWith('@') ? 2 : 1),
    ),
  );

const docs = [...new Set(DOCS_INSTANCES.map(d => d.path))].flatMap(dir =>
  walk(path.join(ROOT, dir))
    // partials render inside their pages
    .filter(f => /\.mdx?$/.test(f) && !f.split('/').at(-1).startsWith('_'))
    .map(f => path.join(ROOT, dir, f))
    // framework-only pages (no base file) render on their own
    .filter(
      f =>
        !OVERRIDE.test(f) ||
        !['.md', '.mdx'].some(ext => fs.existsSync(f.replace(OVERRIDE, ext))),
    ),
);

/** Example apps: files to write, each mapped back to its fence */
const examples = [];
for (const doc of docs) {
  const blocks = docCodeBlocks(doc, 'vue')?.filter(checked);
  if (!blocks?.length) continue;
  const playgrounds = Map.groupBy(
    blocks.filter(b => b.playground),
    b => b.playground,
  );
  for (const group of playgrounds.values())
    if (group.some(isVue)) examples.push({ doc, blocks: group });
  // the page's titled blocks, for loose examples to import
  const titled = blocks.filter(b => !b.playground && titleOf(b));
  let before = 0;
  for (const block of blocks) {
    if (block === titled[before]) before++;
    if (block.playground || block.nocheck) continue;
    if (
      !isVue(block) &&
      !importsOf(block.value).some(({ from }) =>
        from.startsWith('@data-client/vue'),
      )
    )
      continue;
    // of blocks sharing a title, the closest one before this block wins
    const others = [
      ...titled.slice(0, before).reverse(),
      ...titled.slice(before),
    ].filter(b => b !== block);
    examples.push({ doc, blocks: [block, ...others], loose: true });
  }
}

// inside the repo, so examples resolve its node_modules
fs.mkdirSync(path.join(ROOT, 'node_modules/.cache'), { recursive: true });
const OUT = fs.mkdtempSync(
  path.join(ROOT, 'node_modules/.cache/vue-examples-'),
);
/** written file -> its fence */
const sources = new Map();
/** Imports with no types here: the app's own modules (`resources/Post`) and libraries we don't install */
const untyped = new Set();
examples.forEach(({ doc, blocks, loose }, n) => {
  const dir = path.join(OUT, rel(doc).replace(/\.mdx?$/, ''), String(n));
  const files = new Map();
  blocks.forEach((b, i) => {
    if (!files.has(fileName(b, i))) files.set(fileName(b, i), b);
  });
  // loose examples only bring the page's blocks they import
  const used = loose ? [fileName(blocks[0], 0)] : [...files.keys()];
  /** stub file -> import clauses */
  const stubs = new Map();
  for (let i = 0; i < used.length; i++) {
    const name = used[i];
    const block = files.get(name);
    const file = path.join(dir, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, block.nocheck ? noCheck(block) : block.raw);
    sources.set(file, block);
    for (const { clause, from } of importsOf(block.value)) {
      if (!isRelative(from)) {
        if (!installed(from)) untyped.add(from);
        continue;
      }
      if (!loose) continue;
      const target = path.join(path.dirname(name), from);
      const match = [...files.keys()].find(
        f => f === target || f.replace(/\.[^./]+$/, '') === target,
      );
      if (!match)
        stubs.set(stubFile(target), [
          ...(stubs.get(stubFile(target)) ?? []),
          clause,
        ]);
      else if (!used.includes(match)) used.push(match);
    }
  }
  for (const [target, clauses] of stubs) {
    const file = path.join(dir, target);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
      file,
      target.endsWith('.vue') ?
        '<script lang="ts">\nexport default {} as any;\n</script>\n'
      : stub(clauses),
    );
  }
});

fs.writeFileSync(
  path.join(OUT, 'components.d.ts'),
  `import type { DefineComponent } from 'vue';

declare module 'vue' {
  interface GlobalComponents {
${[...PLACEHOLDERS, 'RouterLink', 'RouterView'].map(name => `    ${name}: DefineComponent<any>;`).join('\n')}
  }
}
`,
);
fs.writeFileSync(
  path.join(OUT, 'untyped.d.ts'),
  [...untyped].map(from => `declare module '${from}';\n`).join(''),
);
fs.writeFileSync(
  path.join(OUT, 'tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      target: 'esnext',
      module: 'esnext',
      moduleResolution: 'bundler',
      // no esnext: Temporal needs its polyfill import
      lib: ['dom', 'es2024'],
      types: ['jest'],
      strict: true,
      // examples leave out types readers don't need
      noImplicitAny: false,
      noEmit: true,
      skipLibCheck: true,
      jsx: 'preserve',
      paths: {
        '@data-client/*': [`${PLAYGROUND}/editor-types/@data-client/*.d.ts`],
      },
    },
    vueCompilerOptions: { strictTemplates: true },
    include: ['**/*.ts', '**/*.tsx', '**/*.vue'],
  }),
);

let output = '';
try {
  execFileSync(
    process.execPath,
    [require.resolve('vue-tsc/bin/vue-tsc.js'), '-p', OUT, '--pretty', 'false'],
    { cwd: OUT, encoding: 'utf8', stdio: 'pipe' },
  );
} catch (error) {
  output = (error.stdout ?? '') + (error.stderr ?? error.message);
} finally {
  fs.rmSync(OUT, { recursive: true, force: true });
}
// one diagnostic per unindented line, with its indented details
const errors = new Set(
  output
    .split(/\n(?=\S)/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const match = line.match(/^(.+?)\((\d+),(\d+)\): (.*)$/s);
      if (!match) return line;
      const [, file, row, column, message] = match;
      const block = sources.get(path.resolve(OUT, file));
      if (!block)
        return `${rel(path.resolve(OUT, file))}:${row}:${column}: ${message}`;
      const where =
        block.line ?
          `${rel(block.file)}:${block.line + Number(row)}:${column}`
        : `${rel(block.file)} (${titleOf(block) ?? 'CodeBlock'}:${row}:${column})`;
      return `${where}: ${message}`;
    }),
);
if (errors.size) {
  console.error(
    `Vue examples in the docs don't type-check:\n  ${[...errors].join('\n  ')}\nSee "Vue examples" in website/framework-docs/README.md.`,
  );
  process.exit(1);
}
console.log(`${examples.length} Vue examples type-check.`);
