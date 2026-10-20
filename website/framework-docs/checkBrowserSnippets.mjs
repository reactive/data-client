/**
 * Runs the "run in page" snippets agents use to debug a Data Client app
 * (docs/core/_agents/devtools-debugging.md) in Chromium, each way its Browser
 * Tools section says a tool can run them, so a change to the snippets, those
 * instructions, or DevToolsManager's globals fails here instead of in an
 * agent's session. The ways' parameters and the `__DC_RESULT__` recipe are read
 * from the page, and every way the page lists needs a runner in `WAYS`.
 *
 * Also checks the `Runtime.evaluate` results the page tells agents to expect
 * (a bare function, a DOM node, a rejection, ...), as Cursor 3.25's desktop
 * agent reported them on #4428, and the console capture.
 *
 * The page is a small React app built from the workspace sources, with a Todo
 * resource whose `/todos` responses are mocked; `/src/resources/Todo.ts`
 * serves the app's own resource, as a Vite dev server would.
 *
 * Usage: node website/framework-docs/checkBrowserSnippets.mjs
 * Needs Playwright's Chromium (`npx playwright install chromium`), or set
 * CHROMIUM_PATH to an existing Chromium binary.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

import { docCodeBlocks } from './docsToMarkdown.mjs';
import { ROOT } from './site.mjs';
import { bundleBrowserApp } from '../scripts/workspaceSources.mjs';

const DEBUGGING = path.join(ROOT, 'docs/core/_agents/devtools-debugging.md');
const ORIGIN = 'http://app.test';
const TODOS = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  title: `Todo ${i + 1}`,
  completed: false,
}));

const BLOCKS = docCodeBlocks(DEBUGGING, 'react');
/** The page's snippets, in doc order */
const SNIPPETS = BLOCKS.filter(
  ({ lang, value }) => lang === 'js' && value.startsWith('// run in page'),
).map(({ value }) => ({
  name: value.match(/^\/\/ run in page(?: — (.*))?/)[1] ?? '',
  src: value,
}));

const SOURCE = fs.readFileSync(DEBUGGING, 'utf8');
/** A `### heading` section of the page's source */
function section(heading) {
  const text = SOURCE.split(`\n### ${heading}\n`)[1];
  assert.ok(text, `devtools-debugging.md has no "${heading}" section`);
  return text.split('\n#')[0];
}
/** The ways the Browser Tools section lists, by heading */
const WAY_HEADINGS = [
  ...SOURCE.split('\n## Browser Tools\n')[1]
    .split('\n## ')[0]
    .matchAll(/^### (.+)$/gm),
]
  .map(([, heading]) => heading)
  .filter(heading => heading !== 'Without a network or console tool');

const SLOT = '(<snippet>)()';
/** `(<snippet>)()` with the snippet in place */
const callSnippet = (template, src) =>
  template.replace(SLOT, () => `(${src}\n)()`);

/** The awaited expression's `Runtime.evaluate` parameters, as the page lists them */
const AWAITED = Object.fromEntries(
  [...section('Awaited expression').matchAll(/^- `(\w+)`: `([^`]+)`$/gm)].map(
    ([, key, value]) => [key, key === 'expression' ? value : JSON.parse(value)],
  ),
);
assert.equal(AWAITED.expression, SLOT, 'awaited expression');
// the results checkCdpResults verifies are still the ones the page describes
for (const term of ['exceptionDetails', '"function"', 'DOM node'])
  assert.ok(section('Awaited expression').includes(term), term);

assert.ok(section('Expression').includes(`\`${SLOT}\``), 'expression call');

/** The snippet in `list` containing `marker` */
function findSnippet(list, marker) {
  const snippet = list.find(({ src }) => src.includes(marker));
  assert.ok(snippet, `no snippet contains ${JSON.stringify(marker)}`);
  return snippet.src;
}

