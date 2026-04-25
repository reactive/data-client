'use strict';

/**
 * @data-client v0.17 migration codemod
 *
 * Transforms:
 *   1. Schema.denormalize(input, args, unvisit) → denormalize(input, delegate)
 *      - Class methods, object methods, function declarations
 *      - TypeScript method signatures and property types
 *      - Renames usages: unvisit(...) → delegate.unvisit(...), args → delegate.args
 *      - Pass-through calls foo.denormalize(input, args, unvisit)
 *        → foo.denormalize(input, delegate) when delegate is in scope
 *   2. Adds `IDenormalizeDelegate` import from `@data-client/endpoint` (or
 *      `@data-client/rest` / `@data-client/normalizr` if those are already used)
 *      when type annotations are required.
 *
 * Usage:
 *   npx jscodeshift -t https://dataclient.io/codemods/v0.17.js --extensions=ts,tsx,js,jsx src/
 */

const DATA_CLIENT_PREFIX = '@data-client/';
const DELEGATE_TYPE_NAME = 'IDenormalizeDelegate';

function hasDataClientImport(j, root) {
  return (
    root.find(j.ImportDeclaration).filter(p => {
      const v = p.node.source.value;
      return typeof v === 'string' && v.startsWith(DATA_CLIENT_PREFIX);
    }).length > 0
  );
}

// --- helpers --------------------------------------------------------------

function getParamName(param) {
  if (!param) return undefined;
  if (param.type === 'Identifier') return param.name;
  if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier')
    return param.left.name;
  if (param.type === 'TSParameterProperty' && param.parameter)
    return getParamName(param.parameter);
  return undefined;
}

function isDenormalizeKey(key) {
  if (!key) return false;
  if (key.type === 'Identifier') return key.name === 'denormalize';
  if (key.type === 'StringLiteral' || key.type === 'Literal')
    return key.value === 'denormalize';
  return false;
}

// Broader for type-only declarations (class fields, property signatures):
// matches `denormalize`, `_denormalize`, `_denormalizeNullable`, etc.
const DENORMALIZE_LIKE = /^_?denormalize(Nullable)?$/;
function isDenormalizeLikeKey(key) {
  if (!key) return false;
  if (key.type === 'Identifier') return DENORMALIZE_LIKE.test(key.name);
  if (key.type === 'StringLiteral' || key.type === 'Literal')
    return DENORMALIZE_LIKE.test(String(key.value));
  return false;
}

function buildDelegateParam(j, withTypes) {
  const id = j.identifier('delegate');
  if (withTypes) {
    id.typeAnnotation = j.tsTypeAnnotation(
      j.tsTypeReference(j.identifier(DELEGATE_TYPE_NAME)),
    );
  }
  return id;
}

function paramsLookLikeDenormalize(params) {
  if (!params || params.length !== 3) return false;
  const argsName = getParamName(params[1]);
  const unvisitName = getParamName(params[2]);
  if (argsName === 'args' && unvisitName === 'unvisit') return true;
  if (argsName === '_args' && unvisitName === '_unvisit') return true;
  // Typed signature where 3rd param looks like a function type.
  const ta3 = params[2] && params[2].typeAnnotation;
  const tn = ta3 && (ta3.typeAnnotation || ta3);
  if (
    tn &&
    (tn.type === 'TSFunctionType' || tn.type === 'FunctionTypeAnnotation')
  )
    return true;
  return false;
}

