'use strict';

/**
 * @data-client v0.19 migration codemod
 *
 * Transforms:
 *   1. `managers` arrays → functions that return them:
 *      - `<DataProvider managers={...}>` (any JSX element's `managers` attribute)
 *      - `app.use(DataClientPlugin, { managers })`, `[DataClientPlugin, { managers }]`,
 *        `createDataClient({ managers })`, `mountDataClient(component, { managers })`
 *      - `prepareStore(initialState, managers, ...)`, `createPersistedStore(managers)`
 *      `getDefaultManagers()` becomes `getDefaultManagers`. A variable holding an array literal or
 *      `getDefaultManagers(...)` becomes a function when it is only used as `managers`; other values
 *      are wrapped where they are passed: `managers={() => managers}`. Exported variables are
 *      wrapped too, since other modules wrap them where they pass them.
 *   2. Drops `initManager()`'s third argument, which 0.19 removed.
 *
 * Usage:
 *   npx @data-client/codemods v0.19 src/
 */

const DATA_CLIENT_PREFIX = '@data-client/';
// calls whose object argument has a `managers` option
const OPTION_CALLS = new Set(['createDataClient', 'mountDataClient']);
// calls that take managers as a positional argument, and its index
const POSITIONAL_CALLS = { prepareStore: 1, createPersistedStore: 0 };

function hasDataClientImport(j, root) {
  return (
    root.find(j.ImportDeclaration).filter(p => {
      const v = p.node.source.value;
      return typeof v === 'string' && v.startsWith(DATA_CLIENT_PREFIX);
    }).length > 0
  );
}

const isFunction = node =>
  node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression';

// `undefined` selects the default Managers, so it stays as it is
const isUndefined = node =>
  (node.type === 'Identifier' && node.name === 'undefined') ||
  (node.type === 'UnaryExpression' && node.operator === 'void');

const isGetDefaultManagersCall = node =>
  node.type === 'CallExpression' &&
  node.callee.type === 'Identifier' &&
  node.callee.name === 'getDefaultManagers';

const calleeName = node =>
  node.callee.type === 'Identifier' ? node.callee.name
  : node.callee.type === 'MemberExpression' && !node.callee.computed ?
    node.callee.property.name
  : undefined;

/** Paths to every expression passed as `managers` */
function findManagerSlots(j, root) {
  const slots = [];
  const optionOf = objectPath => {
    if (!objectPath || objectPath.node.type !== 'ObjectExpression') return;
    objectPath.get('properties').each(prop => {
      const { node } = prop;
      if (
        (node.type === 'ObjectProperty' || node.type === 'Property') &&
        !node.computed &&
        ((node.key.type === 'Identifier' && node.key.name === 'managers') ||
          node.key.value === 'managers')
      ) {
        // `{ managers }` shorthand becomes `{ managers: managers }` if it is wrapped
        slots.push({ path: prop.get('value'), property: node });
      }
    });
  };

  root.find(j.JSXAttribute, { name: { name: 'managers' } }).forEach(attr => {
    const value = attr.node.value;
    if (value && value.type === 'JSXExpressionContainer')
      slots.push({ path: attr.get('value', 'expression') });
  });

  root.find(j.CallExpression).forEach(call => {
    const name = calleeName(call.node);
    const args = call.get('arguments');
    if (
      name === 'use' &&
      call.node.arguments[0]?.type === 'Identifier' &&
      call.node.arguments[0].name === 'DataClientPlugin'
    ) {
      optionOf(args.get(1));
    } else if (OPTION_CALLS.has(name)) {
      call.node.arguments.forEach((_, i) => optionOf(args.get(i)));
    } else if (name in POSITIONAL_CALLS) {
      const i = POSITIONAL_CALLS[name];
      if (call.node.arguments[i]) slots.push({ path: args.get(i) });
    }
  });

  // app plugins in tests: `plugins: [[DataClientPlugin, { managers }]]`
  root.find(j.ArrayExpression).forEach(array => {
    const [plugin] = array.node.elements;
    if (plugin?.type === 'Identifier' && plugin.name === 'DataClientPlugin')
      optionOf(array.get('elements', 1));
  });
  return slots;
}

