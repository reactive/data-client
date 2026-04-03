'use strict';

/**
 * @data-client v0.15 migration codemod
 *
 * Transforms:
 *   1. useDebounce() plain value → [value] array destructuring
 *   2. state.entityMeta → state.entitiesMeta
 *   3. MemoCache.buildQueryKey / .query state arg consolidation
 *   4. INVALID import → delegate.INVALID
 *
 * Usage:
 *   npx jscodeshift -t https://dataclient.io/codemods/v0.15.js --extensions=ts,tsx,js,jsx src/
 */

// --- useDebounce() → [value, isPending] ---

function transformUseDebounce(j, root) {
  let dirty = false;

  const localNames = new Set();
  root.find(j.ImportDeclaration).forEach(importPath => {
    const source = importPath.node.source.value;
    if (source !== '@data-client/react' && source !== '@data-client/vue')
      return;
    importPath.node.specifiers.forEach(s => {
      if (
        s.type === 'ImportSpecifier' &&
        s.imported &&
        (s.imported.name === 'useDebounce' ||
          s.imported.value === 'useDebounce')
      ) {
        localNames.add(s.local.name);
      }
    });
  });
  if (!localNames.size) return false;

  root.find(j.VariableDeclarator).forEach(declPath => {
    const init = declPath.node.init;
    if (
      !init ||
      init.type !== 'CallExpression' ||
      !init.callee ||
      init.callee.type !== 'Identifier' ||
      !localNames.has(init.callee.name) ||
      declPath.node.id.type !== 'Identifier'
    ) {
      return;
    }
    const pattern = j.arrayPattern([j.identifier(declPath.node.id.name)]);
    declPath.node.id = pattern;
    dirty = true;
  });

  return dirty;
}

// --- state.entityMeta → state.entitiesMeta ---

function transformEntityMeta(j, root) {
  let dirty = false;

  const memberTypes = [j.MemberExpression];
  try {
    memberTypes.push(j.OptionalMemberExpression);
  } catch (_) {}

  memberTypes.forEach(type => {
    root
      .find(type, {
        computed: false,
        property: { type: 'Identifier', name: 'entityMeta' },
      })
      .forEach(path => {
        path.node.property.name = 'entitiesMeta';
        dirty = true;
      });
  });

  root.find(j.StringLiteral, { value: 'entityMeta' }).forEach(path => {
    const parent = path.parent.node;
    if (
      (parent.type === 'Property' || parent.type === 'ObjectProperty') &&
      parent.key === path.node
    ) {
      path.node.value = 'entitiesMeta';
      if (path.node.extra) {
        delete path.node.extra.raw;
        delete path.node.extra.rawValue;
      }
      dirty = true;
    }
  });

  const propertyTypes = [j.Property];
  try {
    propertyTypes.push(j.ObjectProperty);
  } catch (_) {}

  propertyTypes.forEach(type => {
    root
      .find(type, {
        computed: false,
        key: { type: 'Identifier', name: 'entityMeta' },
      })
      .forEach(path => {
        const prop = path.node;
        prop.key = j.identifier('entitiesMeta');
        if (prop.shorthand) {
          prop.shorthand = false;
        }
        dirty = true;
      });
  });

  return dirty;
}

// --- MemoCache.buildQueryKey / .query state consolidation ---

function transformMemoCacheState(j, root) {
  let dirty = false;

  root.find(j.CallExpression).forEach(callPath => {
    const callee = callPath.node.callee;
    if (
      !callee ||
      callee.type !== 'MemberExpression' ||
      callee.property.type !== 'Identifier'
    )
      return;

    const method = callee.property.name;
    if (method !== 'buildQueryKey' && method !== 'query') return;

    const args = callPath.node.arguments;
    // buildQueryKey(schema, args, X.entities, X.indexes, ...rest)
    // query(schema, args, X.entities, X.indexes)
    if (args.length < 4) return;

    const entitiesArg = args[2];
    const indexesArg = args[3];

    if (
      entitiesArg.type !== 'MemberExpression' ||
      indexesArg.type !== 'MemberExpression' ||
      entitiesArg.property.type !== 'Identifier' ||
      indexesArg.property.type !== 'Identifier' ||
      entitiesArg.property.name !== 'entities' ||
      indexesArg.property.name !== 'indexes'
    )
      return;

    const objA = entitiesArg.object;
    const objB = indexesArg.object;
    if (!nodesEqual(objA, objB)) return;

    const rest = args.slice(4);
    callPath.node.arguments = [args[0], args[1], objA, ...rest];
    dirty = true;
  });

  return dirty;
}