// Rewrite identifier references inside a method body NodePath:
//   <argsName>           → delegate.args
//   <unvisitName>(...)   → delegate.unvisit(...)
//   foo.denormalize(x, args, unvisit) → foo.denormalize(x, delegate)
function rewriteBody(j, methodPath, argsName, unvisitName) {
  const bodyCol = j(methodPath).find(j.BlockStatement).at(0);
  if (!bodyCol.length) return;
  const bodyPath = bodyCol.paths()[0];
  const body = j(bodyPath);

  function isShadowed(p, name) {
    let cur = p;
    while (cur && cur.parent) {
      cur = cur.parent;
      if (cur.node === bodyPath.node) return false;
      const t = cur.node.type;
      if (
        t === 'FunctionDeclaration' ||
        t === 'FunctionExpression' ||
        t === 'ArrowFunctionExpression' ||
        t === 'ObjectMethod' ||
        t === 'ClassMethod' ||
        t === 'MethodDefinition'
      ) {
        const params =
          (cur.node.params && cur.node.params) ||
          (cur.node.value && cur.node.value.params) ||
          [];
        if (params.some(prm => getParamName(prm) === name)) return true;
      }
    }
    return false;
  }

  // 1. Rewrite pass-through calls: x.denormalize(input, args, unvisit) → x.denormalize(input, delegate)
  body
    .find(j.CallExpression)
    .filter(p => {
      const callee = p.node.callee;
      if (!callee || callee.type !== 'MemberExpression') return false;
      if (!isDenormalizeKey(callee.property)) return false;
      const args = p.node.arguments;
      if (args.length !== 3) return false;
      return (
        args[1].type === 'Identifier' &&
        args[1].name === argsName &&
        args[2].type === 'Identifier' &&
        args[2].name === unvisitName
      );
    })
    .forEach(p => {
      if (isShadowed(p, argsName) || isShadowed(p, unvisitName)) return;
      p.node.arguments = [p.node.arguments[0], j.identifier('delegate')];
    });

  // 2. unvisit(...) → delegate.unvisit(...)
  if (unvisitName) {
    body
      .find(j.CallExpression, {
        callee: { type: 'Identifier', name: unvisitName },
      })
      .forEach(p => {
        if (isShadowed(p, unvisitName)) return;
        p.node.callee = j.memberExpression(
          j.identifier('delegate'),
          j.identifier('unvisit'),
        );
      });

    // bare reference: passing `unvisit` to another fn → `delegate.unvisit`
    body
      .find(j.Identifier, { name: unvisitName })
      .filter(p => {
        const parent = p.parent.node;
        if (!parent) return false;
        if (
          parent.type === 'MemberExpression' &&
          parent.property === p.node &&
          !parent.computed
        )
          return false;
        if (
          (parent.type === 'Property' || parent.type === 'ObjectProperty') &&
          parent.key === p.node &&
          !parent.computed
        )
          return false;
        if (parent.type === 'CallExpression' && parent.callee === p.node)
          return false;
        if (parent.type === 'VariableDeclarator' && parent.id === p.node)
          return false;
        return true;
      })
      .forEach(p => {
        if (isShadowed(p, unvisitName)) return;
        j(p).replaceWith(
          j.memberExpression(j.identifier('delegate'), j.identifier('unvisit')),
        );
      });
  }

  // 3. bare `args` → `delegate.args`
  if (argsName) {
    body
      .find(j.Identifier, { name: argsName })
      .filter(p => {
        const parent = p.parent.node;
        if (!parent) return false;
        if (
          parent.type === 'MemberExpression' &&
          parent.property === p.node &&
          !parent.computed
        )
          return false;
        if (
          (parent.type === 'Property' || parent.type === 'ObjectProperty') &&
          parent.key === p.node &&
          !parent.computed
        )
          return false;
        if (parent.type === 'VariableDeclarator' && parent.id === p.node)
          return false;
        if (
          parent.type === 'TSTypeReference' ||
          parent.type === 'TSQualifiedName'
        )
          return false;
        return true;
      })
      .forEach(p => {
        if (isShadowed(p, argsName)) return;
        j(p).replaceWith(
          j.memberExpression(j.identifier('delegate'), j.identifier('args')),
        );
      });
  }
}

// --- runtime denormalize methods (class/object/function) -------------------

function transformDenormalizeMethods(j, root, state) {
  let dirty = false;

  function processFunctionLike(methodPath, paramsHolder) {
    const params = paramsHolder.params;
    if (!paramsLookLikeDenormalize(params)) return false;
    const argsName = getParamName(params[1]);
    const unvisitName = getParamName(params[2]);

    paramsHolder.params = [params[0], buildDelegateParam(j, state.useTypes)];
    rewriteBody(j, methodPath, argsName, unvisitName);

    if (state.useTypes) state.needsImport = true;
    return true;
  }

  // ClassMethod (Babel/tsx parser)
  if (j.ClassMethod) {
    root.find(j.ClassMethod).forEach(p => {
      if (!isDenormalizeKey(p.node.key)) return;
      if (processFunctionLike(p, p.node)) dirty = true;
    });
  }

  // MethodDefinition (ESTree)
  if (j.MethodDefinition) {
    root.find(j.MethodDefinition).forEach(p => {
      if (!isDenormalizeKey(p.node.key)) return;
      const fn = p.node.value;
      if (!fn) return;
      // For MethodDefinition, search inside the FunctionExpression value.
      const fnPath = p.get('value');
      if (processFunctionLike(fnPath, fn)) dirty = true;
    });
  }

  // ObjectMethod (Babel)
  if (j.ObjectMethod) {
    root.find(j.ObjectMethod).forEach(p => {
      if (!isDenormalizeKey(p.node.key)) return;
      if (processFunctionLike(p, p.node)) dirty = true;
    });
  }

  // Property: { denormalize: function(...) {} } and { denormalize: (...) => {} }
  root
    .find(j.Property)
    .filter(p => {
      if (!isDenormalizeKey(p.node.key)) return false;
      const v = p.node.value;
      return (
        v &&
        (v.type === 'FunctionExpression' ||
          v.type === 'ArrowFunctionExpression')
      );
    })
    .forEach(p => {
      const fn = p.node.value;
      const fnPath = p.get('value');
      if (processFunctionLike(fnPath, fn)) dirty = true;
    });

  // Top-level: function denormalize(input, args, unvisit) { ... }
  root.find(j.FunctionDeclaration).forEach(p => {
    if (!p.node.id || p.node.id.name !== 'denormalize') return;
    if (processFunctionLike(p, p.node)) dirty = true;
  });

  return dirty;
}

