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
 *      replaces them and must include a NetworkManager, so a list of `new` Managers without one
 *      gets `new NetworkManager()`.
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
 *
 * Usage:
 *   npx @data-client/codemods v0.19 src/
 */

const DATA_CLIENT_PREFIX = '@data-client/';
// every rewrite needs one of these names in the file
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

/** The name `Foo` or `ns.Foo` ends with */
const nameOf = node =>
  node.type === 'Identifier' ? node.name
  : node.type === 'MemberExpression' && !node.computed ? node.property.name
  : undefined;

const calleeName = node => nameOf(node.callee);

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

/** `managers: ...` or `'managers': ...` */
const isManagersProperty = node =>
  isProperty(node) &&
  !node.computed &&
  (isId(node.key, 'managers') || node.key.value === 'managers');

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

/** Whether every use of a variable is one of the `managers` slots */
function onlyUsedAsManagers(j, root, binding, slotNodes) {
  // other modules may pass `export const managers` too, and they get wrapped
  if (binding.parent.parent?.parent?.node.type === 'ExportNamedDeclaration')
    return false;
  return root
    .find(j.Identifier, { name: binding.node.name })
    .filter(
      p =>
        p.node !== binding.node &&
        // JSX names like the `managers` attribute are JSXIdentifiers
        p.node.type === 'Identifier' &&
        !isOtherName(p) &&
        bindingOf(p) === binding,
    )
    .every(p => slotNodes.has(p.node));
}

/** `: Manager[]` becomes `: () => Manager[]` */
function toFunctionType(j, typeAnnotation) {
  const fn = j.tsFunctionType([]);
  fn.typeAnnotation = j.tsTypeAnnotation(typeAnnotation.typeAnnotation);
  return j.tsTypeAnnotation(fn);
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
        return true;
      }
    }
    replace(path, j.arrowFunctionExpression([], node));
    // a call or `getDefaultManagers(...)` creates new Managers on each call; a name may hold
    // shared instances, or already be a function
    if (node.type === 'Identifier' || node.type === 'MemberExpression')
      addTodo(j, path, SHARED_MANAGERS_TODO);
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

/** Comments `text` above the statement holding `path`; returns whether it added the comment */
function addTodo(j, path, text) {
  const { node } = statementOf(j, path);
  const comments = node.comments || (node.comments = []);
  // a statement can need it several times, and the codemod can run again
  if (comments.some(c => c.value === text)) return false;
  comments.push(j.commentLine(text, true, false));
  return true;
}

const CLASS_MEMBERS = new Set(['ClassMethod', 'ClassProperty']);