function nodesEqual(a, b) {
  if (a.type !== b.type) return false;
  if (a.type === 'Identifier') return a.name === b.name;
  if (a.type === 'MemberExpression') {
    return nodesEqual(a.object, b.object) && nodesEqual(a.property, b.property);
  }
  if (a.type === 'ThisExpression') return true;
  return false;
}

// --- INVALID import → delegate.INVALID ---

function isValuePosition(idPath) {
  const parent = idPath.parent.node;

  // Skip: import specifier
  if (
    parent.type === 'ImportSpecifier' &&
    (parent.imported === idPath.node || parent.local === idPath.node)
  )
    return false;

  // Skip: export specifier
  if (
    parent.type === 'ExportSpecifier' &&
    (parent.local === idPath.node || parent.exported === idPath.node)
  )
    return false;

  // Skip: non-computed member property (obj.INVALID — the .INVALID part)
  if (
    (parent.type === 'MemberExpression' ||
      parent.type === 'OptionalMemberExpression') &&
    parent.property === idPath.node &&
    !parent.computed
  )
    return false;

  // Skip: object property key (non-computed)
  if (
    (parent.type === 'Property' || parent.type === 'ObjectProperty') &&
    parent.key === idPath.node &&
    !parent.computed
  )
    return false;

  return true;
}

function transformInvalid(j, root) {
  let dirty = false;

  root.find(j.ImportDeclaration).forEach(importPath => {
    const source = importPath.node.source.value;
    if (source !== '@data-client/endpoint') return;

    const specs = importPath.node.specifiers;
    const idx = specs.findIndex(
      s =>
        s.type === 'ImportSpecifier' &&
        s.imported &&
        (s.imported.name === 'INVALID' || s.imported.value === 'INVALID'),
    );
    if (idx === -1) return;

    const localName = specs[idx].local.name;

    // First pass: delegate.setEntity(schema, pk, INVALID)
    //          → delegate.invalidate(schema, pk)
    root.find(j.CallExpression).forEach(callPath => {
      const callee = callPath.node.callee;
      if (
        !callee ||
        callee.type !== 'MemberExpression' ||
        callee.property.type !== 'Identifier' ||
        callee.property.name !== 'setEntity'
      )
        return;
      const args = callPath.node.arguments;
      if (args.length < 3) return;
      const last = args[args.length - 1];
      if (last.type !== 'Identifier' || last.name !== localName) return;

      callee.property.name = 'invalidate';
      callPath.node.arguments = args.slice(0, -1);
      dirty = true;
    });

    // Second pass: remaining INVALID references → delegate.INVALID
    root.find(j.Identifier, { name: localName }).forEach(idPath => {
      if (!isValuePosition(idPath)) return;

      j(idPath).replaceWith(
        j.memberExpression(j.identifier('delegate'), j.identifier('INVALID')),
      );
      dirty = true;
    });

    // Keep the INVALID import when it is still needed by local exports:
    // `export { INVALID }` must retain a local INVALID binding.
    const hasLocalExport = root.find(j.ExportSpecifier).filter(specPath => {
      const exportDecl = specPath.parent.node;
      return (
        exportDecl.type === 'ExportNamedDeclaration' &&
        !exportDecl.source &&
        specPath.node.local &&
        specPath.node.local.type === 'Identifier' &&
        specPath.node.local.name === localName
      );
    }).length;

    if (!hasLocalExport) {
      specs.splice(idx, 1);
      if (!specs.length) {
        j(importPath).remove();
      }
      dirty = true;
    }
  });

  return dirty;
}

// --- Main ---

module.exports = function transformer(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  let dirty = false;

  dirty = transformUseDebounce(j, root) || dirty;
  dirty = transformEntityMeta(j, root) || dirty;
  dirty = transformMemoCacheState(j, root) || dirty;
  dirty = transformInvalid(j, root) || dirty;

  return dirty ? root.toSource({ quote: 'single' }) : undefined;
};

module.exports.parser = 'tsx';
