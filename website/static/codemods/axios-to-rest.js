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
  'AxiosError',
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
  'CancelToken',
  'CancelTokenSource',
  'Canceler',
  'Cancel',
  'InternalAxiosRequestConfig',
  'CreateAxiosDefaults',
  'RawAxiosRequestConfig',
  'RawAxiosRequestHeaders',
  'RawAxiosResponseHeaders',
]);

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

function transformImports(j, root) {
  let dirty = false;

  root.find(j.ImportDeclaration).forEach(importPath => {
    if (importPath.node.source.value !== 'axios') return;

    const specs = importPath.node.specifiers;
    const remaining = specs.filter(s => {
      if (s.type === 'ImportDefaultSpecifier') return false;
      if (
        s.type === 'ImportSpecifier' &&
        s.imported &&
        AXIOS_TYPE_IMPORTS.has(s.imported.name || s.imported.value)
      ) {
        return false;
      }
      return true;
    });

    const restImport = j.importDeclaration(
      [j.importSpecifier(j.identifier('RestEndpoint'))],
      j.literal('@data-client/rest'),
    );
    if (remaining.length) {
      const axiosImport = j.importDeclaration(remaining, j.literal('axios'));
      j(importPath).replaceWith([restImport, axiosImport]);
    } else {
      j(importPath).replaceWith(restImport);
    }
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
      createToClass.set(varName, className);
    }

    const config =
      init.arguments.length > 0 &&
      init.arguments[0].type === 'ObjectExpression'
        ? init.arguments[0]
        : null;

    const classBody = [];

    if (config) {
      for (const prop of config.properties) {
        if (prop.type === 'SpreadElement' || prop.type === 'RestElement')
          continue;
        const key =
          prop.key.type === 'Identifier'
            ? prop.key.name
            : prop.key.type === 'StringLiteral'
              ? prop.key.value
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
      j(parentPath).replaceWith(classDecl);
    } else {
      j(declPath).replaceWith(classDecl);
    }
    dirty = true;
  });

  return { dirty, createToClass };
}

// --- 3. Transform direct axios/instance method calls ---

function transformDirectCalls(j, root, axiosLocalName, createToClass) {
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

    const urlArg = args[0];
    if (urlArg.type !== 'StringLiteral') return;

    const urlValue = urlArg.value;
    const method = methodName.toUpperCase();

    const properties = [
      j.objectProperty(j.identifier('path'), j.stringLiteral(urlValue)),
    ];

    if (method !== 'GET') {
      properties.push(
        j.objectProperty(j.identifier('method'), j.stringLiteral(method)),
      );
    }

    const instanceName = callee.object.name;
    const className = createToClass.get(instanceName);

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
  if (!axiosImport.length) return undefined;

  let axiosLocalName = 'axios';
  axiosImport.forEach(p => {
    const defaultSpec = p.node.specifiers.find(
      s => s.type === 'ImportDefaultSpecifier',
    );
    if (defaultSpec) {
      axiosLocalName = defaultSpec.local.name;
    }
  });

  let dirty = false;

  const createResult = transformAxiosCreate(j, root, axiosLocalName);
  dirty = createResult.dirty || dirty;

  dirty =
    transformDirectCalls(j, root, axiosLocalName, createResult.createToClass) ||
    dirty;

  dirty = transformImports(j, root) || dirty;

  return dirty ? root.toSource({ quote: 'single' }) : undefined;
};

module.exports.parser = 'tsx';