/** The statement or class member to comment on; for `else if`, the whole `if` chain */
function statementOf(j, path) {
  if (CLASS_MEMBERS.has(path.node.type)) return path;
  let statement = j(path).closest(j.Statement).paths()[0];
  while (
    (statement.parent.node.type === 'IfStatement' &&
      statement.parent.node.alternate === statement.node) ||
    statement.parent.node.type.startsWith('Export')
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
  let dirty = false;
  findSyncReads(j, root).forEach(read => {
    if (addTodo(j, read, FETCH_IF_STALE_TODO)) dirty = true;
  });
  return dirty;
}

function transformFetchIfStale(j, root, source) {
  if (!source.includes('fetchIfStale')) return false;
  let dirty = unwrapPromiseResolve(j, root);
  dirty = renameFetchIfStaleMocks(j, root) || dirty;
  dirty = markSyncReads(j, root) || dirty;
  return dirty;
}

const CLEANUP_DATE_TODO = ` TODO(data-client): NetworkManager.cleanupDate was removed in 0.19: ${BLOG}#manager-cleanup`;
const GET_MIDDLEWARE_TODO = ` TODO(data-client): getMiddleware() was removed in 0.19; define a middleware property: ${BLOG}#manager-middleware`;

const keyName = node => staticName(node.key, node.computed);

/** The function of a `getMiddleware() {}` method or a `getMiddleware = () => {}` property */
const getterOf = member =>
  member.type === 'ClassMethod' ? member
  : isFunction(member.value) ? member.value
  : undefined;

/** The middleware a `getMiddleware` member returns, when it is a function the property can hold */
function returnedMiddleware(member) {
  const fn = getterOf(member);
  // data-client never called a static getMiddleware(), and an async or generator one returns no
  // middleware
  if (!fn || fn.params.length || fn.async || fn.generator || member.static)
    return;
  let body = fn.body;
  if (body.type === 'BlockStatement') {
    if (body.body.length !== 1 || body.body[0].type !== 'ReturnStatement')
      return;
    body = body.body[0].argument;
  }
  // a property initializer runs at construction, while getMiddleware() ran at mount, so only
  // move a function, whose body still runs later
  return isFunction(body) ? body : undefined;
}

const isGetMiddleware = node =>
  CLASS_MEMBERS.has(node.type) && keyName(node) === 'getMiddleware';

/** `x.getMiddleware()` or `x?.getMiddleware()` */
const isGetMiddlewareCall = node =>
  (node.type === 'CallExpression' || node.type === 'OptionalCallExpression') &&
  !node.arguments.length &&
  isMember(node.callee) &&
  !node.callee.computed &&
  isId(node.callee.property, 'getMiddleware');

/** `getMiddleware` members and calls become `middleware` */
function renameGetMiddleware(j, root) {
  let dirty = false;
  // a reference other than a call, such as `this.getMiddleware.bind(this)`, needs the member
  const otherRefs = root
    .find(j.MemberExpression, {
      computed: false,
      property: { name: 'getMiddleware' },
    })
    .filter(p => !isGetMiddlewareCall(p.parent.node));
  otherRefs.forEach(ref => {
    dirty = addTodo(j, ref, GET_MIDDLEWARE_TODO) || dirty;
  });
  let unconverted = otherRefs.size() > 0;
  root
    .find(j.Node)
    .filter(p => isGetMiddleware(p.node))
    .forEach(member => {
      const middleware = !otherRefs.size() && returnedMiddleware(member.node);
      if (!middleware) {
        unconverted = true;
        dirty = addTodo(j, member, GET_MIDDLEWARE_TODO) || dirty;
        return;
      }
      member.replace(middlewareProperty(j, member.node, middleware));
      dirty = true;
    });
  root
    .find(j.Node)
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
      call.replace(middlewareAccess(j, call.node.callee));
      dirty = true;
    });
  return dirty;
}

/** `middleware = ...` keeping the `getMiddleware` member's visibility, return type and comments */
function middlewareProperty(j, member, middleware) {
  const property = j.classProperty(
    j.identifier('middleware'),
    middleware,
    getterOf(member).returnType ?? null,
  );
  property.accessibility = member.accessibility;
  property.comments = member.comments;
  return property;
}

/** `x.getMiddleware` becomes `x.middleware`, and `x?.getMiddleware` becomes `x?.middleware` */
const middlewareAccess = (j, callee) =>
  callee.type === 'OptionalMemberExpression' ?
    j.optionalMemberExpression(
      callee.object,
      j.identifier('middleware'),
      false,
      callee.optional,
    )
  : j.memberExpression(callee.object, j.identifier('middleware'));

/** The declaration and specifier that import `name`, if any. Specifiers this codemod adds have no
 * `local`, so their name is `imported`. */
function importOf(j, root, name) {
  for (const declaration of root.find(j.ImportDeclaration).nodes()) {
    const specifier = declaration.specifiers?.find(
      s =>
        s.type === 'ImportSpecifier' && (s.local ?? s.imported).name === name,
    );
    if (specifier) return { declaration, specifier };
  }
}

