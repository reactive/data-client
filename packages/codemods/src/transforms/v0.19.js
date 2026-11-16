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
 *        `renderDataCompose()`'s `waitForNextUpdate()` becomes `allSettled()`; right after the render,
 *        it is dropped before a statement that first awaits `result`, or becomes `await result` before one
 *        that awaits it later; `static pk()` overrides type `args` as `readonly any[]`.
 *      - Other `*Resource.create`, React `waitForNextUpdate()`, `renderDataHook.cleanup()`/
 *        `.allSettled()` and Vue `createDataClient()` get a `// TODO(data-client):` comment.
 *
 *   9. Optional improvements that adopt 0.19 features (only with `--improvements`):
 *      - A `for...of`, `forEach()`, or unused `rows.map()` or `Promise.all(rows.map())` that calls `ctrl.set()` once per
 *        row becomes one batch `set()`: `ctrl.set(Ticker, args, row)` becomes `ctrl.set([Ticker], rows)`.
 *        Only where it writes the same rows: the receiver is a Controller, `rows` is an array, each value is
 *        row data rather than an updater function, and the Entity (and its nested Entities) is a class this
 *        file or a relative module declares whose pk() and process() read only what a batch passes them and
 *        that doesn't override validate().
 *      - `ctrl.set([new Invalidate(E)], [row])` becomes `ctrl.set(new Invalidate(E), row)`.
 *      - Vue: `gcPolicy: new GCPolicy()` is dropped from `DataClientPlugin`'s options, the default;
 *        `GCPolicy` is imported from `@data-client/vue` instead of `@data-client/core`; and
 *        `computed(() => args)` passed to a composable becomes the getter `() => args`.
 *      - `|| typeof data === 'symbol'` is dropped where `data` is React `useCache()` or `useDLE()` data.
 *
 * Usage:
 *   npx @data-client/codemods v0.19 src/
 *   npx @data-client/codemods v0.19 src/ --deprecations=false  # skip section 8
 *   npx @data-client/codemods v0.19 src/ --deprecations=only   # just section 8
 *   npx @data-client/codemods v0.19 src/ --improvements=only   # just section 9
 */

const DATA_CLIENT_PREFIX = '@data-client/';
// every rewrite outside the deprecated APIs needs one of these names in the file
const NAMES =
  /managers|initManager|prepareStore|createPersistedStore|fetchIfStale|getMiddleware|cleanupDate|\bManager\b|fetchedAt|\.catch\(/;
const BLOG = 'https://dataclient.io/blog/2026/11/17/v0.19-batch-set';
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

/** The binding path (`id` of its declaration) that `name` refers to at `path`, if declared in this file */
function bindingAt(path, name) {
  // ast-types puts block-scoped names in the function's scope, so pick the declaration in the innermost
  // block that holds `path`, or look further out when none does
  for (
    let scope = path.scope?.lookup(name);
    scope;
    scope = scope.parent?.lookup(name)
  ) {
    const bindings = scope.getBindings()[name];
    const blocks = bindings.map(declaringBlock);
    for (let p = path; p; p = p.parent) {
      const i = blocks.indexOf(p.node);
      if (i !== -1) return bindings[i];
    }
  }
}

/** The binding path (`id` of its declaration) for an identifier, if declared in this file */
const bindingOf = path => bindingAt(path, path.node.name);

/** Whether the identifier at `path` names a variable this file declares, other than an ambient
 * `declare var` or `declare global` one, which describes a global */
function isLocalName(path) {
  const binding = bindingOf(path);
  if (!binding) return false;
  for (let p = binding; p; p = p.parent)
    if (p.node.declare || p.node.type === 'TSModuleDeclaration') return false;
  return true;
}

/** Whether `node` is `path`'s node or one of its ancestors */
function isWithin(path, node) {
  for (let p = path; p; p = p.parent) if (p.node === node) return true;
  return false;
}

const BLOCKS = new Set([
  'BlockStatement',
  'Program',
  'SwitchCase',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'CatchClause',
]);

const PATTERN_PARTS = new Set([
  'Property',
  'ObjectProperty',
  'ObjectPattern',
  'ArrayPattern',
  'AssignmentPattern',
  'RestElement',
]);

/** The node a declaration's name is visible in: its block for `let`, `const`, a class or a function
 * declaration, else its function or the module */
function declaringBlock(binding) {
  let owner = binding.parent;
  while (PATTERN_PARTS.has(owner.node.type)) owner = owner.parent;
  const { type } = owner.node;
  const blockScoped =
    (type === 'VariableDeclarator' && owner.parent.node.kind !== 'var') ||
    ((type === 'FunctionDeclaration' || type === 'ClassDeclaration') &&
      owner.node.id === binding.node);
  // a parameter is visible in its own function
  if (/Function/.test(type) && owner.node.id !== binding.node)
    return owner.node;
  for (let path = owner.parent; path; path = path.parent) {
    const t = path.node.type;
    if (/Function/.test(t) || t === 'Program' || (blockScoped && BLOCKS.has(t)))
      return path.node;
  }
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

/** `const x = ctrl.fetchIfStale(...)` declarators, or with `anyKind` also `let` and `var` ones */
const findFetchIfStaleConsts = (j, root, anyKind = false) =>
  root
    .find(j.VariableDeclarator, { id: { type: 'Identifier' } })
    .filter(
      decl =>
        (anyKind || decl.parent.node.kind === 'const') &&
        isFetchIfStaleCall(unwrap(decl.node.init)),
    )
    .paths();

/** The identifiers in `path` (default: the declaration's scope) that read the variable `decl` declares */
const refsTo = (j, decl, path = decl.scope.path) =>
  usesOf(j, j(path), decl.get('id')).paths();

/** Paths that use a `fetchIfStale()` result as the data: the call itself, or a variable holding it */
function findSyncReads(j, root) {
  const reads = root
    .find(j.CallExpression)
    .filter(call => isFetchIfStaleCall(call.node) && readsSynchronously(call))
    .paths();
  for (const decl of findFetchIfStaleConsts(j, root, true))
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

/** Whether `branch` waits for the Promise `decl` holds (`await x` or `x.then()`), and, with `uses`, also
 * reads the data it resolves to (`(await x).title`, not a bare `await x;`, or `x.then(cb)`) */
function awaits(j, branch, decl, uses) {
  return refsTo(j, decl, branch).some(ref => {
    const parent = ref.parent.node;
    if (parent.type === 'AwaitExpression' && parent.argument === ref.node)
      return (
        !uses ||
        outerPath(ref.parent).parent.node.type !== 'ExpressionStatement'
      );
    return (
      isMember(parent) &&
      parent.object === ref.node &&
      isPromiseMethodCall(ref.parent) &&
      (!uses ||
        (memberName(parent) === 'then' &&
          ref.parent.parent.node.arguments.length > 0))
    );
  });
}

const JUMPS = new Set([
  'ReturnStatement',
  'ThrowStatement',
  'BreakStatement',
  'ContinueStatement',
]);

/** Whether control never runs past the end of `statements`: the last one returns, throws, breaks or
 * continues, directly or as the last statement of a nested block */
function endsAbruptly(statements) {
  const last = statements.at(-1);
  return last?.type === 'BlockStatement' ?
      endsAbruptly(last.body)
    : JUMPS.has(last?.type);
}

/** Whether a branch ends abruptly, so code after its `if` was the other branch too */
const endsEarly = branch => endsAbruptly([branch]);

/** Whether `statements` can move into the block around `path` without their declarations clashing with
 * names already visible there */
function canInline(j, path, statements) {
  // names read beside the check may be globals, which a declaration moved out of the branch would shadow
  let beside;
  const readBeside = name => {
    beside ??= new Set(
      path.parentPath.value
        .filter(node => node !== path.node)
        .flatMap(node =>
          j(node)
            .find(j.Identifier)
            .nodes()
            .map(id => id.name),
        ),
    );
    return beside.has(name);
  };
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
        (!scope ||
          (scope === path.scope &&
            scope.getBindings()[id.name].length === 1 &&
            !path.scope.parent?.lookup(id.name))) &&
        !readBeside(id.name)
      );
    });
  });
}

/** Replaces the `if` or `?:` at `path` with the branch at `branchPath` */
function keepBranch(j, path, branchPath) {
  const branch = branchPath.node;
  if (path.node.type === 'ConditionalExpression') {
    path.replace(branch);
    return;
  }
  const statements = branch.type === 'BlockStatement' ? branch.body : [branch];
  const replacement =
    Array.isArray(path.parentPath.value) && canInline(j, path, statements) ?
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
    const other = path.node[check.negated ? 'consequent' : 'alternate'];
    if (!branch.node) continue;
    // keep a branch that only waits when the other did nothing, and otherwise only one that also reads
    // the data, so nothing the other branch did with it disappears
    const otherEmpty =
      (!other && !endsEarly(branch.node)) ||
      (other?.type === 'BlockStatement' && !other.body.length);
    if (!awaits(j, branch, decl, !otherEmpty)) continue;
    keepBranch(j, path, branch);
    dirty = true;
  }
  return dirty;
}

