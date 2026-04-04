'use strict';

/**
 * Axios → @data-client/rest migration codemod
 *
 * Transforms:
 *   1. import axios from 'axios' → import { RestEndpoint } from '@data-client/rest'
 *   2. axios.create({ baseURL, headers }) → RestEndpoint subclass
 *   3. axios.get/post/put/patch/delete(url) → new RestEndpoint({ path, method })
 *
 * Usage:
 *   npx jscodeshift -t https://dataclient.io/codemods/axios-to-rest.js --extensions=ts,tsx,js,jsx src/
 */

const AXIOS_TYPE_IMPORTS = new Set([
  'AxiosResponse',
  'AxiosRequestConfig',
  'AxiosInstance',
  'AxiosHeaders',
  'AxiosInterceptorManager',
  'AxiosPromise',
  'AxiosStatic',
  'AxiosDefaults',
  'AxiosAdapter',
  'AxiosBasicCredentials',
  'AxiosProxyConfig',
  'AxiosTransformer',
  'CancelTokenSource',
  'Canceler',
  'Cancel',
  'InternalAxiosRequestConfig',
  'CreateAxiosDefaults',
  'RawAxiosRequestConfig',
  'RawAxiosRequestHeaders',
  'RawAxiosResponseHeaders',
]);

const AXIOS_RUNTIME_IMPORTS = new Set(['CancelToken', 'AxiosError']);

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete']);

// --- Helpers ---

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function deriveClassName(varName) {
  if (!varName) return 'ApiEndpoint';
  const base = varName.replace(/[^a-zA-Z0-9]/g, '');
  if (!base) return 'ApiEndpoint';
  return capitalize(base) + 'Endpoint';
}

function getExistingClassNames(j, root) {
  const names = new Set();
  root.find(j.ClassDeclaration).forEach(p => {
    if (p.node.id) names.add(p.node.id.name);
  });
  return names;
}

function uniqueClassName(desired, existing) {
  let name = desired;
  while (existing.has(name)) {
    name = '_' + name;
  }
  existing.add(name);
  return name;
}

function extractHeaderProperties(j, node) {
  if (node.type === 'ObjectExpression') {
    return node.properties.filter(
      p =>
        p.type === 'ObjectProperty' ||
        p.type === 'Property' ||
        p.type === 'SpreadElement' ||
        p.type === 'SpreadProperty',
    );
  }
  return [j.spreadElement(node)];
}

// --- 1. Transform imports ---

function hasReference(j, root, localName, importScope, excludeTypePositions) {
  return (
    root
      .find(j.Identifier, { name: localName })
      .filter(path => {
        if (path.scope.lookup(localName) !== importScope) {
          return false;
        }

        const parent = path.parent.node;

        if (
          (parent.type === 'ImportDefaultSpecifier' ||
            parent.type === 'ImportSpecifier' ||
            parent.type === 'ImportNamespaceSpecifier') &&
          (parent.local === path.node || parent.imported === path.node)
        ) {
          return false;
        }

        if (
          (parent.type === 'Property' || parent.type === 'ObjectProperty') &&
          parent.key === path.node &&
          !parent.computed
        ) {
          return false;
        }

        if (
          parent.type === 'MemberExpression' &&
          parent.property === path.node &&
          !parent.computed
        ) {
          return false;
        }

        if (excludeTypePositions) {
          // Ignore references used only in TS type positions.
          if (
            parent.type === 'TSTypeReference' ||
            parent.type === 'TSQualifiedName' ||
            parent.type === 'TSTypeQuery' ||
            parent.type === 'TSExpressionWithTypeArguments' ||
            parent.type === 'TSImportType'
          ) {
            return false;
          }
        }

        return true;
      })
      .size() > 0
  );
}

function hasLiveReference(j, root, localName, importScope) {
  return hasReference(j, root, localName, importScope, false);
}

function hasRuntimeReference(j, root, localName, importScope) {
  return hasReference(j, root, localName, importScope, true);
}

function ensureRestEndpointImport(j, root) {
  let dirty = false;
  const restImports = root
    .find(j.ImportDeclaration)
    .filter(p => p.node.source.value === '@data-client/rest');

  if (restImports.length) {
    restImports.forEach(importPath => {
      const specifiers = importPath.node.specifiers || [];
      const hasRestEndpoint = specifiers.some(
        s =>
          s.type === 'ImportSpecifier' &&
          s.imported &&
          (s.imported.name || s.imported.value) === 'RestEndpoint',
      );
      if (hasRestEndpoint) return;

      specifiers.push(j.importSpecifier(j.identifier('RestEndpoint')));
      importPath.node.specifiers = specifiers;
      dirty = true;
    });
    return dirty;
  }

  const newImport = j.importDeclaration(
    [j.importSpecifier(j.identifier('RestEndpoint'))],
    j.literal('@data-client/rest'),
  );
  const firstImport = root.find(j.ImportDeclaration).at(0);
  if (firstImport.length) {
    firstImport.insertBefore(newImport);
  } else {
    root.get().node.program.body.unshift(newImport);
  }
  return true;
}

