/**
 * Runs the "run in page" snippets agents use to debug a Data Client app
 * (docs/core/_agents/devtools-debugging.md and browser-*.md) in Chromium, the
 * ways each browser tool runs them, so a change to the snippets, the docs, or
 * DevToolsManager's globals fails here instead of in an agent's session.
 *
 * - Function: Chrome DevTools MCP's `evaluate_script` and Playwright MCP's
 *   `browser_evaluate` take the snippet as a function, call it and await it.
 * - Expression: Cursor's desktop `browser_cdp` (and a cloud agent without
 *   Playwright MCP) sends CDP `Runtime.evaluate` with `(<snippet>)()`,
 *   `awaitPromise` and `returnByValue`, as browser-cursor.md says.
 * - Claude in Chrome's `javascript_tool` returns the last expression, so async
 *   snippets go through the `__DC_RESULT__` recipe in browser-claude-in-chrome.md.
 *
 * Also checks the `Runtime.evaluate` results browser-cursor.md tells agents to
 * expect (a bare function, a DOM node, a rejection, ...), as reported by
 * Cursor 3.25's desktop agent on #4428, and the `__DC_CONSOLE__` capture
 * agents use where the tool can't read the console.
 *
 * The page is a small React app built from the workspace sources, with a Todo
 * resource whose `/todos` responses are mocked; `/src/resources/Todo.ts`
 * serves the app's own resource, as a Vite dev server would.
 *
 * Usage: node website/framework-docs/checkBrowserSnippets.mjs
 * Needs Playwright's Chromium (`npx playwright install chromium`), or set
 * CHROMIUM_PATH to an existing Chromium binary.
 */
import * as esbuild from 'esbuild';
import assert from 'node:assert/strict';
import path from 'node:path';
import { chromium } from 'playwright';

import { docCodeBlocks } from './docsToMarkdown.mjs';
import { ROOT } from './site.mjs';
import { workspaceSources } from '../scripts/workspaceSources.mjs';

const AGENTS = path.join(ROOT, 'docs/core/_agents');
const ORIGIN = 'http://app.test';
const TODOS = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  title: `Todo ${i + 1}`,
  completed: false,
}));

/** The page's snippets, in doc order */
function snippets(file) {
  return docCodeBlocks(path.join(AGENTS, file), 'react')
    .filter(
      ({ lang, value }) => lang === 'js' && value.startsWith('// run in page'),
    )
    .map(({ value }) => ({
      name: value.match(/^\/\/ run in page(?: — (.*))?/)[1] ?? '',
      src: value,
    }));
}

/** The page's snippet containing `marker` */
function findSnippet(file, marker) {
  const snippet = snippets(file).find(({ src }) => src.includes(marker));
  assert.ok(
    snippet,
    `no snippet in ${file} contains ${JSON.stringify(marker)}`,
  );
  return snippet.src;
}

async function bundleApp() {
  const { outputFiles } = await esbuild.build({
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
    bundle: true,
    write: false,
    format: 'esm',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [workspaceSources],
    logLevel: 'error',
  });
  return outputFiles[0].text;
}

async function openApp(browser, app) {
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

/** CDP `Runtime.evaluate`, as browser-cursor.md tells the agent to send it */
function cdpEvaluate({ cdp }, expression, options = {}) {
  return cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    ...options,
  });
}

/** `browser_cdp`: `(<snippet>)()`; a throw or rejection is exceptionDetails */
async function runExpression(app, src) {
  const { result, exceptionDetails } = await cdpEvaluate(app, `(${src}\n)()`);
  if (exceptionDetails)
    throw new Error(
      exceptionDetails.exception?.description ?? exceptionDetails.text,
    );
  return result.value ?? null;
}

const RECIPE_SLOT = '(async () => { ... })()';
const RECIPE = docCodeBlocks(
  path.join(AGENTS, 'browser-claude-in-chrome.md'),
  'react',
).find(({ value }) => value.includes('__DC_RESULT__'))?.value;
assert.ok(
  RECIPE?.includes(RECIPE_SLOT),
  'Claude in Chrome __DC_RESULT__ recipe',
);

