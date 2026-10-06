/**
 * Type-checks the code examples in the docs, as each framework's pages and
 * skill references render them (docsToMarkdown.mjs).
 *
 * - Each playground is one app (for Vue, each with a `.vue` file): its files
 *   import each other by title (`./Resource` is the block titled `Resource`).
 * - Other framework code (a React `tsx` block, a Vue SFC `html` block, or a ts
 *   block importing the framework's package) is checked on its own. Its
 *   relative imports resolve to the page's other titled blocks, or to stubs
 *   typed `any`.
 *
 * `@data-client/*` types come from the playground's editor types, which CI
 * keeps in sync with the packages. Add `nocheck` to a fence's meta to skip an
 * illustrative fragment; other files can still import it.
 *
 * Usage: node website/framework-docs/checkExamples.mjs [react|vue]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import { docCodeBlocks } from './docsToMarkdown.mjs';
import { ROOT, rel } from './site.mjs';

const require = createRequire(import.meta.url);
const { DOCS_INSTANCES } = require('./docsInstances.js');
const { walk, VUE_OVERRIDE } = require('./index.js');

const PLAYGROUND = path.join(ROOT, 'website/src/components/Playground');
const EXT = { ts: '.ts', typescript: '.ts', tsx: '.tsx', html: '.vue' };
/**
 * The playground's design system: stand-ins for an app's own components, so
 * examples use them without importing them. NumberFlow is a real library, so
 * examples import it.
 */
const PLACEHOLDERS = [
  ...fs
    .readFileSync(path.join(PLAYGROUND, 'DesignSystem/index.ts'), 'utf8')
    .matchAll(/^export \{ (\w+) \}/gm),
].map(([, name]) => name);

const titleOf = block => block.meta?.match(/title="([^"]+)"/)?.[1];
/** A single file component, titled or not */
const isVue = block =>
  block.lang === 'html' && /^<(script|template)\b/m.test(block.raw);

const FRAMEWORKS = {
  react: {
    name: 'React',
    /** Code only React renders */
    own: block => block.lang === 'tsx',
    // every React playground runs
    isApp: () => true,
    compiler: ['@typescript/native', 'bin/tsc'],
    jsx: 'react-jsx',
    // `render()` mounts a playground's app, which can reset its errors with ResetableErrorBoundary
    globals: `import type { FC, ReactNode } from 'react';

declare global {
  function render(app: ReactNode): void;
  const ResetableErrorBoundary: FC<{ children: ReactNode }>;
${PLACEHOLDERS.map(name => `  const ${name}: FC<any>;`).join('\n')}
}
`,
  },
  vue: {
    name: 'Vue',
    own: isVue,
    isApp: group => group.some(isVue),
    compiler: ['vue-tsc', 'bin/vue-tsc.js'],
    jsx: 'preserve',
    globals: `import type { DefineComponent } from 'vue';

declare module 'vue' {
  interface GlobalComponents {
${[...PLACEHOLDERS, 'RouterLink', 'RouterView'].map(name => `    ${name}: DefineComponent<any>;`).join('\n')}
  }
}
`,
  },
};

/** File name a block is imported by: `Resource` -> `Resource.ts` */
const fileName = (block, i) => {
  const title = titleOf(block) ?? `untitled${i}`;
  const ext = path.extname(title);
  // the fence's language decides: `useQuery.ts` in a tsx fence is `useQuery.tsx`
  return Object.values(EXT).includes(ext) ?
      title.slice(0, -ext.length) + EXT[block.lang]
    : title + EXT[block.lang];
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
/** `Map.groupBy` without it: website supports Node 18 */
const add = (map, key, value) => {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(value);
};
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
        `declare const ${name}: any;\ntype ${name}<A = any, B = any, C = any> = any;\nexport { ${name} };`,
    ),
  ].join('\n');
}

/** Hoisted for the website at a major the docs don't use (react-router 5) */
const WRONG_VERSION = ['react-router', 'react-router-dom'];
/** Whether an import has types here: its editor types, or its installed package */
const installed = from =>
  WRONG_VERSION.includes(from) ? false
  : from.startsWith('@data-client/') ?
    fs.existsSync(path.join(PLAYGROUND, 'editor-types', `${from}.d.ts`))
  : fs.existsSync(
      path.join(
        ROOT,
        'node_modules',
        ...from.split('/').slice(0, from.startsWith('@') ? 2 : 1),
      ),
    );

const docs = [...new Set(DOCS_INSTANCES.map(d => d.path))].flatMap(dir => [
  ...new Set(
    walk(path.join(ROOT, dir))
      // partials render inside their pages
      .filter(f => /\.mdx?$/.test(f) && !path.basename(f).startsWith('_'))
      // `foo.vue.md` renders as `foo.md`, which needn't exist (docCodeBlocks picks the override)
      .map(f => path.join(ROOT, dir, f.replace(VUE_OVERRIDE, '$1'))),
  ),
]);