function transformImports(j, root, axiosLocalName, needsRestEndpointImport) {
  let dirty = false;
  const axiosImportPaths = root
    .find(j.ImportDeclaration)
    .filter(p => p.node.source.value === 'axios')
    .paths();
  const axiosImportPath = axiosImportPaths[0];
  const axiosStillUsed = hasLiveReference(
    j,
    root,
    axiosLocalName,
    axiosImportPath ? axiosImportPath.scope : null,
  );

  const hasDefaultImport = axiosImportPaths.some(
    p =>
      p.node.importKind !== 'type' &&
      p.node.specifiers.some(s => s.type === 'ImportDefaultSpecifier'),
  );

  if (needsRestEndpointImport || (!axiosStillUsed && hasDefaultImport)) {
    dirty = ensureRestEndpointImport(j, root) || dirty;
  }

  root.find(j.ImportDeclaration).forEach(importPath => {
    if (importPath.node.source.value !== 'axios') return;

    if (importPath.node.importKind === 'type') {
      j(importPath).remove();
      dirty = true;
      return;
    }

    if (axiosStillUsed) return;

    const specs = importPath.node.specifiers;
    const remaining = specs.filter(s => {
      if (s.type === 'ImportDefaultSpecifier') return false;
      if (s.type === 'ImportSpecifier' && s.importKind === 'type') return false;
      if (s.type === 'ImportSpecifier' && s.imported) {
        const importedName = s.imported.name || s.imported.value;
        const localName = (s.local && s.local.name) || importedName;

        if (AXIOS_RUNTIME_IMPORTS.has(importedName)) {
          return hasRuntimeReference(j, root, localName, importPath.scope);
        }
        if (AXIOS_TYPE_IMPORTS.has(importedName)) {
          return false;
        }
      }
      return true;
    });

    if (!remaining.length) {
      j(importPath).remove();
      dirty = true;
      return;
    }

    importPath.node.specifiers = remaining;
    dirty = true;
  });

  return dirty;
}

// --- 2. Transform axios.create() → class ---

function transformAxiosCreate(j, root, axiosLocalName) {
  let dirty = false;
  const existingClasses = getExistingClassNames(j, root);
  const createToClass = new Map();

  root.find(j.VariableDeclarator).forEach(declPath => {
    const init = declPath.node.init;
    if (!init || init.type !== 'CallExpression') return;
    if (
      !init.callee ||
      init.callee.type !== 'MemberExpression' ||
      init.callee.object.type !== 'Identifier' ||
      init.callee.object.name !== axiosLocalName ||
      init.callee.property.type !== 'Identifier' ||
      init.callee.property.name !== 'create'
    ) {
      return;
    }

    const varName =
      declPath.node.id.type === 'Identifier' ? declPath.node.id.name : null;
    const className = uniqueClassName(
      deriveClassName(varName),
      existingClasses,
    );

    if (varName) {
      const declarationScope = declPath.scope.lookup(varName) || declPath.scope;
      let scopedClassNames = createToClass.get(varName);
      if (!scopedClassNames) {
        scopedClassNames = new Map();
        createToClass.set(varName, scopedClassNames);
      }
      scopedClassNames.set(declarationScope, className);
    }

    const config =
      (
        init.arguments.length > 0 &&
        init.arguments[0].type === 'ObjectExpression'
      ) ?
        init.arguments[0]
      : null;

    const classBody = [];

    if (config) {
      for (const prop of config.properties) {
        if (prop.type === 'SpreadElement' || prop.type === 'RestElement')
          continue;
        const key =
          prop.key.type === 'Identifier' ? prop.key.name
          : prop.key.type === 'StringLiteral' ? prop.key.value
          : null;
        if (!key) continue;

        if (key === 'baseURL') {
          const urlProp = j.classProperty(
            j.identifier('urlPrefix'),
            prop.value,
          );
          urlProp.static = false;
          classBody.push(urlProp);
        } else if (key === 'headers') {
          const headersMethod = j.methodDefinition(
            'method',
            j.identifier('getHeaders'),
            j.functionExpression(
              null,
              [j.identifier('headers')],
              j.blockStatement([
                j.returnStatement(
                  j.objectExpression([
                    j.spreadElement(j.identifier('headers')),
                    ...extractHeaderProperties(j, prop.value),
                  ]),
                ),
              ]),
            ),
            false,
          );
          classBody.push(headersMethod);
        }
      }
    }

    const classDecl = j.classDeclaration(
      j.identifier(className),
      j.classBody(classBody),
      j.identifier('RestEndpoint'),
    );

    const parentPath = declPath.parent;
    if (parentPath.node.type === 'VariableDeclaration') {
      const variableDeclPath = parentPath;
      const variableDecl = variableDeclPath.node;
      const statementPath =
        variableDeclPath.parent.node.type === 'ExportNamedDeclaration' ?
          variableDeclPath.parent
        : variableDeclPath;
      const classStatement =
        statementPath.node.type === 'ExportNamedDeclaration' ?
          j.exportNamedDeclaration(classDecl)
        : classDecl;

      if (variableDecl.declarations.length === 1) {
        j(statementPath).replaceWith(classStatement);
      } else {
        variableDecl.declarations = variableDecl.declarations.filter(
          declaration => declaration !== declPath.node,
        );
        j(statementPath).insertBefore(classStatement);
      }
    } else {
      j(declPath).replaceWith(classDecl);
    }
    dirty = true;
  });

  return { dirty, createToClass };
}