const FALLBACK_TODO =
  ' TODO(data-client): an awaited fetchIfStale() rejects, instead of resolving undefined, when the latest ' +
  `fetch failed since 0.19; handle that case in .catch() or try/catch: ${BLOG}#fetch-if-stale-promise`;

/** Whether the value at `path` is checked for a missing result: `x ?? fallback`, `x && x.id`, `!x`,
 * `x == null`, `x?.id` */
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
    case 'MemberExpression':
    case 'OptionalMemberExpression':
      return parent.object === node && !!parent.optional;
    case 'CallExpression':
    case 'OptionalCallExpression':
      return parent.callee === node && !!parent.optional;
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
    .forEach(awaited => marked.push(...missingChecks(j, awaited)));
  return addTodos(j, marked, FALLBACK_TODO);
}

/** The places that check the value at `path`, or the `const` holding it, for a missing result */
function missingChecks(j, path) {
  const found = checksMissing(path) ? [path] : [];
  const outer = outerPath(path);
  const decl = outer.parent;
  if (
    decl.node.type === 'VariableDeclarator' &&
    decl.node.init === outer.node &&
    decl.node.id.type === 'Identifier'
  )
    found.push(...refsTo(j, decl).filter(checksMissing));
  return found;
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
  const returns = j(fn.body)
    .find(j.ReturnStatement)
    .filter(({ node }) => !nested.has(node))
    .nodes();
  // a bare `return;` or running off the end returns undefined, so make every path a Promise with `async`
  if (
    returns.some(node => !node.argument) ||
    fn.body.body.at(-1)?.type !== 'ReturnStatement'
  ) {
    fn.async = true;
    return true;
  }
  let dirty = false;
  for (const node of returns) {
    if (isPromiseValue(unwrap(node.argument))) continue;
    node.argument = wrap(node.argument);
    dirty = true;
  }
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

/** Whether `path` reads `get`, `getList` or `getList.getPage` of a resource that keeps it a read: a plain
 * `resource()` declared or imported here whose `extend()` doesn't replace it. An undeclared `*Resource`
 * (a test's, say) counts by its name. */
function isResourceRead(j, root, path, file) {
  path = path.node && unwrapPath(path);
  if (
    memberName(path?.node) === 'getPage' &&
    memberName(path.node.object) === 'getList'
  )
    path = path.get('object');
  const node = path?.node;
  if (
    !isMember(node) ||
    node.computed ||
    !RESOURCE_READS.has(memberName(node)) ||
    node.object.type !== 'Identifier' ||
    !/Resource$/.test(node.object.name)
  )
    return false;
  const binding = bindingOf(path.get('object'));
  if (!binding) return true;
  const replaced = new Set([memberName(node)]);
  return isPlainResourceBinding(j, root, binding, file, replaced);
}

/** Whether the call at `path` starts a read that can't reject unhandled: any `fetchIfStale()`, or `fetch()`
 * of a resource read. `fetch` named alone is `const { fetch } = useController()`, since the global
 * fetch() takes a URL. */
const isPrehandledRead = (j, root, path, file) =>
  isFetchIfStaleCall(path.node) ||
  (path.node.type === 'CallExpression' &&
    calleeName(path.node) === 'fetch' &&
    isResourceRead(j, root, path.get('arguments', 0), file));

/** Whether nothing uses the value at `path`: a statement of its own, `void`, or the body of a JSX event
 * handler, whose return value React ignores */
function isUnused(path) {
  const parent = path.parent.node;
  if (parent.type === 'ExpressionStatement') return true;
  if (parent.type === 'UnaryExpression' && parent.operator === 'void')
    return true;
  const container = path.parent.parent?.node;
  const attribute = path.parent.parent.parent?.node;
  const element = path.parent.parent.parent.parent?.node;
  // an async handler returns a new Promise, and a component may await what its handler returns
  return (
    parent.type === 'ArrowFunctionExpression' &&
    !parent.async &&
    parent.body === path.node &&
    container?.type === 'JSXExpressionContainer' &&
    /^on[A-Z]/.test(attribute?.name?.name ?? '') &&
    /^[a-z]/.test(element?.name?.name ?? '')
  );
}

/** `ctrl.fetch(TodoResource.getList).catch(() => {})` becomes `ctrl.fetch(TodoResource.getList)` where
 * nothing uses the result */
function dropNoopCatches(j, root, file) {
  return (
    root
      .find(j.CallExpression)
      .filter(path => {
        const { callee } = path.node;
        return (
          memberName(callee) === 'catch' &&
          !callee.computed &&
          path.node.arguments.length === 1 &&
          isNoopHandler(path.node.arguments[0]) &&
          isUnused(path) &&
          isPrehandledRead(
            j,
            root,
            unwrapPath(path.get('callee', 'object')),
            file,
          )
        );
      })
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

/** Whether `path` runs only when `action` (an identifier path) is a fetch action: under
 * `if (action.type === actionTypes.FETCH)` or `case actionTypes.FETCH:` of `switch (action.type)`, the
 * actions that carry `meta.fetchedAt` */
function inFetchBranch(path, action) {
  const { name } = action.node;
  const binding = bindingOf(action);
  const isFetch = node =>
    nameOf(node) === 'FETCH' ||
    ((node.type === 'StringLiteral' || node.type === 'Literal') &&
      node.value === 'rdc/fetch');
  // `action.type` of the same variable, so a callback's own `action` isn't taken as the fetch
  const isActionType = (node, at) =>
    memberName(node) === 'type' &&
    isId(node.object, name) &&
    bindingAt(at, name) === binding;
  // true only when the test holds just for fetch actions: `action.type === FETCH`, alone or in an `&&`
  const onlyFetch = (test, at) =>
    (test.type === 'LogicalExpression' &&
      test.operator === '&&' &&
      (onlyFetch(test.left, at) || onlyFetch(test.right, at))) ||
    (test.type === 'BinaryExpression' &&
      (test.operator === '===' || test.operator === '==') &&
      ((isFetch(test.left) && isActionType(test.right, at)) ||
        (isFetch(test.right) && isActionType(test.left, at))));
  for (; path.parent; path = path.parent) {
    const { node } = path.parent;
    if (
      node.type === 'IfStatement' &&
      path.name === 'consequent' &&
      onlyFetch(node.test, path.parent)
    )
      return true;
    const switchPath = path.parent.parent;
    if (
      node.type === 'SwitchCase' &&
      node.test &&
      isFetch(node.test) &&
      isActionType(switchPath.node.discriminant, switchPath)
    ) {
      // another case may fall through into this one
      const { cases } = switchPath.node;
      const before = cases[cases.indexOf(node) - 1];
      if (!before || endsAbruptly(before.consequent)) return true;
    }
  }
  return false;
}

/** The fetch action's `meta` for the endpoint at `path` in a fetch branch: `action.meta` for
 * `action.endpoint`, or for `endpoint` destructured from `action` (its `meta` when destructured too) */
function fetchMetaOf(j, path) {
  const { node } = path;
  const metaOf = action =>
    j.memberExpression(j.identifier(action.name), j.identifier('meta'));
  if (memberName(node) === 'endpoint' && isActionName(node.object))
    return inFetchBranch(path, path.get('object')) ?
        metaOf(node.object)
      : undefined;
  // `const { endpoint } = action`
  const property = destructuredBy(path);
  if (!property || keyName(property.node) !== 'endpoint') return;
  const declarator = property.parent.parent;
  if (
    declarator.node.type !== 'VariableDeclarator' ||
    !isActionName(declarator.node.init) ||
    !inFetchBranch(path, declarator.get('init'))
  )
    return;
  const meta = property.parent.node.properties.find(
    p =>
      isProperty(p) && keyName(p) === 'meta' && p.value.type === 'Identifier',
  );
  const { name } = meta ? meta.value : declarator.node.init;
  // the name must mean the same variable at the resolve() call as where `endpoint` was destructured
  if (bindingAt(path, name) !== bindingAt(property, name)) return;
  return meta ? j.identifier(name) : metaOf(declarator.node.init);
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

/** The import specifier the identifier at `path` is bound to, unless it imports only a type */
function valueImportOf(path) {
  const specifier = bindingOf(path)?.parent;
  if (
    specifier?.node.type !== 'ImportSpecifier' ||
    specifier.node.importKind === 'type' ||
    specifier.parent.node.importKind === 'type'
  )
    return;
  return specifier;
}

/** Whether `path` is an identifier imported as one of `names` from `sources` */
function importsNameFrom(path, names, sources) {
  const specifier = path.node.type === 'Identifier' && valueImportOf(path);
  return (
    !!specifier &&
    names.has(staticName(specifier.node.imported)) &&
    sources.has(specifier.parent.node.source.value)
  );
}

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
const DC_GLOBAL_TODO = ` TODO(data-client): __DC_CONTROLLERS__ was replaced by __DC__ in 0.19; read __DC__.controller, after setting __DC__.store when the page has several stores (it throws when the store is missing): ${BLOG}#dc-global`;

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

/** `[...map.keys()]` or `Array.from(map.keys())` on the Map at `path`, which reads `__DC__.stores`. The
 * first value isn't `__DC__.controller`: that throws when several stores are mounted and none is picked. */
function storeKeysOf(path) {
  const member = path.parent;
  const call = member.parent;
  if (
    memberName(member.node) !== 'keys' ||
    member.node.object !== path.node ||
    !callsWithoutArgs(call.node, member.node)
  )
    return;
  const up = call.parent;
  if (
    up.node.type === 'SpreadElement' &&
    up.parent.node.type === 'ArrayExpression' &&
    up.parent.node.elements.length === 1
  )
    return up.parent;
  if (
    up.node.type === 'CallExpression' &&
    up.node.arguments.length === 1 &&
    isId(up.node.callee.object, 'Array') &&
    memberName(up.node.callee) === 'from'
  )
    return up;
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

/** Whether `statement` evaluates the expression at `path` before anything else, but the name of a function it
 * calls: in `const data = await result` or `expect(await result)`, not `const ready = flag, data = await result` */
function evaluatedFirst(path, statement) {
  for (; path !== statement; path = path.parent) {
    const { node } = path.parent;
    // an array element's key is its array's, as `arguments`
    const inArray = typeof path.name === 'number';
    const key = inArray ? path.parentPath.name : path.name;
    if (inArray && path.name !== 0) return false;
    if (node.optional) return false;
    switch (node.type) {
      case 'CallExpression':
      case 'NewExpression':
        if (key !== 'callee' && node.callee.type !== 'Identifier') return false;
        break;
      case 'MemberExpression':
        if (key !== 'object') return false;
        break;
      case 'AssignmentExpression':
        if (node.operator !== '=' || node.left.type !== 'Identifier')
          return false;
        break;
      case 'Property':
      case 'ObjectProperty':
        if (node.computed) return false;
        break;
      case 'TemplateLiteral':
      case 'ArrayExpression':
      case 'ObjectExpression':
      case 'VariableDeclaration':
        break;
      default:
        if (!alwaysEvaluated(path, path.parent)) return false;
    }
  }
  return true;
}

/** `__DC_CONTROLLERS__.get(name)` becomes `__DC__.controller`, after `__DC__.store = name;` on its own line
 * when it can move there, or else `(__DC__.store = name, __DC__.controller)` */
function selectStore(j, call, dcNode, shared) {
  const [name] = call.node.arguments;
  const select = j.assignmentExpression(
    '=',
    dcMember(j, dcNode, 'store'),
    name,
  );
  const statement = statementOf(j, call);
  // a name with no side effects, in a statement that always reads it (not `flag && ...`) and reads no other
  // store, of the same function (`page.evaluate(() => ...)` runs its function elsewhere); the variables in
  // the name and the receiver (`frame.__DC_CONTROLLERS__`) must be declared before the statement and not
  // set in it
  const inputs = [
    call.get('arguments', 0),
    ...(isMember(dcNode) ? [call.get('callee', 'object', 'object')] : []),
  ];
  const settled =
    statement &&
    inputs.every(input =>
      identifiersIn(j, input)
        .filter(p => !isOtherName(p))
        .every(
          p =>
            !isWithin(bindingOf(p), statement.node) &&
            !assignsIn(j, statement, p.node.name),
        ),
    );
  const canHoist =
    settled &&
    !shared.has(statement.node) &&
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

/** The identifiers at and inside `path` (find() skips the node it starts from) */
const identifiersIn = (j, path) => [
  ...(path.node.type === 'Identifier' ? [path] : []),
  ...j(path).find(j.Identifier).paths(),
];

/** Whether `statement` writes a variable named `name`, by assignment, destructuring, `++` or a loop head */
const assignsIn = (j, statement, name) =>
  j(statement)
    .find(j.Identifier, { name })
    .some(p => !isOtherName(p) && isWriteTarget(p));

/** Whether `node` is a name or a chain of named members (`window`, `(window as any).top`), so evaluating it
 * twice reads the same object without side effects */
function isPlainRef(node) {
  node = unwrap(node);
  return (
    node.type === 'Identifier' ||
    node.type === 'ThisExpression' ||
    (isMember(node) && !node.computed && isPlainRef(node.object))
  );
}

/** `__DC_CONTROLLERS__.get(name)` reads `__DC__.controller` after picking the store, unless the code
 * handles a missing store; the keys read `__DC__.stores`. Debugging scripts often don't import
 * data-client, so this runs on any file that names the global. */
function migrateDcGlobal(j, root) {
  let dirty = false;
  const marked = [];
  const uses = [
    ...root
      .find(j.Identifier, { name: DC_GLOBAL })
      .filter(p => !isOtherName(p) && !isLocalName(p))
      .paths(),
    ...root
      .find(j.MemberExpression)
      .filter(({ node }) => memberName(node) === DC_GLOBAL)
      .paths(),
  ];
  const getCallOf = path => {
    const call = path.parent.parent;
    return (
      memberName(path.parent.node) === 'get' &&
      path.parent.node.object === path.node &&
      call.node.type === 'CallExpression' &&
      call.node.callee === path.parent.node &&
      call.node.arguments.length === 1 &&
      call.node.arguments[0].type !== 'SpreadElement' &&
      call
    );
  };
  // statements that read more than one store keep each pick next to its read
  const seen = new Set();
  const shared = new Set();
  for (const path of uses) {
    const statement = statementOf(j, path)?.node;
    if (seen.has(statement)) shared.add(statement);
    seen.add(statement);
  }
  for (const path of uses) {
    const { node } = path;
    const call = getCallOf(path);
    // `.get()` returned undefined for a missing store, but `__DC__.controller` throws
    if (
      call &&
      !missingChecks(j, call).length &&
      (node.type === 'Identifier' || isPlainRef(node.object))
    ) {
      selectStore(j, call, node, shared);
      dirty = true;
      continue;
    }
    const keys = storeKeysOf(path);
    if (keys) {
      keys.replace(dcMember(j, node, 'stores'));
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

/** Whether `path` is an identifier bound to a value import of `name` from `source` */
const isImportOf = (path, name, source) =>
  importsNameFrom(path, new Set([name]), new Set([source]));

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
function isPlainResource(path, replaced = CREATE_SOURCES) {
  path = unwrapPath(path);
  while (
    path.node?.type === 'CallExpression' &&
    memberName(path.node.callee) === 'extend'
  ) {
    const [first] = path.node.arguments;
    if (first?.type === 'StringLiteral' || first?.type === 'Literal') {
      if (replaced.has(first.value)) return false;
    } else if (first?.type === 'ObjectExpression') {
      if (!hasOnlyKeysOutside(first, replaced)) return false;
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
const isReadOnlyResource = (j, root, binding, replaced) =>
  isPlainResourceDeclarator(binding, replaced) &&
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

/** The module and local name that `file`'s export `name` comes from, following `export { name } from` and
 * `export * from` */
function exportOrigin(j, file, name, depth = 0) {
  const root = file && depth < 5 && parseModule(j, file);
  if (!root) return;
  const { body } = root.get().node.program;
  for (const node of body) {
    if (node.type !== 'ExportNamedDeclaration' || node.exportKind === 'type')
      continue;
    const { declaration } = node;
    if (
      isId(declaration?.id, name) ||
      declaration?.declarations?.some(d => isId(d.id, name))
    )
      return { root, file, name };
    const specifier = node.specifiers?.find(
      s => staticName(s.exported) === name,
    );
    if (!specifier) continue;
    const local = specifier.local?.name ?? name;
    return node.source ?
        exportOrigin(
          j,
          resolveModule(file, node.source.value),
          local,
          depth + 1,
        )
      : { root, file, name: local };
  }
  // a module's own exports win over `export *`
  for (const node of body) {
    if (node.type !== 'ExportAllDeclaration' || node.exported) continue;
    const origin = exportOrigin(
      j,
      resolveModule(file, node.source.value),
      name,
      depth + 1,
    );
    if (origin) return origin;
  }
}

/** Whether the module `file` exports `name` as a plain `resource()` that it only reads, following
 * `export { name } from` and `export * from` */
function exportsPlainResource(j, file, name, depth, replaced) {
  const origin = exportOrigin(j, file, name, depth);
  return (
    !!origin && isLocalPlainResource(j, origin.root, origin.name, replaced)
  );
}

/** Whether a module's top-level `const name` is a plain `resource()` that the module only reads */
function isLocalPlainResource(j, root, name, replaced) {
  const declarator = root
    .find(j.VariableDeclarator, { id: { name } })
    .filter(d =>
      ['Program', 'ExportNamedDeclaration'].includes(d.parent.parent.node.type),
    )
    .paths()[0];
  return (
    !!declarator && isReadOnlyResource(j, root, declarator.get('id'), replaced)
  );
}

/** Whether `binding` is a plain `resource()` that this file only reads, declared here or imported */
const isPlainResourceBinding = (j, root, binding, file, replaced) =>
  isReadOnlyResource(j, root, binding, replaced) ||
  isImportedPlainResource(j, root, binding, file, replaced);

/** Whether `binding` imports a plain `resource()` from a relative or tsconfig-aliased module, and this file
 * only reads it */
function isImportedPlainResource(j, root, binding, file, replaced) {
  const specifier = valueImportOf(binding);
  if (!specifier) return false;
  const declaration = specifier.parent.node;
  const imported = specifier.node.imported;
  return (
    readsOnly(j, root, binding) &&
    exportsPlainResource(
      j,
      file && resolveModule(file, declaration.source.value),
      staticName(imported),
      0,
      replaced,
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
    .find(j.MemberExpression)
    .filter(({ node }) => !node.computed && memberName(node) === 'create')
    .forEach(path => {
      const { object } = path.node;
      // `api.PostResource.create` from `import * as api`
      if (object.type !== 'Identifier') {
        if (/Resource$/.test(memberName(object) ?? '')) marked.push(path);
        return;
      }
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
        readOnly.set(binding, isPlainResourceBinding(j, root, binding, file));
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

const isPlainResourceDeclarator = (binding, replaced) =>
  binding?.parent.node.type === 'VariableDeclarator' &&
  isPlainResource(binding.parent.get('init'), replaced);

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

/** Renames every reference to the variable `binding` declares, unless `name` at some reference means another
 * variable than `target` (none when undefined); returns whether it renamed */
function renameRefs(j, root, binding, name, target) {
  const refs = usesOf(j, root, binding);
  if (!refs.every(ref => bindingAt(ref, name) === target)) return false;
  refs.forEach(ref => {
    ref.node.name = name;
  });
  return true;
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
    const target = property.parent.get(
      'properties',
      pattern.properties.indexOf(existing),
      'value',
    );
    if (!renameRefs(j, root, binding, existing.value.name, target))
      return false;
    pattern.properties = pattern.properties.filter(p => p !== property.node);
    return true;
  }
  if (!property.node.shorthand) {
    property.node.key = j.identifier('allSettled');
    return true;
  }
  // a visible `allSettled` would be shadowed, here or where a nested scope declares one
  if (
    bindingAt(property, 'allSettled') ||
    !renameRefs(j, root, binding, 'allSettled')
  )
    return false;
  property.node.key = j.identifier('allSettled');
  property.node.value = j.identifier('allSettled');
  return true;
}

/** For an awaited wait right after the render, `{ statement, drop }`. `drop` is set when the next statement
 * always awaits the render's `result`, so the first load needs only that: `'delete'` when it awaits it before
 * reading anything, else `'await'` (the wait becomes `await result`, so reads before it still come after the
 * first load). `declarator` holds the render result: `{ result, allSettled }` or `rendered`. */
function firstLoadWait(j, call, declarator) {
  const statement = call.parent.parent;
  if (
    call.parent.node.type !== 'AwaitExpression' ||
    statement.node.type !== 'ExpressionStatement' ||
    !Array.isArray(statement.parentPath.value)
  )
    return;
  const index = statement.parentPath.value.indexOf(statement.node);
  const before = statement.parentPath.value[index - 1];
  if (
    before?.type !== 'VariableDeclaration' ||
    !before.declarations.includes(declarator?.node)
  )
    return;
  const after = statement.parentPath.get(index + 1);
  const { id } = declarator.node;
  const destructured = id.type === 'ObjectPattern';
  const result =
    destructured ?
      id.properties.find(p => isProperty(p) && keyName(p) === 'result')?.value
    : id;
  const awaits =
    after.node && result?.type === 'Identifier' ?
      j(after)
        .find(j.AwaitExpression)
        .filter(path => {
          const value = unwrap(path.node.argument);
          return (
            alwaysEvaluated(path, after) &&
            (destructured ?
              isId(value, result.name)
            : memberName(value) === 'result' && isId(value.object, result.name))
          );
        })
        .paths()
    : [];
  const drop =
    awaits.some(path => evaluatedFirst(path, after)) ? 'delete'
    : awaits.length ? 'await'
    : undefined;
  if (!drop) return { statement };
  const awaited =
    destructured ?
      j.identifier(result.name)
    : j.memberExpression(j.identifier(result.name), j.identifier('result'));
  return { statement, drop, awaited };
}

/** Deletes the first-load wait (`drop` `'delete'`) or makes it `await result` (`'await'`), and deletes
 * `allSettled` from the render's pattern when nothing else calls it */
function dropFirstLoadWait(j, { statement, drop, awaited }, declarator) {
  if (drop === 'delete') statement.prune();
  else statement.node.expression = j.awaitExpression(awaited);
  const { id } = declarator.node;
  if (id.type !== 'ObjectPattern') return;
  const allSettled = id.properties.find(
    p => isProperty(p) && keyName(p) === 'allSettled',
  )?.value;
  if (allSettled?.type !== 'Identifier') return;
  const calls = j(declarator.scope.path)
    .find(j.Identifier, { name: allSettled.name })
    .filter(p => p.node !== allSettled && !isOtherName(p));
  if (!calls.size())
    id.properties = id.properties.filter(p => p.value !== allSettled);
}

/** Vue `waitForNextUpdate()` becomes `allSettled()`, which also waits for fetches, with no time limit.
 * Right after the render, the old call waited for a Promise `result`, which `allSettled()` doesn't, so
 * there it is deleted where the next statement awaits `result`, and marked otherwise. Returns the calls
 * it could not convert. */
function waitForAllSettled(j, root, calls) {
  const unconverted = [];
  // read every binding before renaming any, since scopes keep the names they first saw
  const plans = calls.map(call => {
    const callee = call.get('callee');
    const property = !isMember(callee.node) && destructuredBy(callee);
    const declarator =
      property ?
        property.parent.parent
      : isMember(callee.node) && bindingOf(callee.get('object'))?.parent;
    return {
      call,
      property,
      declarator,
      first: declarator && firstLoadWait(j, call, declarator),
    };
  });
  // a property with a first wait that must stay keeps its name for every call
  const kept = new Set(
    plans
      .filter(p => p.property && p.first && !p.first.drop)
      .map(p => p.property),
  );
  const converted = new Map();
  for (const { call, property, declarator, first } of plans) {
    if (!declarator || (first && !first.drop) || kept.has(property)) {
      unconverted.push(call);
      continue;
    }
    if (property) {
      // keyed by path: removing the property clears its node
      if (!converted.has(property))
        converted.set(property, destructureAllSettled(j, root, property));
      if (!converted.get(property)) {
        unconverted.push(call);
        continue;
      }
    } else {
      call.node.callee.property = j.identifier('allSettled');
      call.node.callee.computed = false;
    }
    if (first?.drop) dropFirstLoadWait(j, first, declarator);
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
  if (type.type === 'TSArrayType' || type.type === 'TSTupleType')
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

/** Whether a parameter of this type already accepts a `readonly any[]` */
const acceptsReadonly = type =>
  ['TSAnyKeyword', 'TSUnknownKeyword', 'TSUndefinedKeyword'].includes(
    type.type,
  ) ||
  (type.type === 'TSTypeOperator' && type.operator === 'readonly') ||
  (type.type === 'TSTypeReference' && isId(type.typeName, 'ReadonlyArray')) ||
  (type.type === 'TSUnionType' && type.types.every(acceptsReadonly));

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
      if (!annotation) return;
      const type = readonlyType(j, annotation.typeAnnotation);
      if (!type) {
        // a named type (`args?: Args`) may need its own readonly
        if (!acceptsReadonly(annotation.typeAnnotation)) marked.push(method);
        return;
      }
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

// ---- 9. Optional improvements that adopt 0.19 features (--improvements) ----

const SCHEMA_PACKAGES = new Set([
  '@data-client/rest',
  '@data-client/endpoint',
  '@data-client/graphql',
]);
const ENTITY_BASES = new Set(['Entity', 'GQLEntity']);

/** Whether `path` names one of `names` from a schema package: `Entity` imported from `@data-client/rest`,
 * or `schema.Entity` */
const isSchemaExport = (path, names) =>
  importsNameFrom(path, names, SCHEMA_PACKAGES) ||
  (isMember(path.node) &&
    names.has(memberName(path.node)) &&
    importsNameFrom(path.get('object'), new Set(['schema']), SCHEMA_PACKAGES));

/** The class a module declares at its top level as `name`: `class name` or `const name = class` */
function topLevelClass(j, root, name) {
  const atTop = p =>
    ['Program', 'ExportNamedDeclaration'].includes(p.parent.node.type);
  return (
    root.find(j.ClassDeclaration, { id: { name } }).filter(atTop).paths()[0] ??
    root
      .find(j.VariableDeclarator, {
        id: { name },
        init: { type: 'ClassExpression' },
      })
      .filter(p => p.parent.node.kind === 'const' && atTop(p.parent))
      .paths()[0]
      ?.get('init')
  );
}

/** The class the identifier at `path` names, declared in this file or exported by the relative or
 * tsconfig-aliased module it is imported from: `{ path, file }` */
function classOf(j, path, file) {
  const binding = path.node.type === 'Identifier' && bindingOf(path);
  const owner = binding?.parent;
  if (!owner) return;
  if (owner.node.type === 'ClassDeclaration' && owner.node.id === binding.node)
    return { path: owner, file };
  if (
    owner.node.type === 'VariableDeclarator' &&
    owner.node.id === binding.node &&
    owner.parent.node.kind === 'const' &&
    owner.node.init?.type === 'ClassExpression'
  )
    return { path: owner.get('init'), file };
  const specifier = valueImportOf(path);
  const origin =
    specifier &&
    exportOrigin(
      j,
      file && resolveModule(file, specifier.parent.node.source.value),
      staticName(specifier.node.imported),
    );
  const declared = origin && topLevelClass(j, origin.root, origin.name);
  return declared && { path: declared, file: origin.file };
}

// The most parameters an Entity's pk() and process() may declare and still compute the same row either way.
// A batch normalizes each row with no args and the list as its parent; one set() per row passes the
// row as its parent and its own args. So the entity a set() writes may read only the row...
const ROW_ONLY = { staticPk: 1, pk: 0, process: 1 };
// ...while an entity nested in its schema gets the same parent and key either way, and different args.
const ARGS_FREE = { staticPk: 3, pk: 2, process: 3 };

/** Whether a pk() or process() member declares at most `max` parameters and never reads `arguments` */
function paramsWithin(node, max) {
  const fn = node.type === 'ClassMethod' ? node : node.value;
  if (!(fn.type === 'ClassMethod' ? fn.kind === 'method' : isFunction(fn)))
    return false;
  // a TypeScript `this` parameter isn't one
  const params = fn.params.filter(p => !isId(p, 'this'));
  return (
    params.length <= max &&
    params.every(p => p.type !== 'RestElement') &&
    !containsNode(fn.body, n => isId(n, 'arguments'))
  );
}

/** Whether `test` holds for `node` or anything inside it */
function containsNode(node, test) {
  if (!node || typeof node.type !== 'string') return false;
  if (test(node)) return true;
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'comments' || key === 'tokens') continue;
    const value = node[key];
    if (Array.isArray(value)) {
      if (value.some(v => containsNode(v, test))) return true;
    } else if (value && typeof value === 'object' && containsNode(value, test))
      return true;
  }
  return false;
}

/** Whether a class member keeps rows the same when normalized in a batch, within `limits` */
function memberAllows(j, member, file, limits, seen) {
  const { node } = member;
  if (!CLASS_MEMBERS.has(node.type)) return true;
  const name = keyName(node);
  // a computed key could be any member
  if (name === undefined) return false;
  if (!node.static) return name !== 'pk' || paramsWithin(node, limits.pk);
  switch (name) {
    // validate() could throw for one row, which drops the whole batch
    case 'normalize':
    case 'validate':
      return false;
    case 'pk':
      return paramsWithin(node, limits.staticPk);
    case 'process':
      return paramsWithin(node, limits.process);
    case 'schema':
      return (
        node.type === 'ClassProperty' &&
        isArgsFreeSchema(j, member.get('value'), file, seen)
      );
    default:
      return true;
  }
}

/** The paths of a list's items: a list's path has map() but no every() */
const childPaths = listPath => listPath.map(p => p);

/** Whether `cls` extends a data-client Entity, directly or through classes like it, without members that
 * read more of normalize than `limits` allow. `seen` holds the classes being checked, by the limits they
 * are checked with, so circular schemas end. */
function isPlainEntity(j, cls, limits, seen = new Map()) {
  const checked = seen.get(cls.path.node);
  // ROW_ONLY is the stricter of the two
  if (checked === limits || checked === ROW_ONLY) return true;
  if (seen.size > 20) return false;
  seen.set(cls.path.node, limits);
  const superClass = cls.path.get('superClass');
  if (!superClass.node) return false;
  if (!isSchemaExport(superClass, ENTITY_BASES)) {
    const base = classOf(j, superClass, cls.file);
    if (!base || !isPlainEntity(j, base, limits, seen)) return false;
  }
  return childPaths(cls.path.get('body', 'body')).every(member =>
    memberAllows(j, member, cls.file, limits, seen),
  );
}

// constructors a schema can name that normalize leaves the value to
const SCALAR_GLOBALS = new Set([
  'Date',
  'Number',
  'String',
  'Boolean',
  'BigInt',
]);

/** Whether a nested schema normalizes the same without args: plain objects and arrays of Entities that
 * don't read args, and functions, which normalize skips */
function isArgsFreeSchema(j, path, file, seen) {
  path = unwrapPath(path);
  const { node } = path;
  switch (node?.type) {
    case 'ObjectExpression':
      return childPaths(path.get('properties')).every(
        p =>
          isProperty(p.node) && isArgsFreeSchema(j, p.get('value'), file, seen),
      );
    case 'ArrayExpression':
      return (
        !!oneElement(node) &&
        isArgsFreeSchema(j, path.get('elements', 0), file, seen)
      );
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
      return true;
    case 'Identifier': {
      if (SCALAR_GLOBALS.has(node.name) && !bindingOf(path)) return true;
      const cls = classOf(j, path, file);
      return !!cls && isPlainEntity(j, cls, ARGS_FREE, seen);
    }
    default:
      return false;
  }
}

/** Whether `path` is an Entity class whose rows normalize the same in a batch */
const isRowOnlyEntity = (j, path, file) => {
  const cls = classOf(j, path, file);
  return !!cls && isPlainEntity(j, cls, ROW_ONLY);
};

const INVALIDATE = new Set(['Invalidate']);

/** Whether `path` is `new Invalidate(Entity)` for an Entity whose rows normalize the same in a batch */
const isRowOnlyInvalidate = (j, path, file) =>
  path.node.type === 'NewExpression' &&
  path.node.arguments.length === 1 &&
  isSchemaExport(path.get('callee'), INVALIDATE) &&
  isRowOnlyEntity(j, path.get('arguments', 0), file);

/** Whether `path` is an Entity or `new Invalidate(Entity)` whose rows normalize the same in a batch */
const isRowOnlySchema = (j, path, file) =>
  isRowOnlyEntity(j, path, file) || isRowOnlyInvalidate(j, path, file);

/** Whether the type annotation `type` is an array or tuple type */
function isArrayType(type) {
  while (type?.type === 'TSParenthesizedType') type = type.typeAnnotation;
  if (type?.type === 'TSTypeOperator' && type.operator === 'readonly')
    type = type.typeAnnotation;
  return (
    type?.type === 'TSArrayType' ||
    type?.type === 'TSTupleType' ||
    (type?.type === 'TSTypeReference' &&
      ['Array', 'ReadonlyArray'].includes(type.typeName.name))
  );
}

// global calls that return an array
const ARRAY_FACTORIES = new Map([
  ['Object', new Set(['values', 'keys', 'entries'])],
  ['Array', new Set(['from', 'of'])],
  // a loop over a parsed object throws, and a set() per character or digit writes no rows
  ['JSON', new Set(['parse'])],
]);
// array methods that return an array
const ARRAY_METHODS = new Set([
  'map',
  'filter',
  'slice',
  'concat',
  'flat',
  'flatMap',
  'toSorted',
  'toReversed',
]);

/** Whether the expression at `path` is an array: a batch set() reads only arrays and plain objects, so
 * a Set or Map loops differently */
function isArrayValue(path, depth = 0) {
  const { node } = path;
  if (depth > 5 || !node) return false;
  if (PASS_THROUGH.has(node.type))
    return (
      isArrayType(node.typeAnnotation) ||
      isArrayValue(path.get('expression'), depth + 1)
    );
  if (node.type === 'ArrayExpression') return true;
  if (node.type === 'CallExpression' && isMember(node.callee)) {
    const method = memberName(node.callee);
    const object = path.get('callee', 'object');
    if (
      object.node.type === 'Identifier' &&
      ARRAY_FACTORIES.get(object.node.name)?.has(method) &&
      !bindingOf(object)
    )
      return true;
    return ARRAY_METHODS.has(method) && isArrayValue(object, depth + 1);
  }
  if (node.type !== 'Identifier') return false;
  const binding = bindingOf(path);
  if (!binding) return false;
  // a parameter or variable typed as an array
  if (isArrayType(binding.node.typeAnnotation?.typeAnnotation)) return true;
  const declarator = binding.parent;
  return (
    declarator.node.type === 'VariableDeclarator' &&
    declarator.node.id === binding.node &&
    declarator.parent.node.kind === 'const' &&
    !!declarator.node.init &&
    isArrayValue(declarator.get('init'), depth + 1)
  );
}

const LITERALS = new Set([
  'StringLiteral',
  'NumericLiteral',
  'BooleanLiteral',
  'NullLiteral',
  'Literal',
]);

/** Whether `node` reads variables and properties without calling anything: `x`, `this.x`, `x['y']` */
const isReference = node =>
  node.type === 'Identifier' ||
  node.type === 'ThisExpression' ||
  (node.type === 'MemberExpression' &&
    (!node.computed || LITERALS.has(node.property.type)) &&
    isReference(node.object));

/** Whether evaluating `node` once or once per row is the same: references, literals, and objects and
 * arrays of them */
function isPure(node) {
  node = unwrap(node);
  if (isReference(node) || LITERALS.has(node.type)) return true;
  if (node.type === 'ArrayExpression')
    return node.elements.every(
      e => e && e.type !== 'SpreadElement' && isPure(e),
    );
  return (
    node.type === 'ObjectExpression' &&
    node.properties.every(
      p =>
        (isProperty(p) &&
          (!p.computed || LITERALS.has(p.key.type)) &&
          isPure(p.value)) ||
        (p.type === 'SpreadElement' && isPure(p.argument)),
    )
  );
}

/** The names a loop variable or callback parameter binds */
function patternNames(pattern, names = new Set()) {
  if (!pattern) return names;
  switch (pattern.type) {
    case 'Identifier':
      names.add(pattern.name);
      break;
    case 'ObjectPattern':
      for (const p of pattern.properties)
        patternNames(p.type === 'RestElement' ? p.argument : p.value, names);
      break;
    case 'ArrayPattern':
      for (const e of pattern.elements) patternNames(e, names);
      break;
    case 'RestElement':
      patternNames(pattern.argument, names);
      break;
    case 'AssignmentPattern':
      patternNames(pattern.left, names);
      break;
  }
  return names;
}

/** The root variable of a reference like `this.controller` or `ctrl` */
const rootOf = node => (isMember(node) ? rootOf(node.object) : node);

const CONTROLLER_NAMES = /^(ctrl|controller)$/i;
const USE_CONTROLLER = new Set(['useController']);
const CLIENT_PACKAGES = new Set(['@data-client/react', '@data-client/vue']);

/** Whether the reference at `path` is a Controller: named `ctrl` or `controller` (`this.controller`), or a
 * variable set to `useController()`. Other objects have set() methods too, like a Map. */
function isController(path) {
  const { node } = path;
  const name = node.type === 'Identifier' ? node.name : memberName(node);
  if (CONTROLLER_NAMES.test(name ?? '')) return true;
  const declarator = node.type === 'Identifier' && bindingOf(path)?.parent;
  return (
    !!declarator &&
    declarator.node.type === 'VariableDeclarator' &&
    declarator.node.init?.type === 'CallExpression' &&
    importsNameFrom(
      declarator.get('init', 'callee'),
      USE_CONTROLLER,
      CLIENT_PACKAGES,
    )
  );
}

/** Whether `type` is a function type, or could hold one */
function isFunctionLikeType(type) {
  while (type?.type === 'TSParenthesizedType') type = type.typeAnnotation;
  if (!type) return true;
  switch (type.type) {
    case 'TSFunctionType':
    case 'TSConstructorType':
    case 'TSAnyKeyword':
    case 'TSUnknownKeyword':
      return true;
    case 'TSUnionType':
    case 'TSIntersectionType':
      return type.types.some(isFunctionLikeType);
    case 'TSTypeReference':
      return isId(type.typeName, 'Function');
    default:
      return false;
  }
}

/** The element types of an array or tuple type */
function elementTypes(type) {
  while (type?.type === 'TSParenthesizedType') type = type.typeAnnotation;
  if (type?.type === 'TSTypeOperator') return elementTypes(type.typeAnnotation);
  if (type?.type === 'TSArrayType') return [type.elementType];
  if (type?.type === 'TSTupleType') return type.elementTypes;
  if (
    type?.type === 'TSTypeReference' &&
    ['Array', 'ReadonlyArray'].includes(type.typeName.name)
  )
    return type.typeParameters?.params ?? [];
  return [];
}

// array methods that return some of an array's own elements
const ELEMENT_METHODS = new Set(['filter', 'slice', 'toSorted', 'toReversed']);

/** Where the elements of the array at `path` come from: 'json' for parsed JSON or literal data, which holds
 * no functions; 'typed' for an array typed with elements that can't be functions */
function elementSource(path, depth = 0) {
  const { node } = path;
  if (depth > 5 || !node) return;
  if (PASS_THROUGH.has(node.type)) {
    const types = node.typeAnnotation && elementTypes(node.typeAnnotation);
    if (types?.length)
      return types.some(isFunctionLikeType) ? undefined : 'typed';
    return elementSource(path.get('expression'), depth + 1);
  }
  if (node.type === 'ArrayExpression')
    return (
        node.elements.every(
          e =>
            e?.type === 'ObjectExpression' ||
            e?.type === 'ArrayExpression' ||
            LITERALS.has(e?.type),
        )
      ) ?
        'json'
      : undefined;
  if (node.type === 'CallExpression' && isMember(node.callee)) {
    const method = memberName(node.callee);
    const object = path.get('callee', 'object');
    if (
      object.node.type === 'Identifier' &&
      !bindingOf(object) &&
      ((object.node.name === 'JSON' && method === 'parse') ||
        (object.node.name === 'Object' && method === 'values'))
    )
      return method === 'parse' ? 'json' : (
          elementSource(path.get('arguments', 0), depth + 1)
        );
    return ELEMENT_METHODS.has(method) ?
        elementSource(object, depth + 1)
      : undefined;
  }
  if (node.type !== 'Identifier') return;
  const binding = bindingOf(path);
  if (!binding) return;
  const annotation = binding.node.typeAnnotation?.typeAnnotation;
  if (annotation) {
    const types = elementTypes(annotation);
    return types.length && !types.some(isFunctionLikeType) ?
        'typed'
      : undefined;
  }
  const declarator = binding.parent;
  if (
    declarator.node.type === 'VariableDeclarator' &&
    declarator.node.id === binding.node &&
    declarator.parent.node.kind === 'const' &&
    declarator.node.init
  )
    return elementSource(declarator.get('init'), depth + 1);
}

/** Whether `value` is row data and never an updater function, which set() calls with the stored value
 * where a batch would normalize it: an object or array literal, the row itself from data that holds no
 * functions, or a property of a row of parsed JSON */
function isRowData(value, rows, names) {
  value = unwrap(value);
  if (value.type === 'ObjectExpression' || value.type === 'ArrayExpression')
    return true;
  const source = elementSource(rows);
  if (value.type === 'Identifier' && names.has(value.name)) return !!source;
  return (
    source === 'json' &&
    isMember(value) &&
    isReference(value) &&
    names.has(rootOf(value).name)
  );
}

/** The schema of a batch that writes the rows of `call`'s schema, and the value of each row when it differs
 * from `call`'s value */
function batchSchemaOf(j, file, call) {
  const [first, ...rest] = call.node.arguments;
  const value = rest[rest.length - 1];
  const schemaPath = call.get('arguments', 0);
  // the Entity's pk() and process() read only the row, so the args can go
  if (isRowOnlyEntity(j, schemaPath, file))
    return { schema: j.arrayExpression([first]) };
  if (rest.length === 2) return;
  if (isRowOnlyInvalidate(j, schemaPath, file))
    return { schema: j.arrayExpression([first]) };
  // a one-row batch per element
  const row = oneElement(value);
  if (
    row &&
    oneElement(first) &&
    isRowOnlySchema(j, schemaPath.get('elements', 0), file)
  )
    return { schema: first, value: row };
}

/** The only element of an array literal like `[x]` */
const oneElement = node =>
  (
    node.type === 'ArrayExpression' &&
    node.elements.length === 1 &&
    node.elements[0]?.type !== 'SpreadElement'
  ) ?
    node.elements[0]
  : undefined;

/** The batch set() that does what `call`, run once per element of `rows`, does: one row per element, for an
 * Entity or `new Invalidate(Entity)` */
function batchSetOf(j, file, { rows, param, call }) {
  const args = call.node.arguments;
  if (
    args.length < 2 ||
    args.length > 3 ||
    args.some(a => a.type === 'SpreadElement')
  )
    return;
  const names = patternNames(param);
  const mentions = node =>
    containsNode(node, n => n.type === 'Identifier' && names.has(n.name));
  const controller = call.node.callee.object;
  let value = args[args.length - 1];
  const extra = args.length === 3 ? args[1] : undefined;
  const controllerRoot = rootOf(controller);
  if (
    !isReference(controller) ||
    !isController(call.get('callee', 'object')) ||
    mentions(controller) ||
    mentions(args[0]) ||
    (extra && !isPure(extra)) ||
    !mentions(value) ||
    isFunction(value) ||
    containsNode(
      value,
      n =>
        n.type === 'AwaitExpression' ||
        n.type === 'YieldExpression' ||
        // reads the store the earlier rows were written to
        (controllerRoot.type === 'Identifier' ?
          isId(n, controllerRoot.name)
        : n.type === 'ThisExpression'),
    )
  )
    return;

  if (!isArrayValue(rows) || !isRowData(value, rows, names)) return;
  const batch = batchSchemaOf(j, file, call);
  if (!batch) return;
  value = batch.value ?? value;
  const list =
    param.type === 'Identifier' && isId(value, param.name) ?
      rows.node
    : j.callExpression(j.memberExpression(rows.node, j.identifier('map')), [
        j.arrowFunctionExpression(
          [param],
          // keeps `({ id })` on one line
          value.type === 'ObjectExpression' ?
            j.parenthesizedExpression(value)
          : value,
        ),
      ]);
  return j.callExpression(call.node.callee, [batch.schema, list]);
}

/** The `set()` call a loop body makes once per element, whether it awaits it, and whether a callback
 * returns it (an expression body, or `return` when `returns`) */
function setCallIn(path, returns = false) {
  let { node } = path;
  if (node.type === 'BlockStatement') {
    if (node.body.length !== 1) return;
    path = path.get('body', 0);
    node = path.node;
  }
  let returned = !path.parent || path.parent.node.type !== 'BlockStatement';
  if (
    node.type === 'ExpressionStatement' ||
    (returns && node.type === 'ReturnStatement')
  ) {
    returned = node.type === 'ReturnStatement';
    path = path.get(
      node.type === 'ReturnStatement' ? 'argument' : 'expression',
    );
    node = path.node;
  }
  const awaited = node?.type === 'AwaitExpression';
  if (awaited) path = path.get('argument');
  return (
      path.node?.type === 'CallExpression' &&
        path.node.callee.type === 'MemberExpression' &&
        memberName(path.node.callee) === 'set'
    ) ?
      { call: path, awaited, returned }
    : undefined;
}

const isPromiseAll = node =>
  node?.type === 'CallExpression' &&
  node.arguments.length === 1 &&
  isMember(node.callee) &&
  isId(node.callee.object, 'Promise') &&
  memberName(node.callee) === 'all';

/** Replaces a loop statement with `call`, keeping the comments on the loop and on the set() statement */
function replaceLoop(j, path, call, awaited, inner) {
  const statement = j.expressionStatement(
    awaited ? j.awaitExpression(call) : call,
  );
  prependComments(statement, [
    ...(path.node.comments ?? []),
    ...(inner?.comments ?? []),
  ]);
  path.replace(statement);
}

/** Loops that call set() once per row become one batch set(): `for...of`, `forEach()`, and `rows.map()` or
 * `Promise.all(rows.map())` whose result is unused. A row whose pk() or process() throws (a malformed row)
 * then makes the whole batch write nothing, where the loop still wrote some of the other rows. */
function batchSets(j, root, file) {
  let dirty = false;
  root.find(j.ForOfStatement).forEach(path => {
    const { node } = path;
    // a `var` stays visible after the loop, holding the last row
    if (
      node.await ||
      node.left.type !== 'VariableDeclaration' ||
      node.left.kind === 'var' ||
      node.left.declarations.length !== 1
    )
      return;
    const found = setCallIn(path.get('body'));
    const call =
      found &&
      batchSetOf(j, file, {
        rows: path.get('right'),
        param: node.left.declarations[0].id,
        call: found.call,
      });
    if (!call) return;
    replaceLoop(j, path, call, found.awaited, node.body.body?.[0]);
    dirty = true;
  });
  root.find(j.ExpressionStatement).forEach(path => {
    let expression = path.get('expression');
    const awaited = expression.node.type === 'AwaitExpression';
    if (awaited) expression = expression.get('argument');
    const viaAll = isPromiseAll(expression.node);
    // `await rows.forEach()` waits for nothing, so it isn't a batch either
    if (awaited && !viaAll) return;
    const loop = viaAll ? expression.get('arguments', 0) : expression;
    const { node } = loop;
    if (
      node.type !== 'CallExpression' ||
      !isMember(node.callee) ||
      node.arguments.length !== 1
    )
      return;
    const method = memberName(node.callee);
    if (method !== 'map' && (viaAll || method !== 'forEach')) return;
    const callback = node.arguments[0];
    // forEach() doesn't wait for an async callback, so its set() calls would not be awaited together
    if (
      callback.type !== 'ArrowFunctionExpression' ||
      callback.params.length !== 1 ||
      (callback.async && !viaAll)
    )
      return;
    const found = setCallIn(loop.get('arguments', 0, 'body'), method === 'map');
    // `Promise.all()` of callbacks that don't return the set() waits for none of them
    if (viaAll && found && !found.returned && !found.awaited) return;
    const call =
      found &&
      batchSetOf(j, file, {
        rows: loop.get('callee', 'object'),
        param: callback.params[0],
        call: found.call,
      });
    if (!call) return;
    replaceLoop(j, path, call, awaited, callback.body.body?.[0]);
    dirty = true;
  });
  return dirty;
}

/** `ctrl.set([new Invalidate(Todo)], [{ id }])` becomes `ctrl.set(new Invalidate(Todo), { id })`, which
 * type-checks since 0.19 */
function unwrapOneRowInvalidate(j, root, file) {
  let dirty = false;
  root.find(j.CallExpression).forEach(path => {
    const { node } = path;
    const [schema, value] = node.arguments;
    if (
      !isMember(node.callee) ||
      memberName(node.callee) !== 'set' ||
      node.arguments.length !== 2 ||
      !oneElement(schema) ||
      !oneElement(value) ||
      !isRowOnlyInvalidate(j, path.get('arguments', 0, 'elements', 0), file)
    )
      return;
    node.arguments = [oneElement(schema), oneElement(value)];
    dirty = true;
  });
  return dirty;
}

/** Removes the import of `name` when nothing else in the file uses it */
function dropUnusedImport(j, root, name) {
  const imported = importOf(j, root, name);
  if (!imported) return;
  const specifier = root
    .find(j.ImportSpecifier)
    .filter(p => p.node === imported.specifier)
    .paths()[0];
  const local = specifier.get(specifier.node.local ? 'local' : 'imported');
  if (usesOf(j, root, local).size()) return;
  removeSpecifiers(root, imported.declaration, [imported.specifier]);
}

/** Removes `specifiers` from an import, and the import when none are left */
function removeSpecifiers(root, declaration, specifiers) {
  declaration.specifiers = declaration.specifiers.filter(
    s => !specifiers.includes(s),
  );
  if (declaration.specifiers.length) return;
  const { body } = root.get().node.program;
  body.splice(body.indexOf(declaration), 1);
}

const VUE = new Set(['@data-client/vue']);
const GC_POLICY_SOURCES = new Set(['@data-client/vue', '@data-client/core']);
const DATA_CLIENT_PLUGIN = new Set(['DataClientPlugin']);
const GC_POLICY = new Set(['GCPolicy']);

/** `app.use(DataClientPlugin, { gcPolicy: new GCPolicy() })` drops the option, the default since 0.19 */
function dropDefaultGCPolicy(j, root) {
  const options = [];
  root.find(j.CallExpression).forEach(call => {
    if (
      memberName(call.node.callee) === 'use' &&
      call.node.arguments.length === 2 &&
      importsNameFrom(call.get('arguments', 0), DATA_CLIENT_PLUGIN, VUE)
    )
      options.push(call.get('arguments', 1));
  });
  // test plugins: `[DataClientPlugin, { gcPolicy }]`
  root.find(j.ArrayExpression).forEach(array => {
    if (
      array.node.elements.length === 2 &&
      array.node.elements[0] &&
      importsNameFrom(array.get('elements', 0), DATA_CLIENT_PLUGIN, VUE)
    )
      options.push(array.get('elements', 1));
  });
  const dropped = new Set();
  for (const path of options) {
    if (path.node?.type !== 'ObjectExpression') continue;
    const i = path.node.properties.findIndex(
      p =>
        isProperty(p) &&
        !p.computed &&
        keyName(p) === 'gcPolicy' &&
        p.value.type === 'NewExpression' &&
        p.value.arguments.length === 0,
    );
    // an earlier spread or computed key could set another gcPolicy that this one overrides
    if (
      i === -1 ||
      path.node.properties
        .slice(0, i)
        .some(p => p.type === 'SpreadElement' || p.computed) ||
      !importsNameFrom(
        path.get('properties', i, 'value', 'callee'),
        GC_POLICY,
        GC_POLICY_SOURCES,
      )
    )
      continue;
    dropped.add(path.node.properties[i].value.callee.name);
    path.node.properties.splice(i, 1);
    if (!path.node.properties.length) path.prune();
  }
  for (const name of dropped) dropUnusedImport(j, root, name);
  return dropped.size > 0;
}

/** `GCPolicy` from `@data-client/core` comes from `@data-client/vue`, which exports it since 0.19 */
function importGCPolicyFromVue(j, root) {
  const imports = importsOf(root);
  const vue = imports.find(
    d =>
      d.source.value === '@data-client/vue' &&
      d.importKind !== 'type' &&
      d.specifiers.every(s => s.type === 'ImportSpecifier'),
  );
  if (!vue) return false;
  let dirty = false;
  for (const core of imports) {
    if (core.source.value !== '@data-client/core' || core.importKind === 'type')
      continue;
    const moved = core.specifiers.filter(
      s =>
        s.type === 'ImportSpecifier' &&
        s.importKind !== 'type' &&
        staticName(s.imported) === 'GCPolicy',
    );
    if (!moved.length) continue;
    removeSpecifiers(root, core, moved);
    vue.specifiers.push(...moved);
    dirty = true;
  }
  return dirty;
}

// Vue composables whose arguments may be getters since 0.19
const GETTER_COMPOSABLES = new Set([
  'useSuspense',
  'useLive',
  'useCache',
  'useDLE',
  'useFetch',
  'useQuery',
  'useSubscription',
]);

const COMPUTED = new Set(['computed']);
const VUE_FRAMEWORK = new Set(['vue']);

/** `useSuspense(E, computed(() => args))` becomes `useSuspense(E, () => args)`: composables read getters
 * like refs since 0.19 */
function unwrapComputedArgs(j, root) {
  let dirty = false;
  root.find(j.CallExpression).forEach(call => {
    if (!importsNameFrom(call.get('callee'), GETTER_COMPOSABLES, VUE)) return;
    call.get('arguments').each((arg, i) => {
      const { node } = arg;
      // computed() passes its getter the previous value, which a getter argument doesn't get
      if (
        i === 0 ||
        node.type !== 'CallExpression' ||
        node.arguments.length !== 1 ||
        !isFunction(node.arguments[0]) ||
        node.arguments[0].params.length ||
        !importsNameFrom(arg.get('callee'), COMPUTED, VUE_FRAMEWORK)
      )
        return;
      arg.replace(node.arguments[0]);
      dirty = true;
    });
  });
  if (dirty) dropUnusedImport(j, root, 'computed');
  return dirty;
}

const REACT = new Set(['@data-client/react']);

/** Whether the identifier at `path` holds React useCache()'s result or useDLE()'s `data`, which are never a
 * Symbol since 0.19 */
function isCachedData(path) {
  const binding = bindingOf(path);
  if (!binding) return false;
  let declarator = binding.parent;
  let hook = 'useCache';
  if (isProperty(declarator.node)) {
    if (
      declarator.node.value !== binding.node ||
      keyName(declarator.node) !== 'data'
    )
      return false;
    declarator = declarator.parent.parent;
    hook = 'useDLE';
  } else if (declarator.node.id !== binding.node) return false;
  return (
    declarator?.node.type === 'VariableDeclarator' &&
    declarator.parent.node.kind === 'const' &&
    declarator.node.init?.type === 'CallExpression' &&
    importsNameFrom(declarator.get('init', 'callee'), new Set([hook]), REACT)
  );
}

const TESTS = new Set([
  'IfStatement',
  'WhileStatement',
  'DoWhileStatement',
  'ForStatement',
  'ConditionalExpression',
]);

/** Whether only the truthiness of the expression at `path` matters: it is a condition, through `&&` and `||`,
 * or the operand of `!`, which makes any value a boolean. Elsewhere `x || false` is `false`, not `x`, when `x`
 * is falsy. */
function isCondition(path) {
  while (
    path.parent.node.type === 'LogicalExpression' ||
    path.parent.node.type === 'ParenthesizedExpression'
  )
    path = path.parent;
  const parent = path.parent.node;
  return (
    (TESTS.has(parent.type) && parent.test === path.node) ||
    (parent.type === 'UnaryExpression' && parent.operator === '!')
  );
}

/** Replaces the expression at `path` with `node`, and drops the parentheses around it when its parent is a
 * short `!` or `&&`/`||`: `!(todo)` becomes `!todo`. Recast keeps the source's parentheses unless it reprints
 * the parent, which it does once the parent has no source position. Elsewhere the reprint would reflow
 * more, so the parentheses stay. */
function replaceInParens(path, node) {
  const { parenthesized } = path.node.extra ?? {};
  const parent = path.parent;
  path.replace(node);
  if (
    !parenthesized ||
    !['UnaryExpression', 'LogicalExpression'].includes(parent.node.type) ||
    parent.node.loc?.start.line !== parent.node.loc?.end.line
  )
    return;
  const reprinted = { ...parent.node };
  for (const key of ['loc', 'start', 'end']) delete reprinted[key];
  parent.replace(reprinted);
}

/** `!todo || typeof todo === 'symbol'` becomes `!todo` for React useCache() and useDLE() data */
function dropSymbolChecks(j, root) {
  let dirty = false;
  root.find(j.BinaryExpression).forEach(path => {
    const { node } = path;
    const typeofSide = [node.left, node.right].findIndex(
      n =>
        n.type === 'UnaryExpression' &&
        n.operator === 'typeof' &&
        n.argument.type === 'Identifier',
    );
    const other = typeofSide === 0 ? node.right : node.left;
    if (
      typeofSide === -1 ||
      !LITERALS.has(other.type) ||
      other.value !== 'symbol'
    )
      return;
    // `|| typeof x === 'symbol'` is always `|| false`, and `&& typeof x !== 'symbol'` is `&& true`
    const operator =
      ['===', '=='].includes(node.operator) ? '||'
      : ['!==', '!='].includes(node.operator) ? '&&'
      : undefined;
    const logical = path.parent;
    if (
      logical.node.type !== 'LogicalExpression' ||
      logical.node.operator !== operator ||
      !isCondition(logical) ||
      !isCachedData(path.get(typeofSide === 0 ? 'left' : 'right', 'argument'))
    )
      return;
    replaceInParens(
      logical,
      logical.node.left === node ? logical.node.right : logical.node.left,
    );
    dirty = true;
  });
  return dirty;
}

const IMPROVEMENT_NAMES = /\.set\(|GCPolicy|computed\(|['"]symbol['"]/;

function adoptImprovements(j, root, { source, path: file }) {
  let dirty = false;
  if (source.includes('.set(')) {
    dirty = batchSets(j, root, file);
    if (source.includes('Invalidate'))
      dirty = unwrapOneRowInvalidate(j, root, file) || dirty;
  }
  if (source.includes('GCPolicy')) {
    dirty = dropDefaultGCPolicy(j, root) || dirty;
    dirty = importGCPolicyFromVue(j, root) || dirty;
  }
  if (source.includes('computed('))
    dirty = unwrapComputedArgs(j, root) || dirty;
  if (/['"]symbol['"]/.test(source)) dirty = dropSymbolChecks(j, root) || dirty;
  return dirty;
}

/** Which passes run. `--deprecations=false` skips moving off deprecated APIs and `--deprecations=only` does
 * just that; `--improvements` adds the optional rewrites that adopt 0.19 features, and
 * `--improvements=only` does just those. */
function passesFor(options) {
  // jscodeshift parses `--deprecations=false` to a boolean
  const deprecations = options?.deprecations ?? true;
  const improvements = options?.improvements ?? false;
  if (![true, false, 'only'].includes(deprecations))
    throw new Error(
      `--deprecations must be false or only, not ${JSON.stringify(deprecations)}`,
    );
  if (![true, false, 'only'].includes(improvements))
    throw new Error(
      `--improvements must be true or only, not ${JSON.stringify(improvements)}`,
    );
  if (improvements === 'only')
    return { breaking: false, deprecations: false, improvements: true };
  return {
    breaking: deprecations !== 'only',
    deprecations: deprecations !== false,
    improvements,
  };
}

module.exports = function transformer(fileInfo, api, options) {
  const passes = passesFor(options);
  const names = [
    ...(passes.breaking ? [NAMES] : []),
    ...(passes.deprecations ? DEPRECATED_NAMES : []),
    ...(passes.improvements ? [IMPROVEMENT_NAMES] : []),
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
      dirty = dropNoopCatches(j, root, fileInfo.path) || dirty;
    if (fileInfo.source.includes('fetchedAt'))
      dirty = passFetchedAt(j, root) || dirty;
  }
  if (passes.deprecations)
    dirty = migrateDeprecations(j, root, fileInfo) || dirty;
  if (passes.improvements)
    dirty = adoptImprovements(j, root, fileInfo) || dirty;
  return printIf(dirty, root, fileInfo.source);
};

// recast wraps a reprinted line longer than wrapColumn, reformatting code the codemod only extended
const printIf = (dirty, root, source) =>
  dirty ? root.toSource({ quote: 'single', wrapColumn: Infinity }) : source;

module.exports.parser = 'tsx';
