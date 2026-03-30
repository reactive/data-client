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

  const hasDataClientImport = root
    .find(j.ImportDeclaration)
    .filter(importPath =>
      DATA_CLIENT_PACKAGES.has(importPath.node.source.value),
    ).length;
  if (!hasDataClientImport) return false;

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

function enclosingFunction(path) {
  let cur = path.parent;
  while (cur) {
    const t = cur.node.type;
    if (
      t === 'FunctionDeclaration' ||
      t === 'FunctionExpression' ||
      t === 'ArrowFunctionExpression'
    ) {
      return cur;
    }
    cur = cur.parent;
  }
  return null;
}

function transformUseFetch(j, root) {
  let dirty = false;

  const hasDataClientUseFetch = root
    .find(j.ImportDeclaration)
    .filter(importPath => {
      const source = importPath.node.source.value;
      if (!source.startsWith('@data-client/')) return false;
      return importPath.node.specifiers.some(
        s =>
          s.type === 'ImportSpecifier' &&
          s.imported &&
          (s.imported.name === 'useFetch' || s.imported.value === 'useFetch'),
      );
    }).length;
  if (!hasDataClientUseFetch) return false;

  root.find(j.VariableDeclarator).forEach(declPath => {
    const init = declPath.node.init;
    if (
      !init ||
      init.type !== 'CallExpression' ||
      !init.callee ||
      init.callee.type !== 'Identifier' ||
      init.callee.name !== 'useFetch' ||
      declPath.node.id.type !== 'Identifier'
    ) {
      return;
    }
    const varName = declPath.node.id.name;
    const fnScope = enclosingFunction(declPath);
    if (!fnScope) return;

    const scopeRoot = j(fnScope);

    function rewrite(test) {
      // promise → promise?.resolved === false
      if (test.type === 'Identifier' && test.name === varName) {
        return j.binaryExpression(
          '===',
          j.optionalMemberExpression(
            j.identifier(test.name),
            j.identifier('resolved'),
            false,
            true,
          ),
          j.booleanLiteral(false),
        );
      }
      // !promise → promise?.resolved !== false
      if (
        test.type === 'UnaryExpression' &&
        test.operator === '!' &&
        test.argument.type === 'Identifier' &&
        test.argument.name === varName
      ) {
        return j.binaryExpression(
          '!==',
          j.optionalMemberExpression(
            j.identifier(test.argument.name),
            j.identifier('resolved'),
            false,
            true,
          ),
          j.booleanLiteral(false),
        );
      }
      return null;
    }

    const stopNode = fnScope.node.body;

    [j.IfStatement, j.ConditionalExpression].forEach(type => {
      scopeRoot.find(type).forEach(p => {
        if (isShadowed(p, varName, stopNode)) return;
        const r = rewrite(p.node.test);
        if (r) {
          p.node.test = r;
          dirty = true;
        }
      });
    });

    scopeRoot
      .find(j.LogicalExpression)
      .filter(p => p.node.operator === '&&' || p.node.operator === '||')
      .forEach(p => {
        if (isShadowed(p, varName, stopNode)) return;
        const l = rewrite(p.node.left);
        if (l) {
          p.node.left = l;
          dirty = true;
        }
      });
  });

  return dirty;
}

// --- schema.X namespace → direct imports ---

// These schema members are type-only exports and cannot be imported as values.
// They must stay as schema.Object / schema.Array namespace access.
const TYPE_ONLY_SCHEMAS = new Set(['Object', 'Array']);

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

function patternBindsName(pattern, name) {
  if (!pattern) return false;
  if (pattern.type === 'Identifier') return pattern.name === name;
  if (pattern.type === 'AssignmentPattern')
    return patternBindsName(pattern.left, name);
  if (pattern.type === 'RestElement')
    return patternBindsName(pattern.argument, name);
  if (pattern.type === 'ObjectPattern') {
    return pattern.properties.some(p =>
      p.type === 'RestElement'
        ? patternBindsName(p.argument, name)
        : patternBindsName(p.value, name),
    );
  }
  if (pattern.type === 'ArrayPattern') {
    return pattern.elements.some(e => e && patternBindsName(e, name));
  }
  return false;
}