// --- 3. Transform direct axios/instance method calls ---

function transformDirectCalls(
  j,
  root,
  axiosLocalName,
  axiosImportScope,
  createToClass,
) {
  let dirty = false;
  const callTargets = new Set([axiosLocalName, ...createToClass.keys()]);

  root.find(j.CallExpression).forEach(callPath => {
    const callee = callPath.node.callee;
    if (
      !callee ||
      callee.type !== 'MemberExpression' ||
      callee.object.type !== 'Identifier' ||
      !callTargets.has(callee.object.name) ||
      callee.property.type !== 'Identifier' ||
      !HTTP_METHODS.has(callee.property.name)
    ) {
      return;
    }

    const methodName = callee.property.name;
    const args = callPath.node.arguments;
    if (args.length === 0) return;

    const targetName = callee.object.name;
    const callBindingScope = callPath.scope.lookup(targetName);

    let className;
    if (targetName === axiosLocalName) {
      // Only transform calls that still refer to the imported axios binding.
      if (callBindingScope !== axiosImportScope) return;
    } else {
      const scopedClassNames = createToClass.get(targetName);
      if (!scopedClassNames) return;
      className = scopedClassNames.get(callBindingScope);
      // Avoid rewriting shadowed identifiers with the same name.
      if (!className) return;
    }

    const urlArg = args[0];
    if (urlArg.type !== 'StringLiteral' && urlArg.type !== 'TemplateLiteral')
      return;

    const isCreatedInstance = Boolean(className);

    // Keep existing no-op behavior for direct axios calls with extra args.
    // However, created instances must still be transformed so we don't leave
    // dangling references after axios.create() is replaced by a class.
    if (args.length > 1 && !isCreatedInstance) return;

    const method = methodName.toUpperCase();

    const pathValue =
      urlArg.type === 'StringLiteral' ? j.stringLiteral(urlArg.value) : urlArg;

    const properties = [j.objectProperty(j.identifier('path'), pathValue)];

    if (method !== 'GET') {
      properties.push(
        j.objectProperty(j.identifier('method'), j.stringLiteral(method)),
      );
    }

    let newExpr;
    if (className) {
      newExpr = j.newExpression(j.identifier(className), [
        j.objectExpression(properties),
      ]);
    } else {
      newExpr = j.newExpression(j.identifier('RestEndpoint'), [
        j.objectExpression(properties),
      ]);
    }

    j(callPath).replaceWith(newExpr);
    dirty = true;
  });

  return dirty;
}

// --- Main ---

module.exports = function transformer(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  const axiosImport = root
    .find(j.ImportDeclaration)
    .filter(p => p.node.source.value === 'axios');
  if (!axiosImport.length) return fileInfo.source;

  let axiosLocalName = 'axios';
  let axiosImportScope = null;
  axiosImport.forEach(p => {
    const defaultSpec = p.node.specifiers.find(
      s => s.type === 'ImportDefaultSpecifier',
    );
    if (defaultSpec) {
      axiosLocalName = defaultSpec.local.name;
      axiosImportScope = p.scope.lookup(axiosLocalName) || p.scope;
    }
  });

  let dirty = false;

  const createResult = transformAxiosCreate(j, root, axiosLocalName);
  dirty = createResult.dirty || dirty;

  const directCallsDirty = transformDirectCalls(
    j,
    root,
    axiosLocalName,
    axiosImportScope,
    createResult.createToClass,
  );
  dirty = directCallsDirty || dirty;

  dirty =
    transformImports(
      j,
      root,
      axiosLocalName,
      createResult.dirty || directCallsDirty,
    ) || dirty;

  return dirty ? root.toSource({ quote: 'single' }) : undefined;
};

module.exports.parser = 'tsx';
