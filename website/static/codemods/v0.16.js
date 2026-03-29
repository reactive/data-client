'use strict';

/**
 * @data-client v0.16 migration codemod
 *
 * Transforms:
 *   1. path-to-regexp v6 → v8 syntax in RestEndpoint/resource path strings
 *   2. useFetch() truthiness checks → .resolved checks
 *   3. schema.X namespace → direct imports
 *
 * Usage:
 *   npx jscodeshift -t https://dataclient.io/codemods/v0.16.js --extensions=ts,tsx,js,jsx src/
 */

const DATA_CLIENT_PACKAGES = new Set([
  '@data-client/endpoint',
  '@data-client/rest',
]);

// --- path-to-regexp v6 → v8 ---

function transformPathString(s) {
  // :name(\d+) → :name  (handles nested non-capturing groups)
  s = s.replace(/:(\w+)\((?:[^()]*|\([^()]*\))*\)/g, ':$1');
  // {group}? → {group}
  s = s.replace(/(\{[^}]+\})\?/g, '$1');
  // /:name? → {/:name}  (also handles - . ~ prefixes)
  s = s.replace(/([/\-.~]):(\w+)\?/g, '{$1:$2}');
  // /:name+ → /*name
  s = s.replace(/\/:(\w+)\+/g, '/*$1');
  // /:name* → {/*name}
  s = s.replace(/\/:(\w+)\*/g, '{/*$1}');
  // \? → ?  and  \+ → +  (no longer special in v8)
  s = s.replace(/\\([?+])/g, '$1');
  return s;
}

function transformPaths(j, root) {
  let dirty = false;

  root.find(j.StringLiteral).forEach(path => {
    const parent = path.parent.node;
    if (
      (parent.type === 'Property' || parent.type === 'ObjectProperty') &&
      parent.value === path.node &&
      parent.key &&
      (parent.key.name === 'path' ||
        (parent.key.type === 'StringLiteral' && parent.key.value === 'path'))
    ) {
      const updated = transformPathString(path.node.value);
      if (updated !== path.node.value) {
        path.node.value = updated;
        if (path.node.extra) {
          delete path.node.extra.raw;
          delete path.node.extra.rawValue;
        }
        dirty = true;
      }
    }
  });

  return dirty;
}

// --- useFetch() truthiness → .resolved ---

function transformUseFetch(j, root) {
  let dirty = false;
  const vars = new Set();

  root.find(j.VariableDeclarator).forEach(p => {
    const init = p.node.init;
    if (
      init &&
      init.type === 'CallExpression' &&
      init.callee &&
      init.callee.type === 'Identifier' &&
      init.callee.name === 'useFetch' &&
      p.node.id.type === 'Identifier'
    ) {
      vars.add(p.node.id.name);
    }
  });

  if (!vars.size) return dirty;

  function rewrite(test) {
    // promise → !promise.resolved
    if (test.type === 'Identifier' && vars.has(test.name)) {
      return j.unaryExpression(
        '!',
        j.memberExpression(j.identifier(test.name), j.identifier('resolved')),
      );
    }
    // !promise → promise.resolved
    if (
      test.type === 'UnaryExpression' &&
      test.operator === '!' &&
      test.argument.type === 'Identifier' &&
      vars.has(test.argument.name)
    ) {
      return j.memberExpression(
        j.identifier(test.argument.name),
        j.identifier('resolved'),
      );
    }
    return null;
  }

  [j.IfStatement, j.ConditionalExpression].forEach(type => {
    root.find(type).forEach(p => {
      const r = rewrite(p.node.test);
      if (r) {
        p.node.test = r;
        dirty = true;
      }
    });
  });

  root.find(j.LogicalExpression, { operator: '&&' }).forEach(p => {
    const r = rewrite(p.node.left);
    if (r) {
      p.node.left = r;
      dirty = true;
    }
  });

  return dirty;
}

// --- schema.X namespace → direct imports ---

const JS_GLOBALS = new Set([
  'Array',
  'Boolean',
  'Date',
  'Error',
  'Function',
  'JSON',
  'Map',
  'Math',
  'Number',
  'Object',
  'Promise',
  'Proxy',
  'Reflect',
  'RegExp',
  'Set',
  'String',
  'Symbol',
  'WeakMap',
  'WeakSet',
]);

function transformSchemaImports(j, root) {
  let dirty = false;

  root.find(j.ImportDeclaration).forEach(importPath => {
    const source = importPath.node.source.value;
    if (!DATA_CLIENT_PACKAGES.has(source)) return;

    const specs = importPath.node.specifiers;
    const idx = specs.findIndex(
      s =>
        s.type === 'ImportSpecifier' &&
        s.imported &&
        (s.imported.name === 'schema' || s.imported.value === 'schema'),
    );
    if (idx === -1) return;

    const local = specs[idx].local.name;
    // Map from exported name → local identifier to use in code
    const used = new Map();

    const scopeBindings = new Set();
    root.find(j.ImportDeclaration).forEach(ip => {
      ip.node.specifiers.forEach((s, i) => {
        if (ip === importPath && i === idx) return;
        if (s.local) scopeBindings.add(s.local.name);
      });
    });

    function resolveLocal(name) {
      if (JS_GLOBALS.has(name) || scopeBindings.has(name)) {
        return 'Schema' + name;
      }
      return name;
    }

    root
      .find(j.MemberExpression, {
        object: { type: 'Identifier', name: local },
      })
      .forEach(mp => {
        if (mp.node.property.type === 'Identifier') {
          const name = mp.node.property.name;
          if (!used.has(name)) used.set(name, resolveLocal(name));
          j(mp).replaceWith(j.identifier(used.get(name)));
        }
      });

    // TypeScript qualified names: schema.Union in type positions
    try {
      root
        .find(j.TSQualifiedName, {
          left: { type: 'Identifier', name: local },
        })
        .forEach(qp => {
          if (qp.node.right.type === 'Identifier') {
            const name = qp.node.right.name;
            if (!used.has(name)) used.set(name, resolveLocal(name));
            j(qp).replaceWith(j.identifier(used.get(name)));
          }
        });
    } catch (_) {}

    if (!used.size) return;

    specs.splice(idx, 1);

    const existing = new Set(
      specs.filter(s => s.type === 'ImportSpecifier').map(s => s.imported.name),
    );
    for (const [imported, localName] of [...used.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    )) {
      if (!existing.has(imported)) {
        if (imported !== localName) {
          specs.push(
            j.importSpecifier(j.identifier(imported), j.identifier(localName)),
          );
        } else {
          specs.push(j.importSpecifier(j.identifier(imported)));
        }
      }
    }

    dirty = true;
  });

  return dirty;
}

// --- Main ---

module.exports = function transformer(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  let dirty = false;

  dirty = transformPaths(j, root) || dirty;
  dirty = transformUseFetch(j, root) || dirty;
  dirty = transformSchemaImports(j, root) || dirty;

  return dirty ? root.toSource({ quote: 'single' }) : undefined;
};

module.exports.parser = 'tsx';
