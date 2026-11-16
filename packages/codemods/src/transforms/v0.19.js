'use strict';

const fs = require('node:fs');

const resolveModule = require('../resolveModule');

/**
 * @data-client v0.19 migration codemod
 *
 * Transforms:
 *   1. `managers` arrays → functions that return them:
 *      - `<DataProvider managers={...}>` (any JSX element's `managers` attribute)
 *      - `app.use(DataClientPlugin, { managers })`, `[DataClientPlugin, { managers }]`,
 *        `createDataClient({ managers })`, `mountDataClient(component, { managers })`,
 *        `renderDataHook(callback, { managers })` (or `renderDataClient()`)
 *      - `prepareStore(initialState, managers, ...)`, `createPersistedStore(managers)`
 *      `getDefaultManagers()` becomes `getDefaultManagers`. A variable holding an array literal or
 *      `getDefaultManagers(...)` becomes a function when it is only used as `managers`; other values
 *      are wrapped where they are passed: `managers={() => managers}`. A wrapped name gets a
 *      `// TODO(data-client):` comment, since every store would share the instances it holds; an
 *      inline array or call makes new ones per store. Exported variables are wrapped too,
 *      since other modules wrap them where they pass them. `renderDataCompose()` (Vue) takes
 *      `managers` too.
 *   2. Drops `initManager()`'s third argument, which 0.19 removed.
 *   3. `renderDataHook()` ran its default Managers before 0.19, ignoring `managers`; now `managers`
 *      replaces them, so a list of `new` Managers gets the defaults it lacks:
 *      `new NetworkManager()` (required) and `new SubscriptionManager(PollingSubscription)`.
 *   4. Managers:
 *      - `getMiddleware = () => controller => ...` and `getMiddleware() { return controller => ...; }`
 *        become a `middleware` property; `manager.getMiddleware()` becomes `manager.middleware`.
 *      - A class that `implements Manager` without middleware, and extends nothing that could
 *        supply it, gets a pass-through
 *        `middleware: Middleware = () => next => next`.
 *      - Reads of the removed `NetworkManager.cleanupDate`, and `getMiddleware` code it can't
 *        rewrite, get a `// TODO(data-client):` comment.
 *      - `controller.resolve(action.endpoint, { fetchedAt: Date.now() })` passes the fetch's
 *        `action.meta.fetchedAt`, which 0.19 matches responses to fetches by.
 *   5. `fetchIfStale()` always returns a Promise:
 *      - `Promise.resolve(ctrl.fetchIfStale(...))` becomes the bare call.
 *      - `if (x instanceof Promise)` (or `isPromise(x)`) on a result becomes its Promise branch, when
 *        that branch awaits the result.
 *      - `spyOn(ctrl, 'fetchIfStale').mockReturnValue(data)` becomes `.mockResolvedValue(data)`, and
 *        `fetchIfStale: jest.fn(() => data)` resolves its value.
 *      - A statement that reads its result as the data, or that handles an awaited result being
 *        missing, gets a `// TODO(data-client):` comment.
 *   6. Unawaited reads never reject unhandled: a no-op `.catch(() => {})` on an unused `fetchIfStale()`,
 *      or on `fetch()` of `XResource.get`/`getList`/`getList.getPage`, is dropped.
 *   7. `__DC_CONTROLLERS__.get(name)` becomes `__DC__.controller` after `__DC__.store = name`, in any
 *      file, since debugging scripts rarely import data-client; other uses get a TODO.
 *   8. Deprecated APIs:
 *      - `Resource.create` becomes `Resource.getList.push` where it runs, for an unchanged `const`
 *        `resource()` declared in the file or imported from a relative or tsconfig-aliased module;
 *        DevTools `actionsBlacklist`/`actionsWhitelist` options become `actionsDenylist`/`actionsAllowlist`;
 *        `renderDataCompose()`'s `waitForNextUpdate()` becomes `allSettled()`, and is dropped right
 *        before `await result`; `static pk()` overrides type `args` as `readonly any[]`.
 *      - Other `*Resource.create`, React `waitForNextUpdate()`, `renderDataHook.cleanup()`/
 *        `.allSettled()` and Vue `createDataClient()` get a `// TODO(data-client):` comment.
 *
 * Usage:
 *   npx @data-client/codemods v0.19 src/
 *   npx @data-client/codemods v0.19 src/ --deprecations=false  # skip section 8
 *   npx @data-client/codemods v0.19 src/ --deprecations=only   # just section 8
 */