/** Imports `name` next to the import of `sibling` or from an existing import of `source`, else adds an import */
function ensureImport(j, root, name, { sibling, source, type = false }) {
  const imported = importOf(j, root, name);
  if (imported) {
    // a value use of a type-only import: make it a value import
    if (!type) {
      delete imported.specifier.importKind;
      if (imported.declaration.importKind === 'type') {
        imported.declaration.importKind = 'value';
        for (const other of imported.declaration.specifiers)
          if (other !== imported.specifier) other.importKind = 'type';
      }
    }
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
  const existing = root
    .find(j.ImportDeclaration, { source: { value: source } })
    .filter(
      p =>
        (p.node.importKind === 'type') === type &&
        p.node.specifiers.every(s => s.type === 'ImportSpecifier'),
    )
    .paths()[0];
  if (existing) {
    existing.node.specifiers.push(specifier);
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

const implementsManager = node =>
  node.implements?.some(i => isId(i.expression, 'Manager'));

/** A Manager class without middleware throws on mount since 0.19, so give it a pass-through */
function addPassThroughMiddleware(j, root) {
  let dirty = false;
  root
    .find(j.Node)
    .filter(
      p =>
        (p.node.type === 'ClassDeclaration' ||
          p.node.type === 'ClassExpression') &&
        !p.node.superClass &&
        implementsManager(p.node) &&
        !p.node.body.body.some(m =>
          ['middleware', 'getMiddleware'].includes(keyName(m)),
        ),
    )
    .forEach(cls => {
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

/** Whether `name` looks like a NetworkManager: by name, by the name it was imported as, or by the
 * class a local class extends */
function isNetworkManagerClass(j, root, name, seen = new Set()) {
  if (!name || seen.has(name)) return false;
  if (/NetworkManager$/.test(name)) return true;
  seen.add(name);
  const imported = importOf(j, root, name)?.specifier.imported.name;
  if (imported && imported !== name)
    return isNetworkManagerClass(j, root, imported, seen);
  // `class X extends Y {}` or `const X = class extends Y {}`
  const local =
    root.find(j.ClassDeclaration, { id: { name } }).nodes()[0] ??
    root.find(j.VariableDeclarator, { id: { name } }).nodes()[0]?.init;
  const superClass = local?.superClass;
  return (
    !!superClass && isNetworkManagerClass(j, root, nameOf(superClass), seen)
  );
}

/** `renderDataHook()` managers must include a NetworkManager since they replace the defaults */
function addNetworkManager(j, root) {
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
    let fn = prop.node.value;
    // `const managers = () => [...]`, as transformManagers() leaves a variable used only here
    if (fn.type === 'Identifier') {
      const declarator = bindingOf(prop.get('value'))?.parent.node;
      fn = declarator?.type === 'VariableDeclarator' && declarator.init;
    }
    const list = isFunction(fn) && fn.body;
    // only a list of `new` Managers shows that none is a NetworkManager
    if (
      list?.type !== 'ArrayExpression' ||
      !list.elements.every(e => e?.type === 'NewExpression') ||
      list.elements.some(e => isNetworkManagerClass(j, root, calleeName(e)))
    )
      return;
    list.elements.push(j.newExpression(j.identifier('NetworkManager'), []));
    ensureImport(j, root, 'NetworkManager', { source: '@data-client/react' });
    dirty = true;
  }
}

/** `NetworkManager.cleanupDate` is gone; what replaces it depends on why the code read it */
function markCleanupDate(j, root) {
  let dirty = false;
  root
    .find(j.Node)
    .filter(
      ({ node }) =>
        isMember(node) &&
        staticName(node.property, node.computed) === 'cleanupDate',
    )
    .forEach(member => {
      dirty = addTodo(j, member, CLEANUP_DATE_TODO) || dirty;
    });
  return dirty;
}

function transformManagerClasses(j, root) {
  let dirty = renameGetMiddleware(j, root);
  dirty = addPassThroughMiddleware(j, root) || dirty;
  dirty = markCleanupDate(j, root) || dirty;
  return dirty;
}

module.exports = function transformer(fileInfo, api) {
  // skip parsing files that have nothing to migrate
  if (
    !fileInfo.source.includes(DATA_CLIENT_PREFIX) ||
    !NAMES.test(fileInfo.source)
  )
    return fileInfo.source;
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  const hasDataClientImport = root
    .find(j.ImportDeclaration)
    .some(p => String(p.node.source.value).startsWith(DATA_CLIENT_PREFIX));
  if (!hasDataClientImport) return fileInfo.source;

  let dirty = false;
  dirty = transformManagers(j, root) || dirty;
  dirty = addNetworkManager(j, root) || dirty;
  dirty = transformInitManager(j, root) || dirty;
  dirty = transformManagerClasses(j, root) || dirty;
  dirty = transformFetchIfStale(j, root, fileInfo.source) || dirty;

  return dirty ? root.toSource({ quote: 'single' }) : fileInfo.source;
};

module.exports.parser = 'tsx';