// --- TS interface / type signatures ---------------------------------------

function transformTypeSignatures(j, root, state) {
  if (!j.TSMethodSignature && !j.TSPropertySignature) return false;
  let dirty = false;

  if (j.TSMethodSignature) {
    root.find(j.TSMethodSignature).forEach(p => {
      if (!isDenormalizeKey(p.node.key)) return;
      const params = p.node.parameters || p.node.params;
      if (!paramsLookLikeDenormalize(params)) return;
      const newParams = [params[0], buildDelegateParam(j, true)];
      if (p.node.parameters) p.node.parameters = newParams;
      else p.node.params = newParams;
      state.needsImport = true;
      dirty = true;
    });
  }

  function rewriteFnTypeNode(fn) {
    if (!fn) return false;
    if (fn.type !== 'TSFunctionType') return false;
    const params = fn.parameters;
    if (!paramsLookLikeDenormalize(params)) return false;
    fn.parameters = [params[0], buildDelegateParam(j, true)];
    state.needsImport = true;
    return true;
  }

  if (j.TSPropertySignature) {
    root.find(j.TSPropertySignature).forEach(p => {
      if (!isDenormalizeLikeKey(p.node.key)) return;
      const ann = p.node.typeAnnotation;
      if (!ann || !ann.typeAnnotation) return;
      if (rewriteFnTypeNode(ann.typeAnnotation)) dirty = true;
    });
  }

  ['ClassProperty', 'PropertyDefinition'].forEach(t => {
    if (!j[t]) return;
    root.find(j[t]).forEach(p => {
      if (!isDenormalizeLikeKey(p.node.key)) return;
      const ann = p.node.typeAnnotation;
      if (!ann || !ann.typeAnnotation) return;
      if (rewriteFnTypeNode(ann.typeAnnotation)) dirty = true;
    });
  });

  return dirty;
}

// --- Import injection -----------------------------------------------------

function ensureDelegateImport(j, root) {
  let alreadyImported = false;
  root.find(j.ImportDeclaration).forEach(p => {
    if (alreadyImported) return;
    p.node.specifiers.forEach(s => {
      if (
        s.type === 'ImportSpecifier' &&
        s.imported &&
        s.imported.name === DELEGATE_TYPE_NAME
      ) {
        alreadyImported = true;
      }
    });
  });
  if (alreadyImported) return false;

  const preferred = [
    '@data-client/endpoint',
    '@data-client/rest',
    '@data-client/normalizr',
  ];
  let target = null;
  for (const name of preferred) {
    const found = root
      .find(j.ImportDeclaration)
      .filter(p => p.node.source.value === name);
    if (found.length) {
      target = found.paths()[0];
      break;
    }
  }
  if (!target) {
    const newImport = j.importDeclaration(
      [j.importSpecifier(j.identifier(DELEGATE_TYPE_NAME))],
      j.stringLiteral('@data-client/endpoint'),
    );
    newImport.importKind = 'type';
    const allImports = root.find(j.ImportDeclaration);
    if (allImports.length) {
      const paths = allImports.paths();
      j(paths[paths.length - 1]).insertAfter(newImport);
    } else {
      root.get().node.program.body.unshift(newImport);
    }
    return true;
  }

  // Inline `type` keyword so this works under verbatimModuleSyntax /
  // consistent-type-imports without importing a value at runtime.
  const spec = j.importSpecifier(j.identifier(DELEGATE_TYPE_NAME));
  spec.importKind = 'type';
  target.node.specifiers.push(spec);
  return true;
}

// --- Main -----------------------------------------------------------------

module.exports = function transformer(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  if (!hasDataClientImport(j, root)) return undefined;

  const isTs = /\.tsx?$/.test(fileInfo.path || '');
  const state = { useTypes: isTs, needsImport: false };

  let dirty = false;
  dirty = transformDenormalizeMethods(j, root, state) || dirty;
  dirty = transformTypeSignatures(j, root, state) || dirty;

  if (state.needsImport) {
    ensureDelegateImport(j, root);
  }

  return dirty ? root.toSource({ quote: 'single' }) : undefined;
};

module.exports.parser = 'tsx';