const RECIPE = findSnippet(
  BLOCKS.map(({ value }) => ({ src: value })),
  '__DC_RESULT__',
);
assert.ok(RECIPE.includes(SLOT), '__DC_RESULT__ recipe');

function bundleApp() {
  return bundleBrowserApp({
    stdin: {
      contents: `
import { DataProvider, useSuspense } from '@data-client/react';
import { Entity, resource } from '@data-client/rest';
import { Suspense } from 'react';
import { createRoot } from 'react-dom/client';

class Todo extends Entity {
  id = 0;
  title = '';
  completed = false;
  static key = 'Todo';
}
const TodoResource = resource({ path: '/todos/:id', schema: Todo });
// what /src/resources/Todo.ts exports
globalThis.__APP_MODULE__ = { Todo, TodoResource };

function TodoList() {
  const todos = useSuspense(TodoResource.getList);
  return todos.map(todo => <p key={todo.pk()}>{todo.title}</p>);
}
createRoot(document.getElementById('root')).render(
  <DataProvider>
    <Suspense fallback="loading"><TodoList /></Suspense>
  </DataProvider>,
);`,
      loader: 'tsx',
      resolveDir: path.join(ROOT, 'website'),
    },
  });
}

async function openApp() {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e));
  await page.route(`${ORIGIN}/**`, route => {
    const { pathname } = new URL(route.request().url());
    const js = body => route.fulfill({ contentType: 'text/javascript', body });
    if (pathname === '/')
      return route.fulfill({
        contentType: 'text/html',
        body: '<title>Snippets</title><div id="root"></div><script type="module" src="/app.js"></script>',
      });
    if (pathname === '/app.js') return js(app);
    if (pathname === '/src/resources/Todo.ts')
      return js(
        'export const { Todo, TodoResource } = globalThis.__APP_MODULE__;',
      );
    if (pathname === '/todos') return route.fulfill({ json: TODOS });
    const todo = TODOS.find(({ id }) => `/todos/${id}` === pathname);
    return todo ?
        route.fulfill({ json: todo })
      : route.fulfill({ status: 404, json: { message: 'Not found' } });
  });
  await page.goto(ORIGIN);
  await page.getByText('Todo 5').waitFor();
  return { page, cdp: await page.context().newCDPSession(page), pageErrors };
}

/** `evaluate_script` / `browser_evaluate`: call the function, await, serialize */
async function runFunction({ page }, src) {
  const fn = await page.evaluateHandle(`(\n${src}\n)`);
  const json = await page.evaluate(
    async fn => JSON.stringify((await fn()) ?? null),
    fn,
  );
  return JSON.parse(json);
}

/** CDP `Runtime.evaluate`; a throw or rejection is exceptionDetails */
async function cdpEvaluate({ cdp }, params) {
  const { result, exceptionDetails } = await cdp.send(
    'Runtime.evaluate',
    params,
  );
  if (exceptionDetails)
    throw new Error(
      exceptionDetails.exception?.description ?? exceptionDetails.text,
    );
  return result.value ?? null;
}

/** Awaited expression: the page's `Runtime.evaluate` parameters */
function runAwaitedExpression(target, src) {
  return cdpEvaluate(target, {
    ...AWAITED,
    expression: callSnippet(AWAITED.expression, src),
  });
}

/** Expression: no awaiting, so an async snippet starts, then `__DC_RESULT__` is read */
async function runExpression(target, src) {
  const evaluate = expression =>
    cdpEvaluate(target, { expression, returnByValue: true });
  if (!/^async /m.test(src)) return evaluate(callSnippet(SLOT, src));
  await evaluate(callSnippet(RECIPE, src));
  await target.page.waitForFunction(() => globalThis.__DC_RESULT__);
  const result = await evaluate('globalThis.__DC_RESULT__');
  if (result.error) throw new Error(result.error);
  return result.value ?? null;
}

const actionTypes = log => log.map(({ type }) => type);

