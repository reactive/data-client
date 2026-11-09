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
 *      are wrapped where they are passed: `managers={() => managers}`. Exported variables are
 *      wrapped too, since other modules wrap them where they pass them.
 *   2. Drops `initManager()`'s third argument, which 0.19 removed.
 *   3. `fetchIfStale()` always returns a Promise:
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
  /managers|initManager|prepareStore|createPersistedStore|fetchIfStale/;
// calls whose object argument has a `managers` option
const OPTION_CALLS = new Set([
  'createDataClient',
  'mountDataClient',
  'renderDataHook',
  // makeRenderDataHook() docs name its result renderDataClient()
  'renderDataClient',
]);
// calls that take managers as a positional argument, and its index
const POSITIONAL_CALLS = new Map([
  ['prepareStore', 1],
  ['createPersistedStore', 0],
]);

const isId = (node, name) => node?.type === 'Identifier' && node.name === name;

const isProperty = node =>
  node.type === 'ObjectProperty' || node.type === 'Property';

const isFunction = node =>
  node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression';

// `undefined` selects the default Managers, so it stays as it is
const isUndefined = node =>
  isId(node, 'undefined') ||
  (node.type === 'UnaryExpression' && node.operator === 'void');

const isGetDefaultManagersCall = node =>
  node.type === 'CallExpression' && isId(node.callee, 'getDefaultManagers');

const calleeName = node =>
  node.callee.type === 'Identifier' ? node.callee.name
  : node.callee.type === 'MemberExpression' && !node.callee.computed ?
    node.callee.property.name
  : undefined;

/** Paths to every expression passed as `managers` */
function findManagerSlots(j, root) {
  const slots = [];
  const optionOf = objectPath => {
    if (objectPath.node?.type !== 'ObjectExpression') return;
    objectPath.get('properties').each(prop => {
      const { node } = prop;
      if (
        isProperty(node) &&
        !node.computed &&
        (isId(node.key, 'managers') || node.key.value === 'managers')
      )
        slots.push(prop.get('value'));
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
    ((parent.type === 'MemberExpression' ||
      parent.type === 'OptionalMemberExpression') &&
      parent.property === p.node &&
      !parent.computed) ||
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

const FETCH_IF_STALE_TODO =
  ' TODO(data-client): fetchIfStale() always returns a Promise since 0.19; await it to read the data: ' +
  'https://dataclient.io/blog/2026/10/03/v0.19-batch-set#fetch-if-stale-promise';
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

/** The statement to comment on; for `else if`, the whole `if` chain */
function statementOf(j, path) {
  let statement = j(path).closest(j.Statement).paths()[0];
  while (
    statement.parent.node.type === 'IfStatement' &&
    statement.parent.node.alternate === statement.node
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
    const { node } = statementOf(j, read);
    const comments = node.comments || (node.comments = []);
    // a statement can read several times, and the codemod can run again
    if (comments.some(c => c.value === FETCH_IF_STALE_TODO)) return;
    comments.push(j.commentLine(FETCH_IF_STALE_TODO, true, false));
    dirty = true;
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
  dirty = transformInitManager(j, root) || dirty;
  dirty = transformFetchIfStale(j, root, fileInfo.source) || dirty;

  return dirty ? root.toSource({ quote: 'single' }) : fileInfo.source;
};

module.exports.parser = 'tsx';
