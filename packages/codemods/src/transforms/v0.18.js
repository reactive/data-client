'use strict';

/**
 * @data-client v0.18 migration codemod
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
 *   3. Schema.normalize(input, parent, key, args, visit, delegate, parentEntity?)
 *      → normalize(input, parent, key, delegate, parentEntity?)
 *      - Renames usages: visit(...) → delegate.visit(...), args → delegate.args
 *      - Pass-through calls foo.normalize(input, parent, key, args, visit, delegate)
 *        → foo.normalize(input, parent, key, delegate) when delegate is in scope
 *      - Adds `INormalizeDelegate` import when type annotations are required.
 *
 * Usage:
 *   npx @data-client/codemods v0.18 src/
 */

const DATA_CLIENT_PREFIX = '@data-client/';
// Packages that re-export the delegate types, in order of preference when
// adding the import to an existing declaration.
const DELEGATE_IMPORT_SOURCES = [
  '@data-client/endpoint',
  '@data-client/rest',
  '@data-client/normalizr',
];
const DENORMALIZE_DELEGATE_TYPE_NAME = 'IDenormalizeDelegate';
const NORMALIZE_DELEGATE_TYPE_NAME = 'INormalizeDelegate';

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

function isNormalizeKey(key) {
  if (!key) return false;
  if (key.type === 'Identifier') return key.name === 'normalize';
  if (key.type === 'StringLiteral' || key.type === 'Literal')
    return key.value === 'normalize';
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

function buildDelegateParam(j, name, withTypes, typeName) {
  const id = j.identifier(name || 'delegate');
  if (withTypes) {
    id.typeAnnotation = j.tsTypeAnnotation(
      j.tsTypeReference(j.identifier(typeName)),
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

function paramsLookLikeNormalize(params) {
  if (!params || (params.length !== 6 && params.length !== 7)) return false;
  const argsName = getParamName(params[3]);
  const visitName = getParamName(params[4]);
  if (argsName === 'args' && visitName === 'visit') return true;
  if (argsName === '_args' && visitName === '_visit') return true;
  // Typed signature where 5th param looks like a function type.
  const ta5 = params[4] && params[4].typeAnnotation;
  const tn = ta5 && (ta5.typeAnnotation || ta5);
  if (
    tn &&
    (tn.type === 'TSFunctionType' || tn.type === 'FunctionTypeAnnotation')
  )
    return true;
  return false;
}

// Whether an identifier reference at `p` is rebound by a parameter of a
// function nested inside `bodyNode`.
// Deliberately param-only (unlike v0.16's full lexical check): a `const args`
// inside the body is not treated as shadowing. Change only with tests.
function isShadowedByParam(p, name, bodyNode) {
  for (let cur = p; cur && cur.node !== bodyNode; cur = cur.parent) {
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

// Identifier references that are names, not reads: `x.<name>`, `{ <name>: v }`,
// `const <name> =`.
function isNonReferencePosition(p) {
  const parent = p.parent.node;
  if (!parent) return true;
  if (
    parent.type === 'MemberExpression' &&
    parent.property === p.node &&
    !parent.computed
  )
    return true;
  if (
    (parent.type === 'Property' || parent.type === 'ObjectProperty') &&
    parent.key === p.node &&
    !parent.computed
  )
    return true;
  if (parent.type === 'VariableDeclarator' && parent.id === p.node) return true;
  return false;
}

// Rewrites the references shared by both method kinds:
//   <fnName>             → <delegateName>.<member>   (bare reference, not a call)
//   <argsName>           → <delegateName>.args
// Calls `<fnName>(...)` are handled by each caller because their argument
// rewrites differ.
function rewriteDelegateReferences(
  j,
  body,
  bodyNode,
  { argsName, fnName, member, delegateName },
) {
  const delegateMember = name =>
    j.memberExpression(j.identifier(delegateName), j.identifier(name));

  if (fnName) {
    body
      .find(j.Identifier, { name: fnName })
      .filter(p => {
        if (isNonReferencePosition(p)) return false;
        const parent = p.parent.node;
        return !(parent.type === 'CallExpression' && parent.callee === p.node);
      })
      .forEach(p => {
        if (isShadowedByParam(p, fnName, bodyNode)) return;
        j(p).replaceWith(delegateMember(member));
      });
  }

  if (argsName) {
    body
      .find(j.Identifier, { name: argsName })
      .filter(p => {
        if (isNonReferencePosition(p)) return false;
        const parent = p.parent.node;
        return !(
          parent.type === 'TSTypeReference' || parent.type === 'TSQualifiedName'
        );
      })
      .forEach(p => {
        if (isShadowedByParam(p, argsName, bodyNode)) return;
        j(p).replaceWith(delegateMember('args'));
      });
  }
}

// A block, or an arrow function's expression body
function findMethodBody(methodPath) {
  return methodPath.node.body ? methodPath.get('body') : undefined;
}

// Like j(bodyPath), but its find() also matches the body itself, so an arrow's
// expression body `(…, visit) => visit(…)` is rewritten too
function bodyScope(j, bodyPath) {
  const isInBody = p => {
    for (let cur = p; cur; cur = cur.parent) {
      if (cur.node === bodyPath.value) return true;
    }
    return false;
  };
  return {
    find: (type, filter) =>
      j(bodyPath.parent).find(type, filter).filter(isInBody),
  };
}

// Rewrite identifier references inside a denormalize method body NodePath:
//   <argsName>           → delegate.args
//   <unvisitName>(...)   → delegate.unvisit(...)
//   foo.denormalize(x, args, unvisit) → foo.denormalize(x, delegate)
function rewriteBody(j, methodPath, argsName, unvisitName) {
  const bodyPath = findMethodBody(methodPath);
  if (!bodyPath) return;
  const bodyNode = bodyPath.node;
  const body = bodyScope(j, bodyPath);
  const isShadowed = (p, name) => isShadowedByParam(p, name, bodyNode);

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
  }

  // 3. bare `unvisit` → `delegate.unvisit`; bare `args` → `delegate.args`
  rewriteDelegateReferences(j, body, bodyNode, {
    argsName,
    fnName: unvisitName,
    member: 'unvisit',
    delegateName: 'delegate',
  });
}

function rewriteNormalizeBody(
  j,
  methodPath,
  argsName,
  visitName,
  delegateName,
) {
  const bodyPath = findMethodBody(methodPath);
  if (!bodyPath) return;
  const bodyNode = bodyPath.node;
  const body = bodyScope(j, bodyPath);
  const isShadowed = (p, name) => isShadowedByParam(p, name, bodyNode);

  // 1. Rewrite pass-through calls:
  // x.normalize(input, parent, key, args, visit, delegate[, parentEntity])
  //   → x.normalize(input, parent, key, delegate[, parentEntity])
  body
    .find(j.CallExpression)
    .filter(p => {
      const callee = p.node.callee;
      if (!callee || callee.type !== 'MemberExpression') return false;
      if (!isNormalizeKey(callee.property)) return false;
      const callArgs = p.node.arguments;
      if (callArgs.length !== 6 && callArgs.length !== 7) return false;
      return (
        callArgs[3].type === 'Identifier' &&
        callArgs[3].name === argsName &&
        callArgs[4].type === 'Identifier' &&
        callArgs[4].name === visitName &&
        callArgs[5].type === 'Identifier' &&
        callArgs[5].name === delegateName
      );
    })
    .forEach(p => {
      if (
        isShadowed(p, argsName) ||
        isShadowed(p, visitName) ||
        isShadowed(p, delegateName)
      )
        return;
      p.node.arguments = [
        p.node.arguments[0],
        p.node.arguments[1],
        p.node.arguments[2],
        j.identifier(delegateName),
        ...p.node.arguments.slice(6),
      ];
    });

  // 2. visit(schema, value, parent, key, args) → delegate.visit(schema, value, parent, key)
  if (visitName) {
    body
      .find(j.CallExpression, {
        callee: { type: 'Identifier', name: visitName },
      })
      .forEach(p => {
        if (isShadowed(p, visitName)) return;
        const callArgs = p.node.arguments;
        if (
          callArgs.length === 5 &&
          callArgs[4].type === 'Identifier' &&
          callArgs[4].name === argsName
        ) {
          p.node.arguments = callArgs.slice(0, 4);
        }
        p.node.callee = j.memberExpression(
          j.identifier(delegateName),
          j.identifier('visit'),
        );
      });
  }

  // 3. bare `visit` → `delegate.visit`; bare `args` → `delegate.args`
  rewriteDelegateReferences(j, body, bodyNode, {
    argsName,
    fnName: visitName,
    member: 'visit',
    delegateName,
  });
}

// --- shared walkers --------------------------------------------------------

function isFunctionValue(v) {
  return (
    !!v &&
    (v.type === 'FunctionExpression' || v.type === 'ArrowFunctionExpression')
  );
}

// Visits every runtime function-like declaration whose key passes `isKey`:
// class methods and fields, object methods, `{ key: function/arrow }`
// properties and top-level `function key()`. `rewrite(fnPath, paramsHolder)`
// returns whether it changed anything.
function forEachMethodLike(j, root, isKey, rewrite) {
  let dirty = false;
  const visit = (fnPath, paramsHolder) => {
    if (rewrite(fnPath, paramsHolder)) dirty = true;
  };

  // ClassMethod (Babel/tsx parser)
  if (j.ClassMethod) {
    root.find(j.ClassMethod).forEach(p => {
      if (isKey(p.node.key)) visit(p, p.node);
    });
  }

  // MethodDefinition (ESTree): the function is the `value`.
  if (j.MethodDefinition) {
    root.find(j.MethodDefinition).forEach(p => {
      if (!isKey(p.node.key) || !p.node.value) return;
      visit(p.get('value'), p.node.value);
    });
  }

  // ObjectMethod (Babel)
  if (j.ObjectMethod) {
    root.find(j.ObjectMethod).forEach(p => {
      if (isKey(p.node.key)) visit(p, p.node);
    });
  }

  // { key: function(...) {} }, { key: (...) => {} } and class fields
  // `key = (...) => {}`: Property (ESTree), ObjectProperty and ClassProperty
  // (Babel/tsx parser)
  for (const type of [j.Property, j.ObjectProperty, j.ClassProperty]) {
    root
      .find(type)
      .filter(p => isKey(p.node.key) && isFunctionValue(p.node.value))
      .forEach(p => visit(p.get('value'), p.node.value));
  }

  // Top-level: function key(...) { ... }
  root.find(j.FunctionDeclaration).forEach(p => {
    if (p.node.id && isKey(p.node.id)) visit(p, p.node);
  });

  return dirty;
}

// Visits TS method signatures (keys passing `isMethodKey`) and function-typed
// property signatures / class fields (keys passing `isPropertyKey`).
// `rewriteParams(params)` returns the new parameter list, or null to skip.
function forEachTypeSignature(
  j,
  root,
  { isMethodKey, isPropertyKey, rewriteParams },
) {
  if (!j.TSMethodSignature && !j.TSPropertySignature) return false;
  let dirty = false;

  if (j.TSMethodSignature) {
    root.find(j.TSMethodSignature).forEach(p => {
      if (!isMethodKey(p.node.key)) return;
      const newParams = rewriteParams(p.node.parameters || p.node.params);
      if (!newParams) return;
      if (p.node.parameters) p.node.parameters = newParams;
      else p.node.params = newParams;
      dirty = true;
    });
  }

  function rewriteAnnotatedProperty(p) {
    if (!isPropertyKey(p.node.key)) return;
    const ann = p.node.typeAnnotation;
    const fn = ann && ann.typeAnnotation;
    if (!fn || fn.type !== 'TSFunctionType') return;
    const newParams = rewriteParams(fn.parameters);
    if (!newParams) return;
    fn.parameters = newParams;
    dirty = true;
  }

  if (j.TSPropertySignature) {
    root.find(j.TSPropertySignature).forEach(rewriteAnnotatedProperty);
  }

  ['ClassProperty', 'PropertyDefinition'].forEach(t => {
    if (!j[t]) return;
    root.find(j[t]).forEach(rewriteAnnotatedProperty);
  });

  return dirty;
}

// --- denormalize: (input, args, unvisit) → (input, delegate) ---------------

function denormalizeParams(j, params, withTypes) {
  return [
    params[0],
    buildDelegateParam(
      j,
      'delegate',
      withTypes,
      DENORMALIZE_DELEGATE_TYPE_NAME,
    ),
  ];
}

function transformDenormalizeMethods(j, root, state) {
  return forEachMethodLike(j, root, isDenormalizeKey, (methodPath, holder) => {
    const params = holder.params;
    if (!paramsLookLikeDenormalize(params)) return false;
    const argsName = getParamName(params[1]);
    const unvisitName = getParamName(params[2]);

    holder.params = denormalizeParams(j, params, state.useTypes);
    rewriteBody(j, methodPath, argsName, unvisitName);

    if (state.useTypes) state.neededImports.add(DENORMALIZE_DELEGATE_TYPE_NAME);
    return true;
  });
}

function transformTypeSignatures(j, root, state) {
  return forEachTypeSignature(j, root, {
    isMethodKey: isDenormalizeKey,
    // Type-only declarations also cover `_denormalize`, `_denormalizeNullable`.
    isPropertyKey: isDenormalizeLikeKey,
    rewriteParams(params) {
      if (!paramsLookLikeDenormalize(params)) return null;
      state.neededImports.add(DENORMALIZE_DELEGATE_TYPE_NAME);
      return denormalizeParams(j, params, true);
    },
  });
}

// --- normalize: (input, parent, key, args, visit, delegate, parentEntity?)
//              → (input, parent, key, delegate, parentEntity?) ---------------

function normalizeParams(j, params, delegateName, withTypes) {
  return [
    params[0],
    params[1],
    params[2],
    buildDelegateParam(
      j,
      delegateName,
      withTypes,
      NORMALIZE_DELEGATE_TYPE_NAME,
    ),
    ...params.slice(6),
  ];
}

function transformNormalizeMethods(j, root, state) {
  return forEachMethodLike(j, root, isNormalizeKey, (methodPath, holder) => {
    const params = holder.params;
    if (!paramsLookLikeNormalize(params)) return false;
    const argsName = getParamName(params[3]);
    const visitName = getParamName(params[4]);
    const delegateName = getParamName(params[5]) || 'delegate';

    holder.params = normalizeParams(j, params, delegateName, state.useTypes);
    rewriteNormalizeBody(j, methodPath, argsName, visitName, delegateName);

    if (state.useTypes) state.neededImports.add(NORMALIZE_DELEGATE_TYPE_NAME);
    return true;
  });
}

function transformNormalizeTypeSignatures(j, root, state) {
  return forEachTypeSignature(j, root, {
    isMethodKey: isNormalizeKey,
    isPropertyKey: isNormalizeKey,
    rewriteParams(params) {
      if (!paramsLookLikeNormalize(params)) return null;
      const delegateName = getParamName(params[5]) || 'delegate';
      state.neededImports.add(NORMALIZE_DELEGATE_TYPE_NAME);
      return normalizeParams(j, params, delegateName, true);
    },
  });
}

// --- Import injection -----------------------------------------------------

function ensureDelegateImport(j, root, typeName) {
  let alreadyImported = false;
  root.find(j.ImportDeclaration).forEach(p => {
    if (alreadyImported) return;
    p.node.specifiers.forEach(s => {
      if (
        s.type === 'ImportSpecifier' &&
        s.imported &&
        s.imported.name === typeName
      ) {
        alreadyImported = true;
      }
    });
  });
  if (alreadyImported) return false;

  let target = null;
  for (const name of DELEGATE_IMPORT_SOURCES) {
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
      [j.importSpecifier(j.identifier(typeName))],
      j.stringLiteral(DELEGATE_IMPORT_SOURCES[0]),
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
  const spec = j.importSpecifier(j.identifier(typeName));
  spec.importKind = 'type';
  target.node.specifiers.push(spec);
  return true;
}

// --- Main -----------------------------------------------------------------

module.exports = function transformer(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  if (!hasDataClientImport(j, root)) return fileInfo.source;

  const isTs =
    /\.tsx?$/.test(fileInfo.path || '') ||
    root.find(j.TSTypeAnnotation).length > 0 ||
    root.find(j.TSInterfaceDeclaration).length > 0;
  const state = { useTypes: isTs, neededImports: new Set() };

  let dirty = false;
  dirty = transformDenormalizeMethods(j, root, state) || dirty;
  dirty = transformTypeSignatures(j, root, state) || dirty;
  dirty = transformNormalizeMethods(j, root, state) || dirty;
  dirty = transformNormalizeTypeSignatures(j, root, state) || dirty;

  for (const typeName of state.neededImports) {
    ensureDelegateImport(j, root, typeName);
  }

  return dirty ? root.toSource({ quote: 'single' }) : fileInfo.source;
};

module.exports.parser = 'tsx';
