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
 *   npx jscodeshift -t https://dataclient.io/codemods/v0.18.js --extensions=ts,tsx,js,jsx src/
 */

const DATA_CLIENT_PREFIX = '@data-client/';
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

function buildNamedDelegateParam(j, withTypes, typeName) {
  const id = j.identifier('delegate');
  if (withTypes) {
    id.typeAnnotation = j.tsTypeAnnotation(
      j.tsTypeReference(j.identifier(typeName)),
    );
  }
  return id;
}

function buildDelegateParamWithName(j, name, withTypes, typeName) {
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

function rewriteNormalizeBody(
  j,
  methodPath,
  argsName,
  visitName,
  delegateName,
) {
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

    // bare reference: passing `visit` to another fn → `delegate.visit`
    body
      .find(j.Identifier, { name: visitName })
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
        if (isShadowed(p, visitName)) return;
        j(p).replaceWith(
          j.memberExpression(j.identifier(delegateName), j.identifier('visit')),
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
          j.memberExpression(j.identifier(delegateName), j.identifier('args')),
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

    paramsHolder.params = [
      params[0],
      buildNamedDelegateParam(
        j,
        state.useTypes,
        DENORMALIZE_DELEGATE_TYPE_NAME,
      ),
    ];
    rewriteBody(j, methodPath, argsName, unvisitName);

    if (state.useTypes) state.neededImports.add(DENORMALIZE_DELEGATE_TYPE_NAME);
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
      const newParams = [
        params[0],
        buildNamedDelegateParam(j, true, DENORMALIZE_DELEGATE_TYPE_NAME),
      ];
      if (p.node.parameters) p.node.parameters = newParams;
      else p.node.params = newParams;
      state.neededImports.add(DENORMALIZE_DELEGATE_TYPE_NAME);
      dirty = true;
    });
  }

  function rewriteFnTypeNode(fn) {
    if (!fn) return false;
    if (fn.type !== 'TSFunctionType') return false;
    const params = fn.parameters;
    if (!paramsLookLikeDenormalize(params)) return false;
    fn.parameters = [
      params[0],
      buildNamedDelegateParam(j, true, DENORMALIZE_DELEGATE_TYPE_NAME),
    ];
    state.neededImports.add(DENORMALIZE_DELEGATE_TYPE_NAME);
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

// --- runtime normalize methods (class/object/function) ---------------------

function transformNormalizeMethods(j, root, state) {
  let dirty = false;

  function processFunctionLike(methodPath, paramsHolder) {
    const params = paramsHolder.params;
    if (!paramsLookLikeNormalize(params)) return false;
    const argsName = getParamName(params[3]);
    const visitName = getParamName(params[4]);
    const delegateName = getParamName(params[5]) || 'delegate';

    paramsHolder.params = [
      params[0],
      params[1],
      params[2],
      buildDelegateParamWithName(
        j,
        delegateName,
        state.useTypes,
        NORMALIZE_DELEGATE_TYPE_NAME,
      ),
      ...params.slice(6),
    ];
    rewriteNormalizeBody(j, methodPath, argsName, visitName, delegateName);

    if (state.useTypes) state.neededImports.add(NORMALIZE_DELEGATE_TYPE_NAME);
    return true;
  }

  if (j.ClassMethod) {
    root.find(j.ClassMethod).forEach(p => {
      if (!isNormalizeKey(p.node.key)) return;
      if (processFunctionLike(p, p.node)) dirty = true;
    });
  }

  if (j.MethodDefinition) {
    root.find(j.MethodDefinition).forEach(p => {
      if (!isNormalizeKey(p.node.key)) return;
      const fn = p.node.value;
      if (!fn) return;
      const fnPath = p.get('value');
      if (processFunctionLike(fnPath, fn)) dirty = true;
    });
  }

  if (j.ObjectMethod) {
    root.find(j.ObjectMethod).forEach(p => {
      if (!isNormalizeKey(p.node.key)) return;
      if (processFunctionLike(p, p.node)) dirty = true;
    });
  }

  root
    .find(j.Property)
    .filter(p => {
      if (!isNormalizeKey(p.node.key)) return false;
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

  root.find(j.FunctionDeclaration).forEach(p => {
    if (!p.node.id || p.node.id.name !== 'normalize') return;
    if (processFunctionLike(p, p.node)) dirty = true;
  });

  return dirty;
}

function transformNormalizeTypeSignatures(j, root, state) {
  if (!j.TSMethodSignature && !j.TSPropertySignature) return false;
  let dirty = false;

  if (j.TSMethodSignature) {
    root.find(j.TSMethodSignature).forEach(p => {
      if (!isNormalizeKey(p.node.key)) return;
      const params = p.node.parameters || p.node.params;
      if (!paramsLookLikeNormalize(params)) return;
      const delegateName = getParamName(params[5]) || 'delegate';
      const newParams = [
        params[0],
        params[1],
        params[2],
        buildDelegateParamWithName(
          j,
          delegateName,
          true,
          NORMALIZE_DELEGATE_TYPE_NAME,
        ),
        ...params.slice(6),
      ];
      if (p.node.parameters) p.node.parameters = newParams;
      else p.node.params = newParams;
      state.neededImports.add(NORMALIZE_DELEGATE_TYPE_NAME);
      dirty = true;
    });
  }

  function rewriteFnTypeNode(fn) {
    if (!fn) return false;
    if (fn.type !== 'TSFunctionType') return false;
    const params = fn.parameters;
    if (!paramsLookLikeNormalize(params)) return false;
    const delegateName = getParamName(params[5]) || 'delegate';
    fn.parameters = [
      params[0],
      params[1],
      params[2],
      buildDelegateParamWithName(
        j,
        delegateName,
        true,
        NORMALIZE_DELEGATE_TYPE_NAME,
      ),
      ...params.slice(6),
    ];
    state.neededImports.add(NORMALIZE_DELEGATE_TYPE_NAME);
    return true;
  }

  if (j.TSPropertySignature) {
    root.find(j.TSPropertySignature).forEach(p => {
      if (!isNormalizeKey(p.node.key)) return;
      const ann = p.node.typeAnnotation;
      if (!ann || !ann.typeAnnotation) return;
      if (rewriteFnTypeNode(ann.typeAnnotation)) dirty = true;
    });
  }

  ['ClassProperty', 'PropertyDefinition'].forEach(t => {
    if (!j[t]) return;
    root.find(j[t]).forEach(p => {
      if (!isNormalizeKey(p.node.key)) return;
      const ann = p.node.typeAnnotation;
      if (!ann || !ann.typeAnnotation) return;
      if (rewriteFnTypeNode(ann.typeAnnotation)) dirty = true;
    });
  });

  return dirty;
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
      [j.importSpecifier(j.identifier(typeName))],
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