function collectPatternNames(pattern, out) {
  if (!pattern) return;
  if (pattern.type === 'Identifier') { out.add(pattern.name); return; }
  if (pattern.type === 'AssignmentPattern') return collectPatternNames(pattern.left, out);
  if (pattern.type === 'RestElement') return collectPatternNames(pattern.argument, out);
  if (pattern.type === 'ObjectPattern') {
    pattern.properties.forEach(p =>
      collectPatternNames(p.type === 'RestElement' ? p.argument : p.value, out),
    );
    return;
  }
  if (pattern.type === 'ArrayPattern') {
    pattern.elements.forEach(e => e && collectPatternNames(e, out));
    return;
  }
}

function isShadowed(path, name, stopNode) {
  let cur = path;
  while (cur.parent) {
    cur = cur.parent;
    if (stopNode && cur.node === stopNode) return false;
    const node = cur.node;

    if (
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression'
    ) {
      if (node.params && node.params.some(p => patternBindsName(p, name))) {
        return true;
      }
    }

    if (node.type === 'CatchClause') {
      if (node.param && patternBindsName(node.param, name)) {
        return true;
      }
    }

    if (node.type === 'BlockStatement' || node.type === 'Program') {
      const stmts = node.body || [];
      for (const stmt of stmts) {
        if (stmt.type === 'VariableDeclaration') {
          for (const decl of stmt.declarations) {
            if (patternBindsName(decl.id, name)) return true;
          }
        }
        if (
          (stmt.type === 'FunctionDeclaration' ||
            stmt.type === 'ClassDeclaration') &&
          stmt.id &&
          stmt.id.name === name
        ) {
          return true;
        }
      }
    }

    if (
      node.type === 'ForStatement' ||
      node.type === 'ForInStatement' ||
      node.type === 'ForOfStatement'
    ) {
      const init = node.init || node.left;
      if (init && init.type === 'VariableDeclaration') {
        for (const decl of init.declarations) {
          if (patternBindsName(decl.id, name)) return true;
        }
      }
    }
  }
  return false;
}

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
      if (ip === importPath) return;
      ip.node.specifiers.forEach(s => {
        if (s.local) scopeBindings.add(s.local.name);
      });
    });
    const isTopLevel = parentType =>
      parentType === 'Program' || parentType === 'ExportNamedDeclaration' ||
      parentType === 'ExportDefaultDeclaration';
    root.find(j.VariableDeclaration).forEach(vp => {
      if (isTopLevel(vp.parent.node.type)) {
        vp.node.declarations.forEach(d => collectPatternNames(d.id, scopeBindings));
      }
    });
    root.find(j.FunctionDeclaration).forEach(fp => {
      if (isTopLevel(fp.parent.node.type) && fp.node.id) {
        scopeBindings.add(fp.node.id.name);
      }
    });
    root.find(j.ClassDeclaration).forEach(cp => {
      if (isTopLevel(cp.parent.node.type) && cp.node.id) {
        scopeBindings.add(cp.node.id.name);
      }
    });

    function resolveLocal(name) {
      if (!JS_GLOBALS.has(name) && !scopeBindings.has(name)) {
        return name;
      }
      let candidate = 'Schema' + name;
      while (JS_GLOBALS.has(candidate) || scopeBindings.has(candidate)) {
        candidate = '_' + candidate;
      }
      return candidate;
    }

    root
      .find(j.MemberExpression, {
        object: { type: 'Identifier', name: local },
      })
      .forEach(mp => {
        if (isShadowed(mp, local)) return;
        if (mp.node.property.type === 'Identifier') {
          const name = mp.node.property.name;
          if (TYPE_ONLY_SCHEMAS.has(name)) return;
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
          if (isShadowed(qp, local)) return;
          if (qp.node.right.type === 'Identifier') {
            const name = qp.node.right.name;
            if (TYPE_ONLY_SCHEMAS.has(name)) return;
            if (!used.has(name)) used.set(name, resolveLocal(name));
            j(qp).replaceWith(j.identifier(used.get(name)));
          }
        });
    } catch (_) {}

    if (!used.size) return;

    // Only remove the schema import specifier when there are no remaining
    // bare references (e.g. destructuring, function args, typeof).
    const bareRefs = root.find(j.Identifier, { name: local }).filter(p => {
      const parent = p.parent.node;
      if (
        parent.type === 'ImportSpecifier' &&
        (parent.imported === p.node || parent.local === p.node)
      )
        return false;
      return true;
    });
    if (!bareRefs.length) {
      specs.splice(idx, 1);
    }

    const existingLocals = new Set(
      specs.filter(s => s.type === 'ImportSpecifier').map(s => s.local.name),
    );
    for (const [imported, localName] of [...used.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    )) {
      if (!existingLocals.has(localName)) {
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