/** Claude in Chrome: an async snippet starts, then `__DC_RESULT__` is read */
async function runClaudeInChrome(app, src) {
  if (!/^async /m.test(src)) return runExpression(app, src);
  await runExpression(
    app,
    `() => { ${RECIPE.replace(RECIPE_SLOT, () => `(${src}\n)()`)} }`,
  );
  for (let tries = 0; tries < 50; tries++) {
    const result = await runExpression(app, '() => globalThis.__DC_RESULT__');
    if (result?.error) throw new Error(result.error);
    if (result) return result.value ?? null;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  throw new Error('__DC_RESULT__ never set');
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

async function checkSnippets(browser, app, run, label) {
  const target = await openApp(browser, app);
  for (const { name, src } of snippets('devtools-debugging.md')) {
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
async function checkShimFallback(browser, app) {
  const target = await openApp(browser, app);
  const shim = findSnippet('devtools-debugging.md', 'const NAME');
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

/** The `Runtime.evaluate` results browser-cursor.md's desktop step 2 describes */
async function checkCdpResults(browser, app) {
  const target = await openApp(browser, app);
  const bare = await cdpEvaluate(target, '() => 1');
  assert.equal(bare.result.type, 'function');
  assert.deepEqual(bare.result.value, {});
  const noAwait = await cdpEvaluate(target, '(async () => 1)()', {
    awaitPromise: false,
  });
  assert.deepEqual(noAwait.result.value, {});
  const node = await cdpEvaluate(
    target,
    "(() => document.createElement('div'))()",
  );
  assert.deepEqual(node.result.value, {});
  const thrown = await cdpEvaluate(
    target,
    "(() => { throw new Error('thrown'); })()",
  );
  assert.ok(thrown.exceptionDetails);
  const rejected = await cdpEvaluate(
    target,
    "(async () => { throw new Error('rejected'); })()",
  );
  assert.ok(rejected.exceptionDetails);
  assert.deepEqual(rejected.result.value, {});
  assert.equal(
    await runExpression(target, '() => ({ a: 1 })').then(v => v.a),
    1,
  );
  assertNoPageErrors(target, 'Runtime.evaluate');
  await target.page.close();
}

/** desktop step 4: `__DC_CONSOLE__` records console calls and uncaught errors */
async function checkConsoleCapture(browser, app) {
  const target = await openApp(browser, app);
  const capture = findSnippet('browser-cursor.md', '__DC_CONSOLE__');
  assert.deepEqual(await runExpression(target, capture), {
    ok: true,
    count: 0,
  });
  await runExpression(
    target,
    `() => {
      console.log('logged', { a: 1 });
      console.error(new Error('errored'));
      setTimeout(() => { throw new Error('uncaught'); });
      Promise.reject(new Error('unhandled'));
    }`,
  );
  await target.page.waitForTimeout(100);
  const { log, total } = await runExpression(
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
  assert.equal((await runExpression(target, capture)).count, total);
  assertNoPageErrors(target, 'console capture', ['uncaught', 'unhandled']);
  await target.page.close();
}

const app = await bundleApp();
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
});
try {
  const checks = [
    [
      'evaluate_script / browser_evaluate',
      b => checkSnippets(b, app, runFunction, 'function'),
    ],
    [
      'browser_cdp Runtime.evaluate',
      b => checkSnippets(b, app, runExpression, 'expression'),
    ],
    [
      'Claude in Chrome __DC_RESULT__',
      b => checkSnippets(b, app, runClaudeInChrome, 'claude-in-chrome'),
    ],
    ['shim without __DC_ACTIONS__', b => checkShimFallback(b, app)],
    ['Runtime.evaluate results', b => checkCdpResults(b, app)],
    ['__DC_CONSOLE__ capture', b => checkConsoleCapture(b, app)],
  ];
  for (const [name, check] of checks) {
    await check(browser);
    console.log(`✓ ${name}`);
  }
} finally {
  await browser.close();
}