const DATA_CLIENT_PREFIX = '@data-client/';
// every rewrite outside the deprecated APIs needs one of these names in the file
const NAMES =
  /managers|initManager|prepareStore|createPersistedStore|fetchIfStale|getMiddleware|cleanupDate|\bManager\b|fetchedAt|\.catch\(/;
const BLOG = 'https://dataclient.io/blog/2026/10/03/v0.19-batch-set';
// calls whose object argument has a `managers` option
const OPTION_CALLS = new Set([
  'createDataClient',
  'mountDataClient',
  'renderDataHook',
  // makeRenderDataHook() docs name its result renderDataClient()
  'renderDataClient',
  'renderDataCompose',
]);
// test helpers that ran their default Managers, ignoring `managers`, before 0.19
const RENDER_HOOK_CALLS = new Set(['renderDataHook', 'renderDataClient']);
// calls that take managers as a positional argument, and its index
const POSITIONAL_CALLS = new Map([
  ['prepareStore', 1],
  ['createPersistedStore', 0],
]);

const isId = (node, name) => node?.type === 'Identifier' && node.name === name;

const isProperty = node =>
  node?.type === 'ObjectProperty' || node?.type === 'Property';

const isFunction = node =>
  node?.type === 'ArrowFunctionExpression' ||
  node?.type === 'FunctionExpression';

// `undefined` selects the default Managers, so it stays as it is
const isUndefined = node =>
  isId(node, 'undefined') ||
  (node.type === 'UnaryExpression' && node.operator === 'void');

/** `undefined`, `void 0` or `null` */
const isNullish = node =>
  isId(node, 'undefined') ||
  node.type === 'NullLiteral' ||
  (node.type === 'Literal' && node.value === null) ||
  (node.type === 'UnaryExpression' &&
    node.operator === 'void' &&
    /Literal$/.test(node.argument.type));

const isGetDefaultManagersCall = node =>
  node.type === 'CallExpression' && isId(node.callee, 'getDefaultManagers');

const isMember = node =>
  node?.type === 'MemberExpression' ||
  node?.type === 'OptionalMemberExpression';

// a computed key or property names a member only when it is a string
const staticName = (key, computed) =>
  computed ?
    typeof key?.value === 'string' ?
      key.value
    : undefined
  : (key?.name ?? key?.value);

/** The property name of `x.name`, `x?.name` or `x['name']` */
const memberName = node =>
  isMember(node) ? staticName(node.property, node.computed) : undefined;

/** The key name of a property or class member */
const keyName = node => staticName(node.key, node.computed);

/** The name `Foo` or `ns.Foo` ends with */
const nameOf = node =>
  node.type === 'Identifier' ? node.name : memberName(node);

const calleeName = node => nameOf(node.callee);

/** `managers: ...` or `'managers': ...` */
const isManagersProperty = node =>
  isProperty(node) && !node.computed && keyName(node) === 'managers';

/** Paths to every expression passed as `managers` */
function findManagerSlots(j, root) {
  const slots = [];
  const optionOf = objectPath => {
    if (objectPath.node?.type !== 'ObjectExpression') return;
    objectPath.get('properties').each(prop => {
      const { node } = prop;
      if (isManagersProperty(node)) slots.push(prop.get('value'));
    });
  };

  root.find(j.JSXAttribute, { name: { name: 'managers' } }).forEach(attr => {
    if (attr.node.value?.type === 'JSXExpressionContainer')
      slots.push(attr.get('value', 'expression'));
  });

  root.find(j.CallExpression).forEach(call => {
    const name = calleeName(call.node);
    const args = call.get('arguments');
    if (name === 'use' && isId(call.node.arguments[0], 'DataClientPlugin')) {
      optionOf(args.get(1));
    } else if (OPTION_CALLS.has(name)) {
      args.each(optionOf);
    } else if (POSITIONAL_CALLS.has(name)) {
      const i = POSITIONAL_CALLS.get(name);
      if (call.node.arguments[i]) slots.push(args.get(i));
    }
  });

  // app plugins in tests: `plugins: [[DataClientPlugin, { managers }]]`
  root.find(j.ArrayExpression).forEach(array => {
    if (isId(array.node.elements[0], 'DataClientPlugin'))
      optionOf(array.get('elements', 1));
  });
  return slots;
}

/** The binding path (`id` of its declaration) for an identifier, if declared in this file */
function bindingOf(path) {
  const scope = path.scope?.lookup(path.node.name);
  return scope?.getBindings()[path.node.name]?.[0];
}

/** Whether `p` names something else, like an object key, a non-computed member or the other module's
 * name in `import { name as local }` */
function isOtherName(p) {
  const parent = p.parent.node;
  return (
    (isMember(parent) && parent.property === p.node && !parent.computed) ||
    (isProperty(parent) && parent.key === p.node && parent.value !== p.node) ||
    (parent.type === 'ImportSpecifier' &&
      parent.imported === p.node &&
      parent.local !== p.node)
  );
}

/** The identifiers that refer to `binding`, other than its declaration */
const usesOf = (j, root, binding) =>
  root.find(j.Identifier, { name: binding.node.name }).filter(
    p =>
      p.node !== binding.node &&
      // JSX names like the `managers` attribute are JSXIdentifiers
      p.node.type === 'Identifier' &&
      !isOtherName(p) &&
      bindingOf(p) === binding,
  );

/** Whether a variable is declared in `export const`, so other modules can use or change it */
const isExported = binding =>
  binding.parent.parent?.parent?.node.type === 'ExportNamedDeclaration';

/** Whether every use of a variable is one of the `managers` slots */
function onlyUsedAsManagers(j, root, binding, slotNodes) {
  // other modules may pass `export const managers` too, and they get wrapped
  if (isExported(binding)) return false;
  return usesOf(j, root, binding).every(p => slotNodes.has(p.node));
}

/** `: Manager[]` becomes `: () => Manager[]` */
function toFunctionType(j, typeAnnotation) {
  const fn = j.tsFunctionType([]);
  fn.typeAnnotation = j.tsTypeAnnotation(typeAnnotation.typeAnnotation);
  return j.tsTypeAnnotation(fn);
}

/** Whether `node` makes new Managers each time it runs: `getDefaultManagers(...)`, or a list of
 * `new` Managers and `...getDefaultManagers()`. Anything else may hold a shared instance, already
 * be a function, or be a hook or memoized call. */
function createsNewManagers(node) {
  node = unwrap(node);
  if (isGetDefaultManagersCall(node)) return true;
  return (
    node.type === 'ArrayExpression' &&
    node.elements.every(e => {
      const value = unwrap(e?.type === 'SpreadElement' ? e.argument : e);
      return value?.type === 'NewExpression' || isGetDefaultManagersCall(value);
    })
  );
}

/** Replaces a slot's expression, expanding `{ managers }` shorthand */
function replace(path, node) {
  path.replace(node);
  if (path.parent.node.shorthand) path.parent.node.shorthand = false;
}

function transformManagers(j, root) {
  const slots = findManagerSlots(j, root);
  const slotNodes = new Set(slots.map(path => path.node));

  // returns whether it changed the expression at `path`
  const convert = path => {
    const node = path.node;
    if (isFunction(node) || isUndefined(node)) return false;
    // `cond ? managers : undefined` keeps the defaults when it is undefined
    if (node.type === 'ConditionalExpression') {
      const consequent = convert(path.get('consequent'));
      return convert(path.get('alternate')) || consequent;
    }
    if (isId(node, 'getDefaultManagers')) return false;
    if (isGetDefaultManagersCall(node) && node.arguments.length === 0) {
      replace(path, j.identifier('getDefaultManagers'));
      return true;
    }
    const binding = node.type === 'Identifier' && bindingOf(path);
    const declaration = binding && binding.parent.node;
    if (declaration?.type === 'FunctionDeclaration') return false;
    const init = declaration?.type === 'VariableDeclarator' && declaration.init;
    if (init) {
      if (isFunction(init)) return false;
      if (
        (init.type === 'ArrayExpression' || isGetDefaultManagersCall(init)) &&
        onlyUsedAsManagers(j, root, binding, slotNodes)
      ) {
        declaration.init = j.arrowFunctionExpression([], init);
        if (declaration.id.typeAnnotation)
          declaration.id.typeAnnotation = toFunctionType(
            j,
            declaration.id.typeAnnotation,
          );
        if (!createsNewManagers(init))
          addTodo(j, binding, SHARED_MANAGERS_TODO);
        return true;
      }
    }
    replace(path, j.arrowFunctionExpression([], node));
    if (!createsNewManagers(node)) addTodo(j, path, SHARED_MANAGERS_TODO);
    return true;
  };

  let dirty = false;
  slots.forEach(path => {
    if (convert(path)) dirty = true;
  });
  return dirty;
}

function transformInitManager(j, root) {
  let dirty = false;
  root
    .find(j.CallExpression, { callee: { name: 'initManager' } })
    .forEach(call => {
      if (call.node.arguments.length > 2) {
        call.node.arguments = call.node.arguments.slice(0, 2);
        dirty = true;
      }
    });
  return dirty;
}

const SHARED_MANAGERS_TODO =
  ' TODO(data-client): managers runs once per store since 0.19; create the Managers inside this ' +
  `function so stores don't share them, or pass the function itself if it already is one: ${BLOG}#managers-function`;
const FETCH_IF_STALE_TODO =
  ' TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: ' +
  `${BLOG}#fetch-if-stale-promise`;
// Promise methods; reading any other member of the result means the code expected the data
const PROMISE_METHODS = new Set(['then', 'catch', 'finally']);
const MOCK_TODO =
  ' TODO(data-client): fetchIfStale() always returns a Promise since 0.19; make this mock resolve its data: ' +
  `${BLOG}#fetch-if-stale-promise`;
const MOCK_RENAMES = new Map([
  ['mockReturnValue', 'mockResolvedValue'],
  ['mockReturnValueOnce', 'mockResolvedValueOnce'],
]);
// wrappers that pass the value through unchanged
const PASS_THROUGH = new Set([
  'TSAsExpression',
  'TSSatisfiesExpression',
  'TSNonNullExpression',
  'TSTypeAssertion',
  'ParenthesizedExpression',
]);

/** The outermost wrapper around the value at `path` that passes it through unchanged */
function outerPath(path) {
  while (PASS_THROUGH.has(path.parent.node.type)) path = path.parent;
  return path;
}

/** Puts `comments` above the ones `node` already has */
const prependComments = (node, comments) => {
  node.comments = [...(comments ?? []), ...(node.comments ?? [])];
};

const isFetchIfStaleCall = node =>
  node?.type === 'CallExpression' && calleeName(node) === 'fetchIfStale';

function unwrap(node) {
  while (PASS_THROUGH.has(node?.type)) node = node.expression;
  return node;
}

/** Whether the member at `path` is the callee of `.then()`, `.catch()` or `.finally()` */
function isPromiseMethodCall(path) {
  const member = path.node;
  return (
    !member.computed &&
    PROMISE_METHODS.has(member.property.name) &&
    path.parent.node.callee === member
  );
}

/** Whether the value at `path` is used as if it were the data, not a Promise */
function readsSynchronously(path) {
  path = outerPath(path);
  const { node } = path;
  const parent = path.parent.node;
  switch (parent.type) {
    case 'MemberExpression':
    case 'OptionalMemberExpression':
      return parent.object === node && !isPromiseMethodCall(path.parent);
    case 'BinaryExpression':
    case 'TemplateLiteral':
    case 'SpreadElement':
    case 'JSXSpreadAttribute':
      return true;
    case 'UnaryExpression':
      return parent.operator !== 'void';
    case 'LogicalExpression':
      return parent.left === node;
    case 'IfStatement':
    case 'ConditionalExpression':
    case 'WhileStatement':
    case 'DoWhileStatement':
      return parent.test === node;
    case 'VariableDeclarator':
      // destructuring: ObjectPattern or ArrayPattern
      return parent.init === node && parent.id.type.endsWith('Pattern');
    case 'CallExpression':
      // `isPromise(result)` checks for the data
      return isPromiseCheckCall(parent) && parent.arguments[0] === node;
    default:
      return false;
  }
}

/** `const x = ctrl.fetchIfStale(...)` declarators */
const findFetchIfStaleConsts = (j, root) =>
  root
    .find(j.VariableDeclarator, { id: { type: 'Identifier' } })
    .filter(
      decl =>
        decl.parent.node.kind === 'const' &&
        isFetchIfStaleCall(unwrap(decl.node.init)),
    )
    .paths();

/** The identifiers in `path` (default: the declaration's scope) that read the variable `decl` declares */
const refsTo = (j, decl, path = decl.scope.path) =>
  usesOf(j, j(path), decl.get('id')).paths();

/** Paths that use a `fetchIfStale()` result as the data: the call itself, or a `const` holding it */
function findSyncReads(j, root) {
  const reads = root
    .find(j.CallExpression)
    .filter(call => isFetchIfStaleCall(call.node) && readsSynchronously(call))
    .paths();
  for (const decl of findFetchIfStaleConsts(j, root))
    reads.push(...refsTo(j, decl).filter(readsSynchronously));
  return reads;
}

/** `isPromise(x)` or `isThenable(x)`, a helper that checks for a Promise */
const isPromiseCheckCall = node =>
  node.type === 'CallExpression' &&
  node.arguments.length === 1 &&
  /^is(Promise|Thenable)(Like)?$/.test(calleeName(node) ?? '');

/** What a test checks is a Promise, and whether it is negated: `x instanceof Promise`, `isPromise(x)`,
 * or either under `!` */
function promiseCheckOf(test) {
  let negated = false;
  test = unwrap(test);
  while (test?.type === 'UnaryExpression' && test.operator === '!') {
    negated = !negated;
    test = unwrap(test.argument);
  }
  if (
    test?.type === 'BinaryExpression' &&
    test.operator === 'instanceof' &&
    isId(test.right, 'Promise')
  )
    return { checked: unwrap(test.left), negated };
  if (test && isPromiseCheckCall(test))
    return { checked: unwrap(test.arguments[0]), negated };
}

/** Whether `branch` waits for the Promise `decl` holds: `await x` or `x.then()` */
function awaits(j, branch, decl) {
  return refsTo(j, decl, branch).some(ref => {
    const parent = ref.parent.node;
    return (
      (parent.type === 'AwaitExpression' && parent.argument === ref.node) ||
      (isMember(parent) &&
        parent.object === ref.node &&
        isPromiseMethodCall(ref.parent))
    );
  });
}

/** Whether `statements` can move into the block around `path` without their declarations clashing with
 * names already visible there */
function canInline(path, statements) {
  return statements.every(statement => {
    const declared =
      statement.type === 'VariableDeclaration' ?
        statement.declarations.map(d => d.id)
      : [statement.id];
    if (!declared.every(id => id === undefined || id?.type === 'Identifier'))
      return false;
    return declared.every(id => {
      if (!id) return true;
      // ast-types puts block-scoped names in the function's scope, so the branch's own declaration is
      // the one binding allowed there
      const scope = path.scope.lookup(id.name);
      return (
        !scope ||
        (scope === path.scope &&
          scope.getBindings()[id.name].length === 1 &&
          !path.scope.parent?.lookup(id.name))
      );
    });
  });
}

/** Replaces the `if` or `?:` at `path` with the branch at `branchPath` */
function keepBranch(path, branchPath) {
  const branch = branchPath.node;
  if (path.node.type === 'ConditionalExpression') {
    path.replace(branch);
    return;
  }
  const statements = branch.type === 'BlockStatement' ? branch.body : [branch];
  const replacement =
    Array.isArray(path.parentPath.value) && canInline(path, statements) ?
      statements
    : [branch];
  if (replacement[0]) prependComments(replacement[0], path.node.comments);
  path.replace(...replacement);
}

/** A check like `if (x instanceof Promise)` on a `fetchIfStale()` result now always takes the Promise
 * branch, so where that branch waits for the result, it replaces the whole check */
function keepPromiseBranches(j, root) {
  const consts = new Set(findFetchIfStaleConsts(j, root).map(d => d.node));
  if (!consts.size) return false;
  let dirty = false;
  const checks = [
    ...root.find(j.IfStatement).paths(),
    ...root.find(j.ConditionalExpression).paths(),
  ].reverse(); // inner checks first, so replacing an outer one keeps their edits
  for (const path of checks) {
    const check = promiseCheckOf(path.node.test);
    if (check?.checked.type !== 'Identifier') continue;
    const ref = j(path.get('test'))
      .find(j.Identifier, { name: check.checked.name })
      .paths()[0];
    const decl = ref && bindingOf(ref)?.parent;
    if (!decl || !consts.has(decl.node)) continue;
    const branch = path.get(check.negated ? 'alternate' : 'consequent');
    if (!branch.node || !awaits(j, branch, decl)) continue;
    keepBranch(path, branch);
    dirty = true;
  }
  return dirty;
}

const FALLBACK_TODO =
  ' TODO(data-client): an awaited fetchIfStale() rejects, instead of resolving undefined, when the latest ' +
  `fetch failed since 0.19; handle that case in .catch() or try/catch: ${BLOG}#fetch-if-stale-promise`;

/** Whether the value at `path` is checked for a missing result: `x ?? fallback`, `x && x.id`, `!x`, `x == null` */
function checksMissing(path) {
  path = outerPath(path);
  const { node } = path;
  const parent = path.parent.node;
  switch (parent.type) {
    case 'LogicalExpression':
      return parent.left === node;
    case 'UnaryExpression':
      return parent.operator === '!';
    case 'BinaryExpression': {
      const other = parent.left === node ? parent.right : parent.left;
      return (
        ['==', '===', '!=', '!=='].includes(parent.operator) && isNullish(other)
      );
    }
    case 'IfStatement':
    case 'ConditionalExpression':
      return parent.test === node;
    default:
      return false;
  }
}

/** Code that handled an awaited `fetchIfStale()` resolving `undefined` after a failed fetch */
function markMissingChecks(j, root) {
  const marked = [];
  root
    .find(j.AwaitExpression)
    .filter(({ node }) => isFetchIfStaleCall(unwrap(node.argument)))
    .forEach(awaited => {
      if (checksMissing(awaited)) marked.push(awaited);
      const path = outerPath(awaited);
      const decl = path.parent;
      if (
        decl.node.type === 'VariableDeclarator' &&
        decl.node.init === path.node &&
        decl.node.id.type === 'Identifier'
      )
        marked.push(...refsTo(j, decl).filter(checksMissing));
    });
  return addTodos(j, marked, FALLBACK_TODO);
}

/** Comments `text` above each statement holding one of `paths`; returns whether it added any */
const addTodos = (j, paths, text) =>
  paths.map(path => addTodo(j, path, text)).some(Boolean);

/** Comments `text` above the statement holding `path`; returns whether it added the comment */
function addTodo(j, path, text) {
  const { node } = statementOf(j, path);
  const comments = node.comments || (node.comments = []);
  // a statement can need it several times, and the codemod can run again
  if (comments.some(c => c.value === text) || hasTodoAbove(j, path, node, text))
    return false;
  comments.push(j.commentLine(text, true, false));
  return true;
}

// TODO lines a previous run left, by program: `value` -> end lines
const sourceTodos = new WeakMap();

/** Whether a previous run left `text` on the line above `node`, or on its line, where the parser may
 * attach it to another node */
function hasTodoAbove(j, path, node, text) {
  const program = j(path).closest(j.Program).paths()[0].node;
  if (!sourceTodos.has(program)) {
    // read before this run adds any comment
    const todos = new Map();
    j(program)
      .find(j.Comment)
      // a comment's `node` is the node holding it; `value` is the comment
      .forEach(({ value: c }) => {
        if (!c.loc || !c.value.startsWith(' TODO(data-client)')) return;
        todos.set(c.value, [...(todos.get(c.value) ?? []), c.loc.end.line]);
      });
    sourceTodos.set(program, todos);
  }
  const line = node.loc?.start.line;
  return (sourceTodos.get(program).get(text) ?? []).some(
    end => end === line || end === line - 1,
  );
}

const CLASS_MEMBERS = new Set(['ClassMethod', 'ClassProperty']);
// members a TODO goes directly above
const MEMBERS = new Set([
  ...CLASS_MEMBERS,
  'TSDeclareMethod',
  'ObjectMethod',
  'ObjectProperty',
]);

/** The statement or class member to comment on: the outermost statement on its own line, so for
 * `else if` the whole `if` chain, and for `if (x) return y;` the `if` */
function statementOf(j, path) {
  if (MEMBERS.has(path.node.type)) return path;
  let statement =
    j.Statement.check(path.node) ?
      path
    : j(path).closest(j.Statement).paths()[0];
  while (
    j.Statement.check(statement.parent.node) &&
    statement.parent.node.type !== 'BlockStatement' &&
    statement.parent.node.type !== 'StaticBlock'
  )
    statement = statement.parent;
  return statement;
}

/** `Promise.resolve(ctrl.fetchIfStale(...))` made `.catch()` work on fresh data, which the call now does itself */
function unwrapPromiseResolve(j, root) {
  return (
    root
      .find(j.CallExpression, {
        callee: { object: { name: 'Promise' }, property: { name: 'resolve' } },
      })
      .filter(
        call =>
          call.node.arguments.length === 1 &&
          isFetchIfStaleCall(call.node.arguments[0]),
      )
      .forEach(call => call.replace(call.node.arguments[0]))
      .size() > 0
  );
}

/** `jest.fn(...)` or `vi.fn(...)` */
const isMockFn = node =>
  node?.type === 'CallExpression' &&
  memberName(node.callee) === 'fn' &&
  ['jest', 'vi'].includes(node.callee.object?.name);

/** The `.mock*()` calls chained onto the mock created at `path`, innermost first */
function mockChain(path) {
  const chain = [];
  while (
    isMember(path.parent.node) &&
    path.parent.node.object === path.node &&
    memberName(path.parent.node)?.startsWith('mock') &&
    path.parent.parent.node.type === 'CallExpression' &&
    path.parent.parent.node.callee === path.parent.node
  ) {
    path = path.parent.parent;
    chain.push(path);
  }
  return chain;
}

/** Whether the mock created at `path` stands in for fetchIfStale: `spyOn(ctrl, 'fetchIfStale')`, or a
 * `jest.fn()` held by a `fetchIfStale` property or assigned to `ctrl.fetchIfStale` */
function mocksFetchIfStale(path) {
  const { node } = path;
  if (calleeName(node) === 'spyOn')
    return node.arguments[1]?.value === 'fetchIfStale';
  if (!isMockFn(node)) return false;
  const top = mockChain(path).at(-1) ?? path;
  const parent = top.parent.node;
  return (
    (isProperty(parent) &&
      parent.value === top.node &&
      keyName(parent) === 'fetchIfStale') ||
    (parent.type === 'AssignmentExpression' &&
      parent.right === top.node &&
      memberName(parent.left) === 'fetchIfStale')
  );
}

const MOCK_IMPLEMENTATIONS = new Set([
  'mockImplementation',
  'mockImplementationOnce',
]);

/** `Promise.resolve(...)`, `Promise.reject(...)` or `new Promise(...)` */
const isPromiseValue = node =>
  (node.type === 'CallExpression' &&
    isId(node.callee.object, 'Promise') &&
    ['resolve', 'reject'].includes(memberName(node.callee))) ||
  (node.type === 'NewExpression' && isId(node.callee, 'Promise'));

/** Makes a mock implementation return a Promise: `() => data` becomes `() => Promise.resolve(data)`.
 * Returns whether it changed it. */
function resolveImplementation(j, fn) {
  if (!isFunction(fn) || fn.async || fn.generator) return false;
  const wrap = value =>
    j.callExpression(
      j.memberExpression(j.identifier('Promise'), j.identifier('resolve')),
      [value],
    );
  if (fn.body.type !== 'BlockStatement') {
    if (isPromiseValue(unwrap(fn.body))) return false;
    fn.body = wrap(fn.body);
    return true;
  }
  // only this function's own returns, not those of functions inside it
  const nested = new Set(
    j(fn.body).find(j.Function).find(j.ReturnStatement).nodes(),
  );
  let dirty = false;
  j(fn.body)
    .find(j.ReturnStatement)
    .forEach(({ node }) => {
      if (
        nested.has(node) ||
        !node.argument ||
        isPromiseValue(unwrap(node.argument))
      )
        return;
      node.argument = wrap(node.argument);
      dirty = true;
    });
  return dirty;
}

/** Mocks of the old fresh-data return: `spyOn(ctrl, 'fetchIfStale').mockReturnValue(data)` resolves its
 * value, and so do `jest.fn(() => data)` implementations of `fetchIfStale` */
function resolveFetchIfStaleMocks(j, root) {
  let dirty = false;
  const marked = [];
  // an implementation defined elsewhere (`mockImplementation(impl)`) gets a TODO
  const resolve = (call, fn) => {
    if (isFunction(fn)) dirty = resolveImplementation(j, fn) || dirty;
    else marked.push(call);
  };
  root
    .find(j.CallExpression)
    .filter(mocksFetchIfStale)
    .forEach(mock => {
      if (isMockFn(mock.node) && mock.node.arguments[0])
        resolve(mock, mock.node.arguments[0]);
      for (const call of mockChain(mock)) {
        const { node } = call;
        const name = memberName(node.callee);
        if (MOCK_RENAMES.has(name)) {
          node.callee.property = j.identifier(MOCK_RENAMES.get(name));
          dirty = true;
        } else if (MOCK_IMPLEMENTATIONS.has(name) && node.arguments[0]) {
          resolve(call, node.arguments[0]);
        }
      }
    });
  return addTodos(j, marked, MOCK_TODO) || dirty;
}

/** Where to `await` depends on the code around it, so mark the statement instead */
function markSyncReads(j, root) {
  return addTodos(j, findSyncReads(j, root), FETCH_IF_STALE_TODO);
}

function transformFetchIfStale(j, root, source) {
  if (!source.includes('fetchIfStale')) return false;
  let dirty = unwrapPromiseResolve(j, root);
  dirty = resolveFetchIfStaleMocks(j, root) || dirty;
  dirty = keepPromiseBranches(j, root) || dirty;
  dirty = markSyncReads(j, root) || dirty;
  dirty = markMissingChecks(j, root) || dirty;
  return dirty;
}

/* Reads you don't await never reject unhandled since 0.19, so their no-op catches are dead code */

/** `() => {}`, `() => undefined` or `() => null` */
function isNoopHandler(node) {
  if (!isFunction(node) || node.async || node.generator) return false;
  const { body } = node;
  return body.type === 'BlockStatement' ?
      body.body.length === 0
    : isNullish(body);
}

// resource() members that read: they have no sideEffect
const RESOURCE_READS = new Set(['get', 'getList']);

/** `XResource.get`, `XResource.getList` or `XResource.getList.getPage` */
function isResourceRead(node) {
  node = unwrap(node);
  if (memberName(node) === 'getPage' && memberName(node.object) === 'getList')
    node = node.object;
  return (
    !node?.computed &&
    RESOURCE_READS.has(memberName(node)) &&
    node.object.type === 'Identifier' &&
    /Resource$/.test(node.object.name)
  );
}

/** Whether `node` starts a read that can't reject unhandled: any `fetchIfStale()`, or `fetch()` of a
 * resource read. `fetch` named alone is `const { fetch } = useController()`, since the global
 * fetch() takes a URL. */
const isPrehandledRead = node =>
  isFetchIfStaleCall(node) ||
  (node.type === 'CallExpression' &&
    calleeName(node) === 'fetch' &&
    isResourceRead(node.arguments[0]));

/** Whether nothing uses the value at `path`: a statement of its own, `void`, or the body of a JSX event
 * handler, whose return value React ignores */
function isUnused(path) {
  const parent = path.parent.node;
  if (parent.type === 'ExpressionStatement') return true;
  if (parent.type === 'UnaryExpression' && parent.operator === 'void')
    return true;
  const container = path.parent.parent?.node;
  return (
    parent.type === 'ArrowFunctionExpression' &&
    parent.body === path.node &&
    container?.type === 'JSXExpressionContainer' &&
    /^on[A-Z]/.test(path.parent.parent.parent.node.name?.name ?? '')
  );
}

/** `ctrl.fetch(TodoResource.getList).catch(() => {})` becomes `ctrl.fetch(TodoResource.getList)` where
 * nothing uses the result */
function dropNoopCatches(j, root) {
  return (
    root
      .find(j.CallExpression)
      .filter(({ node }) => {
        const { callee } = node;
        return (
          memberName(callee) === 'catch' &&
          !callee.computed &&
          node.arguments.length === 1 &&
          isNoopHandler(node.arguments[0]) &&
          isPrehandledRead(unwrap(callee.object))
        );
      })
      .filter(isUnused)
      .forEach(call => {
        const read = call.node.callee.object;
        prependComments(read, call.node.comments);
        call.replace(read);
      })
      .size() > 0
  );
}

/* controller.resolve() matches a response to its fetch by fetchedAt since 0.19 */

/** `Date.now()` */
const isDateNow = node =>
  node?.type === 'CallExpression' &&
  !node.arguments.length &&
  isId(node.callee.object, 'Date') &&
  memberName(node.callee) === 'now';

// names a fetch action goes by; another object with an `endpoint` (props, options) has no `meta`
const isActionName = node =>
  node?.type === 'Identifier' && /(^a|A)ction$/.test(node.name);

/** The fetch action's `meta` for the endpoint at `path`: `action.meta` for `action.endpoint`, or the
 * `meta` destructured with `endpoint` */
function fetchMetaOf(j, path) {
  const { node } = path;
  const metaOf = action =>
    j.memberExpression(j.identifier(action.name), j.identifier('meta'));
  if (memberName(node) === 'endpoint' && isActionName(node.object))
    return metaOf(node.object);
  // `const { endpoint } = action` or `({ endpoint, meta }) => ...`
  const property = destructuredBy(path);
  if (!property || keyName(property.node) !== 'endpoint') return;
  const meta = property.parent.node.properties.find(
    p =>
      isProperty(p) && keyName(p) === 'meta' && p.value.type === 'Identifier',
  );
  if (meta) return j.identifier(meta.value.name);
  const declarator = property.parent.parent.node;
  if (declarator.type === 'VariableDeclarator' && isActionName(declarator.init))
    return metaOf(declarator.init);
}

/** `controller.resolve(action.endpoint, { ..., fetchedAt: Date.now() })` passes `action.meta.fetchedAt` */
function passFetchedAt(j, root) {
  let dirty = false;
  root
    .find(j.CallExpression)
    .filter(
      ({ node }) =>
        memberName(node.callee) === 'resolve' &&
        node.arguments[1]?.type === 'ObjectExpression',
    )
    .forEach(call => {
      const fetchedAt = call.node.arguments[1].properties.find(
        p => isProperty(p) && !p.computed && keyName(p) === 'fetchedAt',
      );
      if (!fetchedAt || !isDateNow(fetchedAt.value)) return;
      const meta = fetchMetaOf(j, call.get('arguments', 0));
      if (!meta) return;
      fetchedAt.value = j.memberExpression(meta, j.identifier('fetchedAt'));
      dirty = true;
    });
  return dirty;
}

const CLEANUP_DATE_TODO = ` TODO(data-client): NetworkManager.cleanupDate was removed in 0.19: ${BLOG}#manager-cleanup`;
const PASS_THROUGH_TODO = ` TODO(data-client): if this is a data-client Manager, it throws on mount without a middleware property since 0.19; add \`middleware: Middleware = () => next => next\`: ${BLOG}#manager-middleware`;
const GET_MIDDLEWARE_TODO = ` TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: ${BLOG}#manager-middleware`;

/** The function of a `getMiddleware() {}` method or a `getMiddleware = () => {}` property */
const getterOf = member =>
  member.type === 'ClassMethod' ? member
  : isFunction(member.value) ? member.value
  : undefined;

/** The middleware a `getMiddleware` member returns, when it is a function the property can hold */
function returnedMiddleware(member) {
  const value = returnedValue(member);
  // a property initializer runs at construction, while getMiddleware() ran at mount, so only
  // move a function, whose body still runs later
  return isFunction(value) ? value : undefined;
}

/** What a `getMiddleware` member returns, when it only returns an expression */
function returnedValue(member) {
  const fn = getterOf(member);
  // data-client never called a static getMiddleware(), and an async or generator one returns no
  // middleware
  if (!fn || fn.params.length || fn.async || fn.generator || member.static)
    return;
  const { body } = fn;
  if (body.type !== 'BlockStatement') return body;
  if (body.body.length === 1 && body.body[0].type === 'ReturnStatement')
    return body.body[0].argument;
}

// object-literal and abstract members are found so calls to them aren't rewritten, but only class
// members with a body convert
const isGetMiddleware = node =>
  MEMBERS.has(node.type) && keyName(node) === 'getMiddleware';

/** Whether a class body declares `name`, as a member or a constructor parameter property */
const hasMember = (classBody, name) =>
  classBody.body.some(
    m =>
      keyName(m) === name ||
      (m.kind === 'constructor' &&
        m.params.some(
          p =>
            p.type === 'TSParameterProperty' &&
            // `middleware: Middleware = ...` is an AssignmentPattern
            isId(p.parameter.left ?? p.parameter, name),
        )),
  );

/** `getMiddleware() { return this.middleware; }`, a pre-0.19 shim around a `middleware` property */
const returnsOwnMiddleware = member => {
  const value = returnedValue(member);
  return (
    value?.object?.type === 'ThisExpression' &&
    memberName(value) === 'middleware'
  );
};

/** `x.getMiddleware()`, `x?.getMiddleware()` or `x['getMiddleware']()` */
const isGetMiddlewareCall = node =>
  (node.type === 'CallExpression' || node.type === 'OptionalCallExpression') &&
  !node.arguments.length &&
  memberName(node.callee) === 'getMiddleware';

/** `getMiddleware` members and calls become `middleware` */
function renameGetMiddleware(j, root) {
  // a reference other than a call, such as `this.getMiddleware.bind(this)`, needs the member
  // (ast-types counts optional members and calls as MemberExpression and CallExpression)
  const otherRefs = root
    .find(j.MemberExpression)
    .filter(
      ({ node, parent }) =>
        memberName(node) === 'getMiddleware' &&
        !isGetMiddlewareCall(parent.node),
    )
    .paths();
  let dirty = addTodos(j, otherRefs, GET_MIDDLEWARE_TODO);
  const members = root
    .find(j.Node)
    .filter(p => isGetMiddleware(p.node))
    .paths();
  const plans = members.map(member => migration(j, member));
  // calls can't tell which member they reach, so convert every member or none
  const unconverted = otherRefs.length > 0 || !plans.every(Boolean);
  if (unconverted) dirty = addTodos(j, members, GET_MIDDLEWARE_TODO) || dirty;
  else if (plans.length) {
    plans.forEach(migrate => migrate());
    dirty = true;
  }
  root
    .find(j.CallExpression)
    .filter(({ node }) => isGetMiddlewareCall(node))
    .forEach(call => {
      // a subclass's middleware property is not on the prototype, so super can't reach it; and
      // a call may target a member this file kept
      if (call.node.callee.object.type === 'Super' || unconverted) {
        // an unconverted getMiddleware member already carries the TODO
        const member = j(call).closest(j.Node, isGetMiddleware).paths()[0];
        if (!member) dirty = addTodo(j, call, GET_MIDDLEWARE_TODO) || dirty;
        return;
      }
      // `x.getMiddleware()` becomes `x.middleware`, keeping `?.`
      const { callee } = call.node;
      callee.property = j.identifier('middleware');
      callee.computed = false;
      call.replace(callee);
      dirty = true;
    });
  return dirty;
}

/** How to migrate a class's `getMiddleware` member, if it can be: replace it with a `middleware`
 * property, or remove it when it only returns the class's own `middleware` */
function migration(j, member) {
  if (!CLASS_MEMBERS.has(member.node.type)) return;
  if (hasMember(member.parent.node, 'middleware'))
    return returnsOwnMiddleware(member.node) ? () => member.prune() : undefined;
  const middleware = returnedMiddleware(member.node);
  if (middleware)
    return () => member.replace(middlewareProperty(j, member.node, middleware));
}

/** `middleware = ...` keeping the `getMiddleware` member's visibility, return type and comments */
function middlewareProperty(j, member, middleware) {
  const property = j.classProperty(
    j.identifier('middleware'),
    middleware,
    getterOf(member).returnType ?? null,
  );
  // recast can't print `override` on a new property; tsc's noImplicitOverride flags the omission
  for (const key of ['accessibility', 'decorators', 'comments'])
    if (member[key]) property[key] = member[key];
  return property;
}

/** The declaration and specifier that import `name`, if any. Specifiers this codemod adds have no
 * `local`, so their name is `imported`. */
function importOf(j, root, name) {
  for (const declaration of importsOf(root)) {
    const specifier = declaration.specifiers?.find(
      s =>
        s.type === 'ImportSpecifier' && (s.local ?? s.imported).name === name,
    );
    if (specifier) return { declaration, specifier };
  }
}

// imports are top-level, so this skips walking the whole tree
const importsOf = root =>
  root
    .get()
    .node.program.body.filter(node => node.type === 'ImportDeclaration');

/** Imports `name` next to the import of `sibling` or from an existing import of `source`, else adds an import */
function ensureImport(j, root, name, { sibling, source, type = false }) {
  const imported = importOf(j, root, name);
  if (imported) {
    // a value use of a type-only import: make it a value import
    if (!type) toValueImport(imported.declaration, imported.specifier);
    return;
  }
  const specifier = j.importSpecifier(j.identifier(name));
  const next = sibling && importOf(j, root, sibling);
  if (next) {
    if (type && next.declaration.importKind !== 'type')
      specifier.importKind = 'type';
    next.declaration.specifiers.push(specifier);
    return;
  }
  // a value import can also take a type; a type-only one can become a value import
  const candidates = importsOf(root).filter(
    d =>
      d.source.value === source &&
      (!type || d.importKind === 'type') &&
      d.specifiers.every(s => s.type === 'ImportSpecifier'),
  );
  const existing =
    candidates.find(d => (d.importKind === 'type') === type) ?? candidates[0];
  if (existing) {
    existing.specifiers.push(specifier);
    if (!type) toValueImport(existing, specifier);
    return;
  }
  const declaration = j.importDeclaration([specifier], j.literal(source));
  if (type) declaration.importKind = 'type';
  const { body } = root.get().node.program;
  body.splice(
    body.findLastIndex(node => node.type === 'ImportDeclaration') + 1,
    0,
    declaration,
  );
}

/** Makes `specifier` a value import: `type A` drops its `type`, and `import type { A, B }` becomes
 * `import { A, type B }` */
function toValueImport(declaration, specifier) {
  delete specifier.importKind;
  if (declaration.importKind !== 'type') return;
  declaration.importKind = 'value';
  for (const other of declaration.specifiers)
    if (other !== specifier) other.importKind = 'type';
}

/** Where a file's `Manager` comes from: 'data-client' when imported from `@data-client/*`,
 * 'other' when it may still be one (such as re-exported by a local module), 'local' when declared
 * in the file */
function managerOrigin(j, root) {
  const source = importOf(j, root, 'Manager')?.declaration.source.value;
  if (String(source).startsWith(DATA_CLIENT_PREFIX)) return 'data-client';
  const declaredHere = [
    j.TSInterfaceDeclaration,
    j.TSTypeAliasDeclaration,
    j.ClassDeclaration,
  ].some(type => root.find(type, { id: { name: 'Manager' } }).size());
  return declaredHere ? 'local' : 'other';
}

/** A Manager class without middleware throws on mount since 0.19, so give it a pass-through; mark
 * a class whose Manager comes from elsewhere */
function addPassThroughMiddleware(j, root) {
  let dirty = false;
  let origin;
  [j.ClassDeclaration, j.ClassExpression]
    .flatMap(type => root.find(type).paths())
    .filter(
      ({ node }) =>
        !node.superClass &&
        node.implements?.some(i => isId(i.expression, 'Manager')) &&
        !hasMember(node.body, 'middleware') &&
        !hasMember(node.body, 'getMiddleware'),
    )
    .forEach(cls => {
      // the same for every class in the file
      origin ??= managerOrigin(j, root);
      if (origin === 'other')
        dirty = addTodo(j, cls, PASS_THROUGH_TODO) || dirty;
      if (origin !== 'data-client') return;
      const next = j.identifier('next');
      const property = j.classProperty(
        j.identifier('middleware'),
        j.arrowFunctionExpression([], j.arrowFunctionExpression([next], next)),
        j.tsTypeAnnotation(j.tsTypeReference(j.identifier('Middleware'))),
      );
      cls.node.body.body.unshift(property);
      ensureImport(j, root, 'Middleware', {
        sibling: 'Manager',
        source: '@data-client/react',
        type: true,
      });
      dirty = true;
    });
  return dirty;
}

/** Whether `name` looks like the class `base` (or a subclass named `*${base}`): by name, by the
 * name it was imported as, or by the class a local class extends */
function isManagerClass(j, root, name, base, seen = new Set()) {
  if (!name || seen.has(name)) return false;
  if (name.endsWith(base)) return true;
  seen.add(name);
  const imported = importOf(j, root, name)?.specifier.imported.name;
  if (imported && imported !== name)
    return isManagerClass(j, root, imported, base, seen);
  // `class X extends Y {}` or `const X = class extends Y {}`
  const local =
    root.find(j.ClassDeclaration, { id: { name } }).nodes()[0] ??
    root.find(j.VariableDeclarator, { id: { name } }).nodes()[0]?.init;
  const superClass = local?.superClass;
  return (
    !!superClass && isManagerClass(j, root, nameOf(superClass), base, seen)
  );
}

// the Managers renderDataHook() ran before 0.19, ignoring `managers`
const RENDER_HOOK_DEFAULTS = [
  // [class, names of its constructor arguments]
  ['NetworkManager', []],
  ['SubscriptionManager', ['PollingSubscription']],
];

/** `renderDataHook()` managers replace its defaults since 0.19, so add the defaults they lack: a
 * missing NetworkManager throws, and a missing SubscriptionManager stops polling */
function addDefaultManagers(j, root) {
  let dirty = false;
  root
    .find(j.CallExpression)
    .filter(call => RENDER_HOOK_CALLS.has(calleeName(call.node)))
    .forEach(call => {
      // only the options argument's own `managers`, not a nested one such as initialProps'
      const options = call.get('arguments', 1);
      if (options.node?.type !== 'ObjectExpression') return;
      options.get('properties').each(prop => {
        if (isManagersProperty(prop.node)) addTo(prop);
      });
    });
  return dirty;

  function addTo(prop) {
    let value = prop.node.value;
    // `const managers = () => [...]`, as transformManagers() leaves a variable used only here
    if (value.type === 'Identifier') {
      const declarator = bindingOf(prop.get('value'))?.parent.node;
      value = declarator?.type === 'VariableDeclarator' && declarator.init;
    }
    functionsOf(unwrap(value)).forEach(fn => addToList(unwrap(fn.body)));
  }

  /** the functions a `managers` value can be, through `cond ? () => [...] : undefined` */
  function functionsOf(node) {
    if (!node) return [];
    if (node.type === 'ConditionalExpression')
      return [
        ...functionsOf(unwrap(node.consequent)),
        ...functionsOf(unwrap(node.alternate)),
      ];
    return isFunction(node) ? [node] : [];
  }

  function addToList(list) {
    // only a list of `new` Managers shows which defaults it lacks
    if (
      list?.type !== 'ArrayExpression' ||
      !list.elements.every(e => e?.type === 'NewExpression')
    )
      return;
    for (const [base, args] of RENDER_HOOK_DEFAULTS) {
      if (list.elements.some(e => isManagerClass(j, root, calleeName(e), base)))
        continue;
      list.elements.push(
        j.newExpression(
          j.identifier(base),
          args.map(a => j.identifier(a)),
        ),
      );
      for (const name of [base, ...args])
        ensureImport(j, root, name, { source: '@data-client/react' });
      dirty = true;
    }
  }
}

/** `NetworkManager.cleanupDate` is gone; what replaces it depends on why the code read it */
function markCleanupDate(j, root) {
  const reads = root
    .find(j.MemberExpression)
    .filter(({ node }) => memberName(node) === 'cleanupDate')
    .paths();
  return addTodos(j, reads, CLEANUP_DATE_TODO);
}

// each step only runs on files that mention what it rewrites
function transformManagerClasses(j, root, source) {
  let dirty = false;
  if (source.includes('getMiddleware')) dirty = renameGetMiddleware(j, root);
  if (/\bimplements\b/.test(source))
    dirty = addPassThroughMiddleware(j, root) || dirty;
  if (source.includes('cleanupDate')) dirty = markCleanupDate(j, root) || dirty;
  return dirty;
}

/* globalThis.__DC__ replaces the __DC_CONTROLLERS__ Map of Controllers by store name */

const DC_GLOBAL = '__DC_CONTROLLERS__';
const DC_GLOBAL_TODO = ` TODO(data-client): __DC_CONTROLLERS__ was replaced by __DC__ in 0.19; read __DC__.controller, after setting __DC__.store when the page has several stores: ${BLOG}#dc-global`;

/** `__DC__.<property>` on the same object `__DC_CONTROLLERS__` was read from */
function dcMember(j, dcNode, property) {
  const dc =
    dcNode.type === 'Identifier' ?
      j.identifier('__DC__')
    : j.memberExpression(dcNode.object, j.identifier('__DC__'));
  return j.memberExpression(dc, j.identifier(property));
}

/** Whether `node` calls the member `callee` with no arguments */
const callsWithoutArgs = (node, callee) =>
  node.type === 'CallExpression' &&
  node.callee === callee &&
  !node.arguments.length;

/** Where the Map at `path` is iterated, and the `__DC__` property that replaces it: the first value of
 * `[...map.values()][0]`, `Array.from(map.values())[0]` or `map.values().next().value` is
 * `controller`; `[...map.keys()]` or `Array.from(map.keys())` is `stores` */
function iterationOf(path) {
  const member = path.parent;
  const call = member.parent;
  const method = memberName(member.node);
  if (
    !['values', 'keys'].includes(method) ||
    member.node.object !== path.node ||
    !callsWithoutArgs(call.node, member.node)
  )
    return;
  // `[...call]` or `Array.from(call)`
  const up = call.parent;
  const list =
    (
      up.node.type === 'SpreadElement' &&
      up.parent.node.type === 'ArrayExpression' &&
      up.parent.node.elements.length === 1
    ) ?
      up.parent
    : (
      up.node.type === 'CallExpression' &&
      up.node.arguments.length === 1 &&
      isId(up.node.callee.object, 'Array') &&
      memberName(up.node.callee) === 'from'
    ) ?
      up
    : undefined;
  if (method === 'keys') return list && { path: list, property: 'stores' };
  if (list) {
    const index = list.parent;
    return (
      isMember(index.node) &&
      index.node.object === list.node &&
      index.node.computed &&
      index.node.property.value === 0 && { path: index, property: 'controller' }
    );
  }
  // `call.next().value`
  const next = call.parent;
  const value = next.parent.parent;
  return (
    memberName(next.node) === 'next' &&
    callsWithoutArgs(next.parent.node, next.node) &&
    memberName(value.node) === 'value' &&
    value.node.object === next.parent.node && {
      path: value,
      property: 'controller',
    }
  );
}

// parents that evaluate the child whenever they run, and the children they may run conditionally
const ALWAYS_EVALUATES = {
  ConditionalExpression: ['test'],
  IfStatement: ['test'],
  LogicalExpression: ['left'],
};
const EVALUATES_ALL = new Set([
  'CallExpression',
  'NewExpression',
  'MemberExpression',
  'AwaitExpression',
  'ArrayExpression',
  'ObjectExpression',
  'Property',
  'ObjectProperty',
  'SpreadElement',
  'TemplateLiteral',
  'VariableDeclarator',
  'VariableDeclaration',
  'ExpressionStatement',
  'ReturnStatement',
  'ThrowStatement',
  ...PASS_THROUGH,
]);

/** Whether `statement` always evaluates the expression at `path` when it runs */
function alwaysEvaluated(path, statement) {
  for (; path !== statement; path = path.parent) {
    const { node } = path.parent;
    const always = ALWAYS_EVALUATES[node.type];
    const evaluated =
      always ?
        always.includes(path.name)
      : EVALUATES_ALL.has(node.type) ||
        (node.type === 'AssignmentExpression' && node.operator === '=');
    if (!evaluated || node.optional) return false;
  }
  return true;
}

/** `__DC_CONTROLLERS__.get(name)` becomes `__DC__.controller`, after `__DC__.store = name;` on its own line
 * when it can move there, or else `(__DC__.store = name, __DC__.controller)` */
function selectStore(j, call, dcNode) {
  const [name] = call.node.arguments;
  const select = j.assignmentExpression(
    '=',
    dcMember(j, dcNode, 'store'),
    name,
  );
  const statement = statementOf(j, call);
  // a name with no side effects, in a statement that always reads it (not `flag && ...`), of the same
  // function (`page.evaluate(() => ...)` runs its function elsewhere)
  const canHoist =
    statement &&
    Array.isArray(statement.parentPath.value) &&
    (name.type === 'Identifier' ||
      name.type === 'StringLiteral' ||
      (name.type === 'Literal' && typeof name.value === 'string') ||
      (name.type === 'TemplateLiteral' && !name.expressions.length)) &&
    alwaysEvaluated(call, statement);
  if (!canHoist) {
    call.replace(
      j.sequenceExpression([select, dcMember(j, dcNode, 'controller')]),
    );
    return;
  }
  const line = j.expressionStatement(select);
  // comments above the statement stay above both lines
  const comments = statement.node.comments ?? [];
  line.comments = comments.filter(c => c.leading);
  statement.node.comments = comments.filter(c => !c.leading);
  statement.insertBefore(line);
  call.replace(dcMember(j, dcNode, 'controller'));
}

/** `__DC_CONTROLLERS__.get(name)` reads `__DC__.controller` after picking the store; the first value
 * reads `__DC__.controller` and the keys `__DC__.stores`. Debugging scripts often don't import
 * data-client, so this runs on any file that names the global. */
function migrateDcGlobal(j, root) {
  let dirty = false;
  const marked = [];
  const uses = [
    ...root
      .find(j.Identifier, { name: DC_GLOBAL })
      .filter(p => !isOtherName(p))
      .paths(),
    ...root
      .find(j.MemberExpression)
      .filter(({ node }) => memberName(node) === DC_GLOBAL)
      .paths(),
  ];
  for (const path of uses) {
    const { node } = path;
    const call = path.parent.parent;
    if (
      memberName(path.parent.node) === 'get' &&
      path.parent.node.object === node &&
      call.node.type === 'CallExpression' &&
      call.node.callee === path.parent.node &&
      call.node.arguments.length === 1
    ) {
      selectStore(j, call, node);
      dirty = true;
      continue;
    }
    const iteration = iterationOf(path);
    if (iteration) {
      iteration.path.replace(dcMember(j, node, iteration.property));
      dirty = true;
      continue;
    }
    marked.push(path);
  }
  return addTodos(j, marked, DC_GLOBAL_TODO) || dirty;
}

/* Deprecated APIs: renamed where the replacement does the same thing, marked otherwise */

const DEVTOOLS_RENAMES = new Map([
  ['actionsBlacklist', 'actionsDenylist'],
  ['actionsWhitelist', 'actionsAllowlist'],
]);
const CREATE_TODO = ` TODO(data-client): resource().create is deprecated; use getList.push unless extend() replaces create or getList, and compare endpoints by name, not ===: https://dataclient.io/rest/api/resource#push`;
const WAIT_FOR_NEXT_UPDATE_TODO = ` TODO(data-client): waitForNextUpdate() is deprecated; await waitFor(() => expect(...)) on what the test waits for: https://dataclient.io/docs/api/renderDataHook#waitfor`;
const VUE_WAIT_FOR_NEXT_UPDATE_TODO = ` TODO(data-client): waitForNextUpdate() is deprecated; \`await result\` for the first load, and await allSettled() after changing props or calling the controller: https://dataclient.io/vue/guides/unit-testing-composables#renderdatacompose-api`;
const SHARED_TEST_HELPER_TODO = ` TODO(data-client): renderDataHook.cleanup() and .allSettled() act only on the latest render and are deprecated; use the ones each renderDataHook() call returns: https://dataclient.io/docs/api/renderDataHook#allsettled`;
const CREATE_DATA_CLIENT_TODO = ` TODO(data-client): createDataClient() and ProvidedDataClient are deprecated and will stop being exported; install the plugin with app.use(DataClientPlugin, options) and read the controller with useController(): https://dataclient.io/vue/api/DataClientPlugin`;

/** DevTools options: `new DevToolsManager({...})`, or `getDefaultManagers({ devToolsManager: {...} })` */
function isDevToolsConfig(path) {
  const parent = path.parent.node;
  if (parent.type === 'NewExpression')
    return (
      parent.arguments[0] === path.node &&
      /DevToolsManager$/.test(nameOf(parent.callee) ?? '')
    );
  const call = path.parent.parent?.parent?.node;
  return (
    isProperty(parent) &&
    parent.value === path.node &&
    keyName(parent) === 'devToolsManager' &&
    call !== undefined &&
    isGetDefaultManagersCall(call)
  );
}

/** `actionsBlacklist` -> `actionsDenylist` in DevTools options, unless they already have the new name */
function renameDevToolsOptions(j, root) {
  let dirty = false;
  root
    .find(j.ObjectExpression)
    .filter(isDevToolsConfig)
    .forEach(({ node }) => {
      // a spread or computed key may hold the new name
      if (!node.properties.every(hasStaticKey)) return;
      const keys = new Set(node.properties.map(keyName));
      for (const prop of node.properties) {
        if (prop.computed) continue;
        const renamed = DEVTOOLS_RENAMES.get(keyName(prop));
        if (!renamed || keys.has(renamed)) continue;
        // `{ actionsBlacklist }` shorthand keeps its value under the new key
        prop.shorthand = false;
        prop.key = j.identifier(renamed);
        dirty = true;
      }
    });
  return dirty;
}

/** The path under `as`, `!` and parentheses */
function unwrapPath(path) {
  while (PASS_THROUGH.has(path.node?.type)) path = path.get('expression');
  return path;
}

/** Whether `path` is an identifier bound to an import of `name` from `source` */
function isImportOf(path, name, source) {
  const specifier = bindingOf(path)?.parent;
  return (
    specifier?.node.type === 'ImportSpecifier' &&
    (specifier.node.imported?.name ?? specifier.node.imported?.value) ===
      name &&
    specifier.parent.node.source.value === source
  );
}

// a custom Endpoint class, or a key() that may read this.name (create is `Post.create`, getList.push is
// `Post.getList.create`), makes create differ from getList.push
const RESOURCE_UNSAFE_OPTIONS = new Set(['Endpoint', 'key']);

// an extend() that replaces one of these makes create differ from getList.push
const CREATE_SOURCES = new Set(['create', 'getList']);

/** Whether `p` is a property with a known name; a spread or computed key could be any */
const hasStaticKey = p => isProperty(p) && keyName(p) !== undefined;

/** Whether every key of `object` is a known name outside `names` */
const hasOnlyKeysOutside = (object, names) =>
  object.properties.every(p => hasStaticKey(p) && !names.has(keyName(p)));

/** Whether `path` is a `resource({...})` call from @data-client/rest, through `.extend()` calls that keep
 * `create` the same request as `getList.push`; an `extend()` that replaces either, or might, makes them
 * differ, and so can a custom `Endpoint` class */
function isPlainResource(path) {
  path = unwrapPath(path);
  while (
    path.node?.type === 'CallExpression' &&
    memberName(path.node.callee) === 'extend'
  ) {
    const [first] = path.node.arguments;
    if (first?.type === 'StringLiteral' || first?.type === 'Literal') {
      if (CREATE_SOURCES.has(first.value)) return false;
    } else if (first?.type === 'ObjectExpression') {
      if (!hasOnlyKeysOutside(first, CREATE_SOURCES)) return false;
    } else return false;
    path = unwrapPath(path.get('callee', 'object'));
  }
  const [options] = path.node?.arguments ?? [];
  return (
    path.node?.type === 'CallExpression' &&
    path.node.callee.type === 'Identifier' &&
    isImportOf(path.get('callee'), 'resource', '@data-client/rest') &&
    options?.type === 'ObjectExpression' &&
    hasOnlyKeysOutside(options, RESOURCE_UNSAFE_OPTIONS)
  );
}

/** The outermost member of `X.a.b`, starting at the identifier `X` */
function memberChainOf(path) {
  while (isMember(path.parent.node) && path.parent.node.object === path.node)
    path = path.parent;
  return path;
}

const PATTERNS = new Set(['ArrayPattern', 'ObjectPattern', 'RestElement']);

/** Whether the expression at `path` is written: assigned (also by destructuring or a for-of/in loop),
 * incremented or deleted */
function isWriteTarget(path) {
  const parent = path.parent.node;
  const holder = isProperty(parent) ? path.parent.parent.node : parent;
  return (
    PATTERNS.has(holder.type) ||
    ((parent.type === 'AssignmentExpression' ||
      parent.type === 'AssignmentPattern' ||
      parent.type === 'ForOfStatement' ||
      parent.type === 'ForInStatement') &&
      parent.left === path.node) ||
    parent.type === 'UpdateExpression' ||
    (parent.type === 'UnaryExpression' && parent.operator === 'delete')
  );
}

/** Whether a `const` resource declared here is a plain `resource()`, and this file only reads its members.
 * Other modules could change an exported one, but they would have to write to an import. */
const isReadOnlyResource = (j, root, binding) =>
  isPlainResourceDeclarator(binding) &&
  binding.parent.parent.node.kind === 'const' &&
  readsOnly(j, root, binding);

/** Whether every use of a resource reads its members without writing them, passing the resource on, or
 * letting `create` or `getList` escape, so they stay what its declaration made them */
function readsOnly(j, root, binding) {
  return usesOf(j, root, binding).every(p => {
    const parent = p.parent.node;
    // `typeof X` in a type or `export { X }`
    if (['TSTypeQuery', 'ExportSpecifier'].includes(parent.type)) return true;
    return (
      isMember(parent) &&
      parent.object === p.node &&
      !parent.computed &&
      !isWriteTarget(memberChainOf(p)) &&
      !escapes(p.parentPath)
    );
  });
}

// parsed modules by file, so each is read once per run
const modules = new Map();

function parseModule(j, file) {
  if (!modules.has(file)) {
    let root = null;
    try {
      root = j(fs.readFileSync(file, 'utf8'));
    } catch {
      // unreadable or unparsable: treat as unknown
    }
    modules.set(file, root);
  }
  return modules.get(file);
}

/** Whether the module `file` exports `name` as a plain `resource()` that it only reads, following
 * `export { name } from` and `export * from` */
function exportsPlainResource(j, file, name, depth = 0) {
  const root = file && depth < 5 && parseModule(j, file);
  if (!root) return false;
  const { body } = root.get().node.program;
  for (const node of body) {
    if (node.type !== 'ExportNamedDeclaration' || node.exportKind === 'type')
      continue;
    const declared = node.declaration?.declarations?.some(d =>
      isId(d.id, name),
    );
    if (declared) return isLocalPlainResource(j, root, name);
    const specifier = node.specifiers?.find(
      s => staticName(s.exported) === name,
    );
    if (!specifier) continue;
    const local = specifier.local?.name ?? name;
    return node.source ?
        exportsPlainResource(
          j,
          resolveModule(file, node.source.value),
          local,
          depth + 1,
        )
      : isLocalPlainResource(j, root, local);
  }
  // a module's own exports win over `export *`
  return body.some(
    node =>
      node.type === 'ExportAllDeclaration' &&
      !node.exported &&
      exportsPlainResource(
        j,
        resolveModule(file, node.source.value),
        name,
        depth + 1,
      ),
  );
}

/** Whether a module's top-level `const name` is a plain `resource()` that the module only reads */
function isLocalPlainResource(j, root, name) {
  const declarator = root
    .find(j.VariableDeclarator, { id: { name } })
    .filter(d =>
      ['Program', 'ExportNamedDeclaration'].includes(d.parent.parent.node.type),
    )
    .paths()[0];
  return !!declarator && isReadOnlyResource(j, root, declarator.get('id'));
}

/** Whether `binding` imports a plain `resource()` from a relative or tsconfig-aliased module, and this file
 * only reads it */
function isImportedPlainResource(j, root, binding, file) {
  const specifier = binding.parent;
  const declaration = specifier.parent?.node;
  if (
    specifier.node.type !== 'ImportSpecifier' ||
    specifier.node.importKind === 'type' ||
    declaration.importKind === 'type'
  )
    return false;
  const imported = specifier.node.imported;
  return (
    readsOnly(j, root, binding) &&
    exportsPlainResource(
      j,
      file && resolveModule(file, declaration.source.value),
      staticName(imported),
    )
  );
}

/** Whether `X.create` or `X.getList` at `path` goes somewhere that could change it, like `Object.assign()` or an alias */
function escapes(path) {
  if (!CREATE_SOURCES.has(memberName(path.node))) return false;
  const use = path.parent.node;
  return !(
    (isMember(use) && use.object === path.node) ||
    use.type === 'BinaryExpression' ||
    isRun(path)
  );
}

// calls whose first argument picks an endpoint to run, so a new endpoint object there runs the same
const ENDPOINT_RUNNERS = new Set([
  'fetch',
  'useFetch',
  'useSuspense',
  'useDLE',
  'useCache',
  'useLive',
  'useSubscription',
]);

/** Whether the endpoint at `path` is run (called, or passed to fetch() or a data hook), where a new endpoint
 * object behaves the same; elsewhere code may compare it by identity, which getList.push breaks */
function isRun(path) {
  const parent = path.parent.node;
  return (
    (parent.type === 'CallExpression' ||
      parent.type === 'OptionalCallExpression') &&
    (parent.callee === path.node ||
      (parent.arguments[0] === path.node &&
        ENDPOINT_RUNNERS.has(calleeName(parent))))
  );
}

/** `Resource.create` -> `Resource.getList.push` where it runs, for a `resource()` declared in this file and
 * never changed; other `*Resource.create` get a TODO */
function migrateResourceCreate(j, root, file) {
  let dirty = false;
  const marked = [];
  const readOnly = new Map();
  root
    .find(j.MemberExpression, { object: { type: 'Identifier' } })
    .filter(({ node }) => !node.computed && memberName(node) === 'create')
    .forEach(path => {
      const binding = bindingOf(path.get('object'));
      const declaration = binding?.parent.node;
      // a class or function declared here is not a resource
      if (
        binding &&
        declaration.id === binding.node &&
        declaration.type !== 'VariableDeclarator'
      )
        return;
      if (binding && !readOnly.has(binding))
        readOnly.set(
          binding,
          isReadOnlyResource(j, root, binding) ||
            isImportedPlainResource(j, root, binding, file),
        );
      if (readOnly.get(binding) && isRun(path)) {
        path.node.object = j.memberExpression(
          path.node.object,
          j.identifier('getList'),
        );
        path.node.property = j.identifier('push');
        dirty = true;
      } else if (
        isPlainResourceDeclarator(binding) ||
        /Resource$/.test(path.node.object.name)
      ) {
        marked.push(path);
      }
    });
  return addTodos(j, marked, CREATE_TODO) || dirty;
}

const isPlainResourceDeclarator = binding =>
  binding?.parent.node.type === 'VariableDeclarator' &&
  isPlainResource(binding.parent.get('init'));

/** Shared `renderDataHook.cleanup()` / `.allSettled()`, which act only on the latest render */
const findSharedTestHelpers = (j, root) =>
  root
    .find(j.MemberExpression)
    .filter(
      ({ node }) =>
        ['cleanup', 'allSettled'].includes(memberName(node)) &&
        RENDER_HOOK_CALLS.has(nameOf(node.object)),
    )
    .paths();

/** `createDataClient` / `ProvidedDataClient` imported from @data-client/vue, outside the import */
const findVueSetup = (j, root) =>
  root
    .find(j.Identifier)
    .filter(
      p =>
        ['createDataClient', 'ProvidedDataClient'].includes(p.node.name) &&
        !isOtherName(p) &&
        p.parent.node.type !== 'ImportSpecifier' &&
        isImportOf(p, p.node.name, '@data-client/vue'),
    )
    .paths();

const RENDER_CALLS = new Set([...RENDER_HOOK_CALLS, 'renderDataCompose']);

/** The name of the call whose result `waitForNextUpdate` at `path` comes from: `render(...).waitForNextUpdate`,
 * `result.waitForNextUpdate` or `const { waitForNextUpdate } = render(...)`, awaited or not */
function sourceCallOf(path) {
  // `let hook;` has no init
  if (!path.node) return undefined;
  if (path.node.type === 'CallExpression') return calleeName(path.node);
  if (path.node.type === 'AwaitExpression')
    return sourceCallOf(path.get('argument'));
  const binding = path.node.type === 'Identifier' ? bindingOf(path) : undefined;
  // a destructured name's binding sits in an ObjectPattern property
  const declarator =
    isProperty(binding?.parent.node) ?
      binding.parent.parent.parent
    : binding?.parent;
  return declarator?.node.type === 'VariableDeclarator' ?
      sourceCallOf(declarator.get('init'))
    : undefined;
}

/** `waitForNextUpdate()` calls from data-client's render helpers (other test libraries have one too), by
 * the helper they come from */
const findWaitForNextUpdate = (j, root) =>
  root
    .find(j.CallExpression)
    .filter(({ node }) => calleeName(node) === 'waitForNextUpdate')
    .paths()
    .map(path => {
      const callee = path.get('callee');
      return {
        path,
        render: sourceCallOf(
          isMember(callee.node) ? callee.get('object') : callee,
        ),
      };
    })
    .filter(({ render }) => RENDER_CALLS.has(render));

/** The `{ ... }` property a destructured name at `path` is bound by, if any */
function destructuredBy(path) {
  const binding = path.node.type === 'Identifier' ? bindingOf(path) : undefined;
  const property = binding?.parent;
  return (
      isProperty(property?.node) &&
        property.node.value === binding.node &&
        property.parent.node.type === 'ObjectPattern'
    ) ?
      property
    : undefined;
}

/** Renames every reference to the variable `binding` declares */
function renameRefs(j, root, binding, name) {
  usesOf(j, root, binding).forEach(ref => {
    ref.node.name = name;
  });
}

/** `const { waitForNextUpdate } = await renderDataCompose(...)` destructures `allSettled` instead;
 * returns whether it could */
function destructureAllSettled(j, root, property) {
  const pattern = property.parent.node;
  const binding = property.get('value');
  const existing = pattern.properties.find(
    p =>
      isProperty(p) &&
      keyName(p) === 'allSettled' &&
      p.value.type === 'Identifier',
  );
  if (existing) {
    renameRefs(j, root, binding, existing.value.name);
    pattern.properties = pattern.properties.filter(p => p !== property.node);
    return true;
  }
  if (!property.node.shorthand) {
    property.node.key = j.identifier('allSettled');
    return true;
  }
  // a visible `allSettled` would be shadowed
  if (property.scope.lookup('allSettled')) return false;
  renameRefs(j, root, binding, 'allSettled');
  property.node.key = j.identifier('allSettled');
  property.node.value = j.identifier('allSettled');
  return true;
}

/** Drops `await allSettled()` right after the render when the next statement awaits its `result`: the
 * first load needs only `await result`. `declarator` holds the render result: `{ result, allSettled }` or
 * `rendered` */
function dropFirstLoadWait(j, call, declarator) {
  const statement = call.parent.parent;
  if (
    call.parent.node.type !== 'AwaitExpression' ||
    statement.node.type !== 'ExpressionStatement' ||
    !Array.isArray(statement.parentPath.value)
  )
    return;
  const siblings = statement.parentPath.value;
  const index = siblings.indexOf(statement.node);
  const [before, after] = [siblings[index - 1], siblings[index + 1]];
  if (
    !after ||
    before?.type !== 'VariableDeclaration' ||
    !before.declarations.includes(declarator?.node)
  )
    return;
  const { id } = declarator.node;
  const destructured = id.type === 'ObjectPattern';
  const valueOf = key =>
    id.properties.find(p => isProperty(p) && keyName(p) === key)?.value;
  const result = destructured ? valueOf('result') : id;
  const awaitsResult =
    result?.type === 'Identifier' &&
    j(after)
      .find(j.AwaitExpression)
      .some(({ node }) => {
        const value = unwrap(node.argument);
        return destructured ?
            isId(value, result.name)
          : memberName(value) === 'result' && isId(value.object, result.name);
      });
  if (!awaitsResult) return;
  statement.prune();
  if (!destructured) return;
  // drop `allSettled` from the pattern if nothing else calls it
  const allSettled = valueOf('allSettled');
  const scope = declarator.scope.path;
  const calls = j(scope)
    .find(j.Identifier, { name: allSettled.name })
    .filter(p => p.node !== allSettled && !isOtherName(p));
  if (!calls.size())
    id.properties = id.properties.filter(p => p.value !== allSettled);
}

/** Vue `waitForNextUpdate()` becomes `allSettled()`, which also waits for fetches, with no time limit;
 * returns the calls it could not convert */
function waitForAllSettled(j, root, calls) {
  const unconverted = [];
  // read every binding before renaming any, since scopes keep the names they first saw
  const plans = calls.map(call => {
    const callee = call.get('callee');
    return isMember(callee.node) ?
        { call, declarator: bindingOf(callee.get('object'))?.parent }
      : { call, property: destructuredBy(callee) };
  });
  const converted = new Map();
  for (const { call, declarator, property } of plans) {
    if (declarator) {
      const { callee } = call.node;
      callee.property = j.identifier('allSettled');
      callee.computed = false;
      dropFirstLoadWait(j, call, declarator);
      continue;
    }
    if (!property) {
      unconverted.push(call);
      continue;
    }
    // keyed by path: removing the property clears its node
    if (!converted.has(property))
      converted.set(property, destructureAllSettled(j, root, property));
    if (converted.get(property))
      dropFirstLoadWait(j, call, property.parent.parent);
    else unconverted.push(call);
  }
  return unconverted;
}

const PK_ARGS_TODO = ` TODO(data-client): a future release types Entity.pk() args as readonly any[]; make this parameter readonly: ${BLOG}#future-pk-args`;
const MUTATING_ARRAY_METHODS = new Set([
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse',
  'fill',
  'copyWithin',
]);

/** The readonly form of an array type: `any[]` -> `readonly any[]`, `Array<T>` -> `ReadonlyArray<T>`,
 * through unions; undefined when nothing changes */
function readonlyType(j, type) {
  if (type.type === 'TSArrayType')
    return j.tsTypeOperator.from({
      operator: 'readonly',
      typeAnnotation: type,
    });
  if (type.type === 'TSTypeReference' && isId(type.typeName, 'Array'))
    return j.tsTypeReference(
      j.identifier('ReadonlyArray'),
      type.typeParameters ?? null,
    );
  if (type.type === 'TSUnionType') {
    const types = type.types.map(t => readonlyType(j, t));
    if (!types.some(Boolean)) return;
    return j.tsUnionType(types.map((t, i) => t ?? type.types[i]));
  }
}

/** Whether the parameter at `param` is only read: indexed, a non-mutating method called on it, spread,
 * or passed to `super.pk()` */
function onlyReadsArray(j, method, param) {
  if (!method.node.body) return true;
  return usesOf(j, j(method.get('body')), param).every(p => {
    const parent = p.parent.node;
    if (isMember(parent) && parent.object === p.node)
      return (
        !MUTATING_ARRAY_METHODS.has(memberName(parent)) &&
        !isWriteTarget(p.parent)
      );
    return (
      parent.type === 'SpreadElement' ||
      (parent.type === 'CallExpression' &&
        parent.callee.object?.type === 'Super' &&
        memberName(parent.callee) === 'pk')
    );
  });
}

/** `static pk(value, parent, key, args?: any[])` overrides type `args` readonly, as Entity.pk() will
 * require */
function readonlyPkArgs(j, root) {
  const marked = [];
  let dirty = false;
  root
    .find(j.Node)
    .filter(
      ({ node, parent }) =>
        (node.type === 'ClassMethod' || node.type === 'TSDeclareMethod') &&
        node.static &&
        keyName(node) === 'pk' &&
        !!parent.parent.node.superClass,
    )
    .forEach(method => {
      const arg = method.get('params', 3);
      const param =
        arg.node?.type === 'AssignmentPattern' ? arg.get('left') : arg;
      const annotation = param.node?.typeAnnotation;
      const type = annotation && readonlyType(j, annotation.typeAnnotation);
      if (!type) return;
      if (!onlyReadsArray(j, method, param)) {
        marked.push(method);
        return;
      }
      annotation.typeAnnotation = type;
      dirty = true;
    });
  return addTodos(j, marked, PK_ARGS_TODO) || dirty;
}

const DEVTOOLS_NAMES = /actions(Black|White)list/;
const CREATE_NAME = /\.create\b/;
const TEST_HELPER_NAMES = /\.(cleanup|allSettled)\b/;
const VUE_SETUP_NAMES = /createDataClient|ProvidedDataClient/;
const WAIT_FOR_NEXT_UPDATE_NAME = /waitForNextUpdate/;
const PK_NAME = /\bstatic\s+pk\b/;
const DEPRECATED_NAMES = [
  PK_NAME,
  DEVTOOLS_NAMES,
  CREATE_NAME,
  TEST_HELPER_NAMES,
  VUE_SETUP_NAMES,
  WAIT_FOR_NEXT_UPDATE_NAME,
];

function migrateDeprecations(j, root, { source, path: file }) {
  let dirty = false;
  if (DEVTOOLS_NAMES.test(source)) dirty = renameDevToolsOptions(j, root);
  if (CREATE_NAME.test(source))
    dirty = migrateResourceCreate(j, root, file) || dirty;
  if (PK_NAME.test(source)) dirty = readonlyPkArgs(j, root) || dirty;
  if (TEST_HELPER_NAMES.test(source))
    dirty =
      addTodos(j, findSharedTestHelpers(j, root), SHARED_TEST_HELPER_TODO) ||
      dirty;
  if (VUE_SETUP_NAMES.test(source))
    dirty =
      addTodos(j, findVueSetup(j, root), CREATE_DATA_CLIENT_TODO) || dirty;
  if (WAIT_FOR_NEXT_UPDATE_NAME.test(source)) {
    const calls = findWaitForNextUpdate(j, root);
    const [vue, react] = [true, false].map(isVue =>
      calls
        .filter(({ render }) => (render === 'renderDataCompose') === isVue)
        .map(({ path }) => path),
    );
    const unconverted = waitForAllSettled(j, root, vue);
    dirty =
      [
        unconverted.length < vue.length,
        addTodos(j, react, WAIT_FOR_NEXT_UPDATE_TODO),
        addTodos(j, unconverted, VUE_WAIT_FOR_NEXT_UPDATE_TODO),
      ].some(Boolean) || dirty;
  }
  return dirty;
}

/** `--deprecations=false` skips moving off deprecated APIs; `--deprecations=only` does just that */
function passesFor(options) {
  // jscodeshift parses `--deprecations=false` to a boolean
  const deprecations = options?.deprecations ?? true;
  if (![true, false, 'only'].includes(deprecations))
    throw new Error(
      `--deprecations must be false or only, not ${JSON.stringify(deprecations)}`,
    );
  return {
    breaking: deprecations !== 'only',
    deprecations: deprecations !== false,
  };
}

module.exports = function transformer(fileInfo, api, options) {
  const passes = passesFor(options);
  const names = [
    ...(passes.breaking ? [NAMES] : []),
    ...(passes.deprecations ? DEPRECATED_NAMES : []),
  ];
  // debugging scripts that read the global often don't import data-client
  const dcGlobal = passes.breaking && fileInfo.source.includes(DC_GLOBAL);
  // skip parsing files that have nothing to migrate
  if (
    !dcGlobal &&
    (!fileInfo.source.includes(DATA_CLIENT_PREFIX) ||
      !names.some(name => name.test(fileInfo.source)))
  )
    return fileInfo.source;
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  let dirty = dcGlobal && migrateDcGlobal(j, root);
  const hasDataClientImport = importsOf(root).some(d =>
    String(d.source.value).startsWith(DATA_CLIENT_PREFIX),
  );
  if (!hasDataClientImport) return printIf(dirty, root, fileInfo.source);

  if (passes.breaking) {
    dirty = transformManagers(j, root) || dirty;
    if (/renderData(Hook|Client)/.test(fileInfo.source))
      dirty = addDefaultManagers(j, root) || dirty;
    dirty = transformInitManager(j, root) || dirty;
    dirty = transformManagerClasses(j, root, fileInfo.source) || dirty;
    dirty = transformFetchIfStale(j, root, fileInfo.source) || dirty;
    if (fileInfo.source.includes('.catch('))
      dirty = dropNoopCatches(j, root) || dirty;
    if (fileInfo.source.includes('fetchedAt'))
      dirty = passFetchedAt(j, root) || dirty;
  }
  if (passes.deprecations)
    dirty = migrateDeprecations(j, root, fileInfo) || dirty;
  return printIf(dirty, root, fileInfo.source);
};

// recast wraps a reprinted line longer than wrapColumn, reformatting code the codemod only extended
const printIf = (dirty, root, source) =>
  dirty ? root.toSource({ quote: 'single', wrapColumn: Infinity }) : source;

module.exports.parser = 'tsx';
