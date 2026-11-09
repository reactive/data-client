'use strict';

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
 *   5. `fetchIfStale()` always returns a Promise:
 *      - `Promise.resolve(ctrl.fetchIfStale(...))` becomes the bare call.
 *      - `spyOn(ctrl, 'fetchIfStale').mockReturnValue(data)` becomes `.mockResolvedValue(data)`.
 *      - A statement that reads its result as the data gets a `// TODO(data-client):` comment.
 *   6. Deprecated APIs:
 *      - `Resource.create` becomes `Resource.getList.push` where it runs, for an unchanged `const`
 *        `resource()` declared in the file; DevTools `actionsBlacklist`/`actionsWhitelist` options
 *        become `actionsDenylist`/`actionsAllowlist`.
 *      - Other `*Resource.create`, `waitForNextUpdate()`, `renderDataHook.cleanup()`/`.allSettled()`
 *        and Vue `createDataClient()` get a `// TODO(data-client):` comment.
 *
 * Usage:
 *   npx @data-client/codemods v0.19 src/
 *   npx @data-client/codemods v0.19 src/ --deprecations=false  # skip section 6
 *   npx @data-client/codemods v0.19 src/ --deprecations=only   # just section 6
 */

const DATA_CLIENT_PREFIX = '@data-client/';
// every rewrite outside the deprecated APIs needs one of these names in the file
const NAMES =
  /managers|initManager|prepareStore|createPersistedStore|fetchIfStale|getMiddleware|cleanupDate|\bManager\b/;
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
  node.type === 'ObjectProperty' || node.type === 'Property';

const isFunction = node =>
  node?.type === 'ArrowFunctionExpression' ||
  node?.type === 'FunctionExpression';

// `undefined` selects the default Managers, so it stays as it is
const isUndefined = node =>
  isId(node, 'undefined') ||
  (node.type === 'UnaryExpression' && node.operator === 'void');

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