/** The binding path (`id` of its declaration) for an identifier, if declared in this file */
function bindingOf(path) {
  const scope = path.scope?.lookup(path.node.name);
  return scope?.getBindings()[path.node.name]?.[0];
}

/** Whether every use of a variable is one of the `managers` slots */
function onlyUsedAsManagers(j, root, binding, slotNodes) {
  const name = binding.node.name;
  // other modules may pass `export const managers` too, and they get wrapped
  if (binding.parent.parent?.parent?.node.type === 'ExportNamedDeclaration')
    return false;
  return (
    root
      .find(j.Identifier, { name })
      .filter(p => p !== binding && p.node !== binding.node)
      // JSX names like the `managers` attribute are JSXIdentifiers
      .filter(p => p.node.type === 'Identifier')
      .filter(p => {
        const parent = p.parent.node;
        // object keys and non-computed members are other names
        if (
          (parent.type === 'MemberExpression' ||
            parent.type === 'OptionalMemberExpression') &&
          parent.property === p.node &&
          !parent.computed
        )
          return false;
        if (
          (parent.type === 'ObjectProperty' || parent.type === 'Property') &&
          parent.key === p.node &&
          parent.value !== p.node
        )
          return false;
        return bindingOf(p) === binding;
      })
      .every(p => slotNodes.has(p.node))
  );
}

function toFunctionType(j, typeAnnotation) {
  if (!typeAnnotation || typeAnnotation.type !== 'TSTypeAnnotation')
    return typeAnnotation;
  if (typeAnnotation.typeAnnotation.type === 'TSFunctionType')
    return typeAnnotation;
  const fn = j.tsFunctionType([]);
  fn.typeAnnotation = j.tsTypeAnnotation(typeAnnotation.typeAnnotation);
  return j.tsTypeAnnotation(fn);
}

function transformManagers(j, root) {
  let dirty = false;
  const slots = findManagerSlots(j, root);
  const slotNodes = new Set(slots.map(({ path }) => path.node));

  slots.forEach(({ path, property }) => {
    const node = path.node;
    if (isFunction(node) || isUndefined(node)) return;
    if (node.type === 'Identifier' && node.name === 'getDefaultManagers')
      return;
    if (isGetDefaultManagersCall(node) && node.arguments.length === 0) {
      path.replace(j.identifier('getDefaultManagers'));
      if (property) property.shorthand = false;
      dirty = true;
      return;
    }
    if (node.type === 'Identifier') {
      const binding = bindingOf(path);
      const declaration = binding?.parent.node;
      if (declaration?.type === 'FunctionDeclaration') return;
      if (declaration?.type === 'VariableDeclarator') {
        const init = declaration.init;
        if (init && isFunction(init)) return;
        if (
          init &&
          (init.type === 'ArrayExpression' || isGetDefaultManagersCall(init)) &&
          onlyUsedAsManagers(j, root, binding, slotNodes)
        ) {
          declaration.init = j.arrowFunctionExpression([], init);
          if (declaration.id.typeAnnotation)
            declaration.id.typeAnnotation = toFunctionType(
              j,
              declaration.id.typeAnnotation,
            );
          dirty = true;
          return;
        }
      }
    }
    path.replace(j.arrowFunctionExpression([], node));
    if (property) property.shorthand = false;
    dirty = true;
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

module.exports = function transformer(fileInfo, api) {
  // skip parsing files that can't import @data-client
  if (!fileInfo.source.includes(DATA_CLIENT_PREFIX)) return fileInfo.source;
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  if (!hasDataClientImport(j, root)) return fileInfo.source;

  let dirty = false;
  dirty = transformManagers(j, root) || dirty;
  dirty = transformInitManager(j, root) || dirty;

  return dirty ? root.toSource({ quote: 'single' }) : fileInfo.source;
};

module.exports.parser = 'tsx';