/** What each snippet must return, by its comment (or a line of its source) */
const EXPECT = [
  [
    'run in page\n() => {\n  const NAME',
    result =>
      assert.equal(result.actionLog, 'built-in', JSON.stringify(result)),
  ],
  [
    'get denormalized response',
    result => assert.equal(result.data?.length, TODOS.length),
  ],
  [
    'check if an endpoint has an error',
    result => assert.equal(result.error, null),
  ],
  ['query a Queryable schema', result => assert.equal(result.title, 'Todo 5')],
  ['state overview', result => assert.ok(result.entityTypes.includes('Todo'))],
  [
    'inspect specific entity type',
    result => assert.equal(result.count, TODOS.length),
  ],
  [
    'find endpoint cache entries',
    result => assert.ok(result.some(({ key }) => key.includes('/todos'))),
  ],
  ["entities?.['Todo']?.['5']", result => assert.equal(result.title, 'Todo 5')],
  ['Object.keys(state.meta).find', result => assert.ok(result.key)],
  [
    'actions hold endpoints and promises',
    result => assert.ok(actionTypes(result).includes('rdc/setresponse')),
  ],
  [
    'track only fetches',
    result => assert.ok(actionTypes(result).includes('rdc/fetch')),
  ],
  [
    '.filter(a => a.error)',
    result => assert.deepEqual(result, { actions: [], meta: [] }),
  ],
  ['length = 0', result => assert.deepEqual(result, { cleared: true })],
  [
    'triggers refetch for subscribed',
    result => assert.deepEqual(result, { invalidated: true }),
  ],
  [
    'invalidateAll({',
    result => assert.equal(result, 'todo endpoints invalidated'),
  ],
  ['expireAll({', result => assert.equal(result, 'todo endpoints expired')],
  ['inject mock data', result => assert.deepEqual(result, { set: true })],
  ['resetEntireStore()', result => assert.deepEqual(result, { reset: true })],
  [
    '— requests\n',
    result => assert.ok(result.some(({ url }) => url.endsWith('/todos'))),
  ],
  ['— console capture', result => assert.equal(result.ok, true)],
];

/** The EXPECT check for a snippet; every snippet needs one */
function expectationFor(src) {
  const found = EXPECT.find(([marker]) => src.includes(marker));
  assert.ok(found, 'add an EXPECT entry for this snippet');
  return found[1];
}

/** Uncaught page errors, except the ones a check causes on purpose */
function assertNoPageErrors({ pageErrors }, label, allowed = []) {
  assert.deepEqual(
    pageErrors.filter(({ message }) => !allowed.includes(message)),
    [],
    `${label}: page errors`,
  );
}

async function checkSnippets(run, label) {
  const target = await openApp();
  for (const { name, src } of SNIPPETS) {
    try {
      const expect = expectationFor(src);
      const result = await run(target, src);
      expect(result);
      assert.ok(!result?.error, `returned an error: ${JSON.stringify(result)}`);
    } catch (e) {
      throw new Error(
        `${label}: snippet "${name || src.split('\n')[1]}": ${e.message}`,
        { cause: e },
      );
    }
  }
  // the snippets cleared the log, then invalidated and reset
  const log = await run(target, '() => __DC_ACTION_LOG__.map(a => a.type)');
  for (const type of [
    'rdc/invalidate',
    'rdc/invalidateall',
    'rdc/expireall',
    'rdc/reset',
  ])
    assert.ok(log.includes(type), `${label}: log is missing ${type}: ${log}`);
  assertNoPageErrors(target, label);
  await target.page.close();
}