/** Whether `p` names something else, like an object key or a non-computed member */
function isOtherName(p) {
  const parent = p.parent.node;
  return (
    (isMember(parent) && parent.property === p.node && !parent.computed) ||
    (isProperty(parent) && parent.key === p.node && parent.value !== p.node)
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

/** Whether every use of a variable is one of the `managers` slots */
function onlyUsedAsManagers(j, root, binding, slotNodes) {
  // other modules may pass `export const managers` too, and they get wrapped
  if (binding.parent.parent?.parent?.node.type === 'ExportNamedDeclaration')
    return false;
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
  while (PASS_THROUGH.has(path.parent.node.type)) path = path.parent;
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
    default:
      return false;
  }
}

/** Paths that use a `fetchIfStale()` result as the data: the call itself, or a `const` holding it */
function findSyncReads(j, root) {
  const reads = root
    .find(j.CallExpression)
    .filter(call => isFetchIfStaleCall(call.node) && readsSynchronously(call))
    .paths();
  root
    .find(j.VariableDeclarator, { id: { type: 'Identifier' } })
    .filter(decl => isFetchIfStaleCall(unwrap(decl.node.init)))
    .forEach(decl => {
      const { name } = decl.node.id;
      root.find(j.Identifier, { name }).forEach(ref => {
        if (
          // JSX names are JSXIdentifiers
          ref.node.type === 'Identifier' &&
          ref.node !== decl.node.id &&
          !isOtherName(ref) &&
          bindingOf(ref)?.parent.node === decl.node &&
          readsSynchronously(ref)
        )
          reads.push(ref);
      });
    });
  return reads;
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

/** The `spyOn(obj, 'fetchIfStale')` call under a chain of `.mock*()` calls, if any */
function spiesOnFetchIfStale(node) {
  while (
    node?.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    node.callee.property.name?.startsWith('mock')
  )
    node = node.callee.object;
  return (
    node?.type === 'CallExpression' &&
    calleeName(node) === 'spyOn' &&
    node.arguments[1]?.value === 'fetchIfStale'
  );
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

/** Mocks of the old fresh-data return: `spyOn(ctrl, 'fetchIfStale').mockReturnValue(data)` */
function renameFetchIfStaleMocks(j, root) {
  return (
    root
      .find(j.CallExpression, { callee: { type: 'MemberExpression' } })
      .filter(
        call =>
          MOCK_RENAMES.has(call.node.callee.property.name) &&
          spiesOnFetchIfStale(call.node.callee.object),
      )
      .forEach(call => {
        const { callee } = call.node;
        callee.property = j.identifier(MOCK_RENAMES.get(callee.property.name));
      })
      .size() > 0
  );
}

/** Where to `await` depends on the code around it, so mark the statement instead */
function markSyncReads(j, root) {
  return addTodos(j, findSyncReads(j, root), FETCH_IF_STALE_TODO);
}

function transformFetchIfStale(j, root, source) {
  if (!source.includes('fetchIfStale')) return false;
  let dirty = unwrapPromiseResolve(j, root);
  dirty = renameFetchIfStaleMocks(j, root) || dirty;
  dirty = markSyncReads(j, root) || dirty;
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
      // a spread may hold the new name
      if (!node.properties.every(isProperty)) return;
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

// an extend() that replaces one of these makes create differ from getList.push
const CREATE_SOURCES = new Set(['create', 'getList']);

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
      if (
        first.properties.some(
          p =>
            !isProperty(p) ||
            // a computed key could name either
            keyName(p) === undefined ||
            CREATE_SOURCES.has(keyName(p)),
        )
      )
        return false;
    } else return false;
    path = unwrapPath(path.get('callee', 'object'));
  }
  const [options] = path.node?.arguments ?? [];
  return (
    path.node?.type === 'CallExpression' &&
    path.node.callee.type === 'Identifier' &&
    isImportOf(path.get('callee'), 'resource', '@data-client/rest') &&
    options?.type === 'ObjectExpression' &&
    // a computed key could be Endpoint
    options.properties.every(
      p => isProperty(p) && ![undefined, 'Endpoint'].includes(keyName(p)),
    )
  );
}

/** The outermost member of `X.a.b`, starting at the identifier `X` */
function memberChainOf(path) {
  while (isMember(path.parent.node) && path.parent.node.object === path.node)
    path = path.parent;
  return path;
}

/** Whether the expression at `path` is assigned, incremented or deleted */
function isMutated(path) {
  const parent = path.parent.node;
  return (
    (parent.type === 'AssignmentExpression' && parent.left === path.node) ||
    parent.type === 'UpdateExpression' ||
    (parent.type === 'UnaryExpression' && parent.operator === 'delete')
  );
}

/** Whether every use of a `const` resource reads its members without changing them or passing the
 * resource itself on, so its `create` and `getList` stay what its declaration made them */
function isReadOnlyResource(j, root, binding) {
  if (
    !isPlainResourceDeclarator(binding) ||
    binding.parent.parent.node.kind !== 'const'
  )
    return false;
  return usesOf(j, root, binding).every(p => {
    const parent = p.parent.node;
    // `typeof X` in a type
    if (parent.type === 'TSTypeQuery') return true;
    return (
      isMember(parent) &&
      parent.object === p.node &&
      !parent.computed &&
      !isMutated(memberChainOf(p)) &&
      !escapes(p.parentPath)
    );
  });
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

/** Whether `X.create` at `path` is run (called, or passed to fetch() or a data hook), where a new endpoint
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
function migrateResourceCreate(j, root) {
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
        readOnly.set(binding, isReadOnlyResource(j, root, binding));
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

const importsFrom = (root, source) =>
  importsOf(root).some(d => d.source.value === source);

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

/** `waitForNextUpdate()`, called as a member or destructured from a render */
const findWaitForNextUpdate = (j, root) =>
  root
    .find(j.CallExpression)
    .filter(({ node }) => calleeName(node) === 'waitForNextUpdate')
    .paths();

const DEVTOOLS_NAMES = /actions(Black|White)list/;
const CREATE_NAME = /\.create\b/;
const TEST_HELPER_NAMES = /\.(cleanup|allSettled)\b/;
const VUE_SETUP_NAMES = /createDataClient|ProvidedDataClient/;
const WAIT_FOR_NEXT_UPDATE_NAME = /waitForNextUpdate/;
const DEPRECATED_NAMES = [
  DEVTOOLS_NAMES,
  CREATE_NAME,
  TEST_HELPER_NAMES,
  VUE_SETUP_NAMES,
  WAIT_FOR_NEXT_UPDATE_NAME,
];

function migrateDeprecations(j, root, source) {
  let dirty = false;
  if (DEVTOOLS_NAMES.test(source)) dirty = renameDevToolsOptions(j, root);
  if (CREATE_NAME.test(source)) dirty = migrateResourceCreate(j, root) || dirty;
  if (TEST_HELPER_NAMES.test(source))
    dirty =
      addTodos(j, findSharedTestHelpers(j, root), SHARED_TEST_HELPER_TODO) ||
      dirty;
  if (VUE_SETUP_NAMES.test(source))
    dirty =
      addTodos(j, findVueSetup(j, root), CREATE_DATA_CLIENT_TODO) || dirty;
  // @testing-library has a waitForNextUpdate() too; a local helper may re-export ours
  const isVueTest = importsFrom(root, '@data-client/vue/test');
  if (
    WAIT_FOR_NEXT_UPDATE_NAME.test(source) &&
    (isVueTest ||
      importsFrom(root, '@data-client/test') ||
      !importsOf(root).some(d =>
        d.source.value.startsWith('@testing-library/'),
      ))
  )
    dirty =
      addTodos(
        j,
        findWaitForNextUpdate(j, root),
        isVueTest ? VUE_WAIT_FOR_NEXT_UPDATE_TODO : WAIT_FOR_NEXT_UPDATE_TODO,
      ) || dirty;
  return dirty;
}

/** `--deprecations=false` skips moving off deprecated APIs; `--deprecations=only` does just that */
function passesFor(options) {
  const deprecations = options?.deprecations;
  return {
    breaking: deprecations !== 'only',
    deprecations: deprecations !== false && deprecations !== 'false',
  };
}

module.exports = function transformer(fileInfo, api, options) {
  const passes = passesFor(options);
  const names = [
    ...(passes.breaking ? [NAMES] : []),
    ...(passes.deprecations ? DEPRECATED_NAMES : []),
  ];
  // skip parsing files that have nothing to migrate
  if (
    !fileInfo.source.includes(DATA_CLIENT_PREFIX) ||
    !names.some(name => name.test(fileInfo.source))
  )
    return fileInfo.source;
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  const hasDataClientImport = root
    .find(j.ImportDeclaration)
    .some(p => String(p.node.source.value).startsWith(DATA_CLIENT_PREFIX));
  if (!hasDataClientImport) return fileInfo.source;

  let dirty = false;
  if (passes.breaking) {
    dirty = transformManagers(j, root) || dirty;
    if (/renderData(Hook|Client)/.test(fileInfo.source))
      dirty = addDefaultManagers(j, root) || dirty;
    dirty = transformInitManager(j, root) || dirty;
    dirty = transformManagerClasses(j, root, fileInfo.source) || dirty;
    dirty = transformFetchIfStale(j, root, fileInfo.source) || dirty;
  }
  if (passes.deprecations)
    dirty = migrateDeprecations(j, root, fileInfo.source) || dirty;

  // recast wraps a reprinted line longer than wrapColumn, reformatting code the codemod only extended
  return dirty ?
      root.toSource({ quote: 'single', wrapColumn: Infinity })
    : fileInfo.source;
};

module.exports.parser = 'tsx';