/** Example apps of a framework's renderings: their blocks, by doc */
function examplesOf(framework) {
  const { own, isApp } = FRAMEWORKS[framework];
  const pkg = `@data-client/${framework}`;
  const checked = block =>
    block.lang === 'html' ? own(block) : Boolean(EXT[block.lang]);
  const examples = [];
  for (const doc of docs) {
    // only Vue renders a page that's just a `.vue.md` override
    if (framework !== 'vue' && !fs.existsSync(doc)) continue;
    const blocks = docCodeBlocks(doc, framework)?.filter(checked);
    if (!blocks?.length) continue;
    const playgrounds = new Map();
    for (const b of blocks) if (b.playground) add(playgrounds, b.playground, b);
    for (const group of playgrounds.values())
      if (isApp(group)) examples.push({ doc, blocks: group });
    // overview pages trim imports from snippets for readability; only their playgrounds must run
    if (path.basename(doc) === 'README.md') continue;
    // the page's titled blocks, for loose examples to import
    const titled = blocks.filter(b => !b.playground && titleOf(b));
    let before = 0;
    for (const block of blocks) {
      if (block === titled[before]) before++;
      if (block.playground || block.nocheck) continue;
      if (
        !own(block) &&
        !importsOf(block.value).some(({ from }) => from.startsWith(pkg))
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
  return examples;
}

/** Type errors in a framework's examples, located in their docs */
function check(framework, examples) {
  const { compiler, jsx, globals } = FRAMEWORKS[framework];
  // inside the repo, so examples resolve its node_modules
  fs.mkdirSync(path.join(ROOT, 'node_modules/.cache'), { recursive: true });
  const OUT = fs.mkdtempSync(
    path.join(ROOT, `node_modules/.cache/${framework}-examples-`),
  );
  /** written file -> its fence */
  const sources = new Map();
  /** Imports with no types here: the app's own modules (`resources/Post`) and libraries we don't install */
  const untyped = new Map();
  examples.forEach(({ doc, blocks, loose }, n) => {
    const dir = path.join(OUT, rel(doc).replace(/\.mdx?$/, ''), String(n));
    const files = new Map();
    blocks.forEach((b, i) => {
      const name = fileName(b, i);
      if (!files.has(name)) files.set(name, b);
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
          if (!installed(from)) add(untyped, from, clause);
          continue;
        }
        if (!loose) continue;
        const target = path.join(path.dirname(name), from);
        const match = [...files.keys()].find(
          f => f === target || f.replace(/\.[^./]+$/, '') === target,
        );
        if (!match) add(stubs, stubFile(target), clause);
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

  fs.writeFileSync(path.join(OUT, 'globals.d.ts'), globals);
  fs.writeFileSync(
    path.join(OUT, 'untyped.d.ts'),
    [...untyped]
      .map(([from, clauses]) =>
        // typed like a relative stub, so its imports work as types too
        clauses.some(clause => clause.includes('*')) ?
          `declare module '${from}';\n`
        : `declare module '${from}' {\n${stub(clauses).replace(/^declare /gm, '')}\n}\n`,
      )
      .join(''),
  );
  fs.writeFileSync(
    path.join(OUT, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'esnext',
        module: 'esnext',
        moduleResolution: 'bundler',
        // each example is its own module, even without imports
        moduleDetection: 'force',
        // no esnext: Temporal needs its polyfill import
        lib: ['dom', 'es2024'],
        types: ['jest'],
        strict: true,
        // examples leave out types readers don't need
        noImplicitAny: false,
        noEmit: true,
        skipLibCheck: true,
        jsx,
        paths: {
          '@data-client/*': [`${PLAYGROUND}/editor-types/@data-client/*.d.ts`],
        },
      },
      vueCompilerOptions: { strictTemplates: true },
      include: ['**/*.ts', '**/*.tsx', '**/*.vue'],
    }),
  );

  const [pkg, bin] = compiler;
  let output = '';
  try {
    execFileSync(
      process.execPath,
      [
        path.join(path.dirname(require.resolve(`${pkg}/package.json`)), bin),
        '-p',
        OUT,
        '--pretty',
        'false',
      ],
      { cwd: OUT, encoding: 'utf8', stdio: 'pipe' },
    );
  } catch (error) {
    // a crash can exit without diagnostics
    output = (error.stdout ?? '') + (error.stderr ?? '') || error.message;
  } finally {
    fs.rmSync(OUT, { recursive: true, force: true });
  }
  // one diagnostic per unindented line, with its indented details
  return new Set(
    output
      .split(/\n(?=\S)/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const match = line.match(/^(.+?)\((\d+),(\d+)\): (.*)$/s);
        if (!match) return line;
        const [, file, row, column, message] = match;
        const written = path.resolve(OUT, file);
        const block = sources.get(written);
        if (!block) return `${rel(written)}:${row}:${column}: ${message}`;
        const where =
          block.line ?
            `${rel(block.file)}:${block.line + Number(row)}:${column}`
          : `${rel(block.file)} (${titleOf(block) ?? 'CodeBlock'}:${row}:${column})`;
        return `${where}: ${message}`;
      }),
  );
}

const frameworks = process.argv.slice(2);
let failed = false;
for (const framework of frameworks.length ? frameworks : (
  Object.keys(FRAMEWORKS)
)) {
  if (!FRAMEWORKS[framework])
    throw new Error(`Unknown framework: ${framework}`);
  const { name } = FRAMEWORKS[framework];
  const examples = examplesOf(framework);
  const errors = check(framework, examples);
  if (errors.size) {
    failed = true;
    console.error(
      `${name} examples in the docs don't type-check:\n  ${[...errors].join('\n  ')}`,
    );
  } else console.log(`${examples.length} ${name} examples type-check.`);
}
if (failed) {
  console.error('See "Code examples" in website/framework-docs/README.md.');
  process.exit(1);
}