/** Older versions have no `__DC_ACTIONS__`: the shim wraps dispatch instead */
async function checkShimFallback() {
  const target = await openApp();
  const shim = findSnippet(SNIPPETS, 'const NAME');
  await runFunction(target, '() => { delete globalThis.__DC_ACTIONS__; }');
  for (let i = 0; i < 2; i++)
    assert.equal((await runFunction(target, shim)).actionLog, 'shim');
  const log = await runFunction(
    target,
    `async () => {
      await __DC_CTRL__.invalidateAll({ testKey: key => key.includes('/todos') });
      return __DC_ACTION_LOG__.map(a => a.type);
    }`,
  );
  // rerunning the shim must not wrap dispatch twice
  assert.deepEqual(
    log.filter(type => type === 'rdc/invalidateall'),
    ['rdc/invalidateall'],
  );
  assertNoPageErrors(target, 'shim');
  await target.page.close();
}

/** The `Runtime.evaluate` results "Awaited expression" describes */
async function checkCdpResults() {
  const target = await openApp();
  const evaluate = (expression, params) =>
    target.cdp.send('Runtime.evaluate', { ...AWAITED, expression, ...params });
  const bare = await evaluate('() => 1');
  assert.equal(bare.result.type, 'function');
  assert.deepEqual(bare.result.value, {});
  const noAwait = await evaluate('(async () => 1)()', { awaitPromise: false });
  assert.deepEqual(noAwait.result.value, {});
  const node = await evaluate("(() => document.createElement('div'))()");
  assert.deepEqual(node.result.value, {});
  const thrown = await evaluate("(() => { throw new Error('thrown'); })()");
  assert.ok(thrown.exceptionDetails);
  const rejected = await evaluate(
    "(async () => { throw new Error('rejected'); })()",
  );
  assert.ok(rejected.exceptionDetails);
  assert.deepEqual(rejected.result.value, {});
  assertNoPageErrors(target, 'Runtime.evaluate');
  await target.page.close();
}

/** The console capture records console calls and uncaught errors */
async function checkConsoleCapture() {
  const target = await openApp();
  const capture = findSnippet(SNIPPETS, '__DC_CONSOLE__');
  assert.deepEqual(await runAwaitedExpression(target, capture), {
    ok: true,
    count: 0,
  });
  await runAwaitedExpression(
    target,
    `() => {
      console.log('logged', { a: 1 });
      console.error(new Error('errored'));
      setTimeout(() => { throw new Error('uncaught'); });
      Promise.reject(new Error('unhandled'));
    }`,
  );
  await target.page.waitForFunction(
    () => globalThis.__DC_CONSOLE__.length >= 4,
  );
  const { log, total } = await runAwaitedExpression(
    target,
    '() => ({ log: __DC_CONSOLE__.slice(-20), total: __DC_CONSOLE__.length })',
  );
  const has = (level, text) =>
    assert.ok(
      log.some(entry => entry.level === level && entry.text.includes(text)),
      `${level} "${text}" missing from ${JSON.stringify(log)}`,
    );
  has('log', 'logged {"a":1}');
  has('error', 'errored');
  has('uncaught', 'uncaught');
  has('unhandledrejection', 'unhandled');
  // rerunning keeps the log and doesn't wrap console twice
  assert.equal((await runAwaitedExpression(target, capture)).count, total);
  assertNoPageErrors(target, 'console capture', ['uncaught', 'unhandled']);
  await target.page.close();
}

/** A runner for each way the page lists, by its heading */
const WAYS = {
  Function: runFunction,
  'Awaited expression': runAwaitedExpression,
  Expression: runExpression,
};
assert.deepEqual(Object.keys(WAYS), WAY_HEADINGS, 'a runner for each way');

const [app, browser] = await Promise.all([
  bundleApp(),
  chromium.launch({ executablePath: process.env.CHROMIUM_PATH }),
]);
try {
  const checks = [
    ...Object.entries(WAYS).map(([way, run]) => [
      way,
      () => checkSnippets(run, way),
    ]),
    ['shim without __DC_ACTIONS__', checkShimFallback],
    ['Runtime.evaluate results', checkCdpResults],
    ['console capture', checkConsoleCapture],
  ];
  for (const [name, check] of checks) {
    await check();
    console.log(`✓ ${name}`);
  }
} finally {
  await browser.close();
}
