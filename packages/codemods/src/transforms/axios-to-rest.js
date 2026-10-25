'use strict';

/**
 * Axios → @data-client/rest migration codemod
 *
 * Transforms:
 *   1. import axios from 'axios' → import { RestEndpoint } from '@data-client/rest'
 *   2. axios.create({ baseURL, headers }) → RestEndpoint subclass
 *   3. axios.get/post/put/patch/delete(url, ...) → a call to
 *      new RestEndpoint({ path, method }), reading the body instead of `.data`
 *   4. Anything it can't convert gets a `// TODO(data-client):` comment that
 *      links the guide section covering it
 *
 * Usage:
 *   npx @data-client/codemods axios-to-rest src/
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

const TYPE_POSITIONS = new Set([
  'TSTypeReference',
  'TSQualifiedName',
  'TSTypeQuery',
  'TSExpressionWithTypeArguments',
  'TSImportType',
]);

/** Whether an Identifier reads its binding, rather than naming an import, property or key */
function isRead(path, { types = true } = {}) {
  const parent = path.parent.node;
  if (parent.type.startsWith('Import')) return false;
  if (
    parent.type === 'MemberExpression' &&
    parent.property === path.node &&
    !parent.computed
  )
    return false;
  if (
    (parent.type === 'ObjectProperty' || parent.type === 'Property') &&
    parent.key === path.node &&
    !parent.computed &&
    !parent.shorthand
  )
    return false;
  if (!types && TYPE_POSITIONS.has(parent.type)) return false;
  return true;
}

/** Reads of the `name` binding that `scope` declares, in the `within` collection */
function readsOf(j, within, name, scope, options) {
  return within
    .find(j.Identifier, { name })
    .filter(p => p.scope.lookup(name) === scope && isRead(p, options));
}

function hasReference(j, root, localName, importScope, excludeTypePositions) {
  return (
    readsOf(j, root, localName, importScope, {
      types: !excludeTypePositions,
    }).size() > 0
  );
}

function hasLiveReference(j, root, localName, importScope) {
  return hasReference(j, root, localName, importScope, false);
}

function hasRuntimeReference(j, root, localName, importScope) {
  return hasReference(j, root, localName, importScope, true);
}

function ensureRestImports(j, root, names) {
  // `import type` can't bring in the RestEndpoint value
  const restImports = root
    .find(j.ImportDeclaration)
    .filter(
      p =>
        p.node.source.value === '@data-client/rest' &&
        p.node.importKind !== 'type',
    );

  if (restImports.length) {
    const imported = new Set();
    restImports.forEach(importPath => {
      for (const s of importPath.node.specifiers || []) {
        if (
          s.type === 'ImportSpecifier' &&
          s.imported &&
          s.importKind !== 'type'
        )
          imported.add(s.imported.name || s.imported.value);
      }
    });
    const missing = names.filter(name => !imported.has(name));
    if (!missing.length) return false;
    const first = restImports.paths()[0].node;
    first.specifiers = [
      ...(first.specifiers || []),
      ...missing.map(name => j.importSpecifier(j.identifier(name))),
    ];
    return true;
  }

  const newImport = j.importDeclaration(
    names.map(name => j.importSpecifier(j.identifier(name))),
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

function transformImports(
  j,
  root,
  axiosLocalName,
  needsRestEndpointImport,
  restImports,
) {
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
    dirty = ensureRestImports(j, root, restImports) || dirty;
  }

  root.find(j.ImportDeclaration).forEach(importPath => {
    if (importPath.node.source.value !== 'axios') return;

    if (importPath.node.importKind === 'type') {
      j(importPath).remove();
      dirty = true;
      return;
    }

    if (axiosStillUsed) {
      // axios stays, but drop the types nothing reads anymore
      const used = importPath.node.specifiers.filter(s => {
        if (s.type !== 'ImportSpecifier') return true;
        const importedName = s.imported.name || s.imported.value;
        if (s.importKind !== 'type' && !AXIOS_TYPE_IMPORTS.has(importedName))
          return true;
        const localName = (s.local && s.local.name) || importedName;
        return hasLiveReference(j, root, localName, importPath.scope);
      });
      if (used.length !== importPath.node.specifiers.length) {
        importPath.node.specifiers = used;
        dirty = true;
      }
      return;
    }

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

function transformAxiosCreate(j, root, axiosLocalName, isTS) {
  let dirty = false;
  // names the generated class must not take
  const existingClasses = getExistingClassNames(j, root);
  existingClasses.add('RestEndpoint');
  existingClasses.add('RestGenerics');
  const createToClass = new Map();
  // classes whose urlPrefix came from a baseURL
  const prefixedClasses = new Set();

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
    const unknownOptions = [];
    const unknownTodos = [];

    if (config) {
      for (const prop of config.properties) {
        if (prop.type === 'SpreadElement' || prop.type === 'RestElement') {
          unknownOptions.push('...' + j(prop.argument).toSource());
          continue;
        }
        const key = propKey(prop);
        if (!key) {
          unknownOptions.push('...');
          continue;
        }

        if (key === 'baseURL') {
          // axios joins baseURL and url with one '/'; urlPrefix + path are
          // joined as is, and every path starts with '/'
          let prefix = prop.value;
          const literal =
            prefix.type === 'StringLiteral' ||
            (prefix.type === 'Literal' && typeof prefix.value === 'string');
          if (literal && prefix.value.endsWith('/')) {
            prefix = j.stringLiteral(prefix.value.replace(/\/+$/, ''));
          } else if (!literal) {
            unknownTodos.push([
              'make sure `urlPrefix` has no trailing `/`, since every path starts with one',
              'base-endpoint',
            ]);
          }
          const urlProp = j.classProperty(j.identifier('urlPrefix'), prefix);
          urlProp.static = false;
          classBody.push(urlProp);
          prefixedClasses.add(className);
        } else if (key === 'headers') {
          const headers = j.identifier('headers');
          const fn = j.functionExpression(
            null,
            [headers],
            j.blockStatement([
              j.returnStatement(
                j.objectExpression([
                  j.spreadElement(j.identifier('headers')),
                  ...extractHeaderProperties(j, prop.value),
                ]),
              ),
            ]),
          );
          if (isTS) {
            headers.typeAnnotation = j.tsTypeAnnotation(
              j.tsTypeReference(j.identifier('HeadersInit')),
            );
            fn.returnType = j.tsTypeAnnotation(
              j.tsTypeReference(j.identifier('HeadersInit')),
            );
          }
          classBody.push(
            j.methodDefinition('method', j.identifier('getHeaders'), fn, false),
          );
        } else {
          unknownOptions.push(key);
        }
      }
    }

    const classDecl = j.classDeclaration(
      j.identifier(className),
      j.classBody(classBody),
      j.identifier('RestEndpoint'),
    );
    if (isTS) {
      // keeps each endpoint's options typed: class X<O extends RestGenerics = any> extends RestEndpoint<O>
      const generic = j.tsTypeParameter('O');
      generic.constraint = j.tsTypeReference(j.identifier('RestGenerics'));
      generic.default = j.tsAnyKeyword();
      classDecl.typeParameters = j.tsTypeParameterDeclaration([generic]);
      classDecl.superTypeParameters = j.tsTypeParameterInstantiation([
        j.tsTypeReference(j.identifier('O')),
      ]);
    }
    const markOptions = node => {
      for (const [message, anchor] of unknownTodos)
        addTodo(j, node, message, anchor);
      if (!unknownOptions.length) return;
      const [message, anchor] = optionsTodo(unknownOptions, `\`${className}\``);
      addTodo(j, node, message, anchor);
    };

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
      markOptions(classStatement);

      if (variableDecl.declarations.length === 1) {
        j(statementPath).replaceWith(classStatement);
      } else {
        variableDecl.declarations = variableDecl.declarations.filter(
          declaration => declaration !== declPath.node,
        );
        j(statementPath).insertBefore(classStatement);
      }
    } else {
      markOptions(classDecl);
      j(declPath).replaceWith(classDecl);
    }
    dirty = true;
  });

  return { dirty, createToClass, prefixedClasses };
}

// --- 3. Transform direct axios/instance method calls ---

const BODY_METHODS = new Set(['post', 'put', 'patch']);
// path-to-regexp v8 reserves these characters in a path
const RESERVED_PATH_CHARS = /[{}()[\]+?!*:\\]/;
const ORIGIN = /^(?:[a-z][a-z\d+.-]*:)?\/\/[^/?#]*/i;

function isPure(node) {
  if (node.type === 'Identifier' || node.type === 'ThisExpression') return true;
  return (
    node.type === 'MemberExpression' && !node.computed && isPure(node.object)
  );
}

function isLiteral(node) {
  return (
    node.type === 'StringLiteral' ||
    node.type === 'NumericLiteral' ||
    node.type === 'BooleanLiteral' ||
    node.type === 'NullLiteral' ||
    node.type === 'Literal' ||
    (node.type === 'TemplateLiteral' && !node.expressions.length)
  );
}

/** No side effects to reorder: a variable, member chain or literal */
function isSimple(node) {
  return isPure(node) || isLiteral(node);
}

function isNullish(node) {
  return (
    node.type === 'NullLiteral' ||
    (node.type === 'Literal' && node.value === null) ||
    (node.type === 'Identifier' && node.name === 'undefined')
  );
}

/**
 * Whether evaluating `moved` before `crossed`, instead of after, can change
 * a value: one side has effects and the other reads state.
 */
function reordersEffects(moved, crossed) {
  const effects = list => list.some(e => !isSimple(e));
  const reads = list => list.some(e => !isLiteral(e));
  return (
    (effects(moved) && reads(crossed)) || (effects(crossed) && reads(moved))
  );
}

function memberName(node) {
  if (node.type === 'Identifier') return node.name;
  if (
    node.type === 'MemberExpression' &&
    !node.computed &&
    node.property.type === 'Identifier'
  )
    return node.property.name;
  return null;
}

/**
 * RestEndpoint encodes path and query values itself, so a value the url
 * already encoded passes unwrapped to avoid encoding it twice.
 */
function unencoded(expr) {
  return (
      expr.type === 'CallExpression' &&
        expr.callee.type === 'Identifier' &&
        expr.callee.name === 'encodeURIComponent' &&
        expr.arguments.length === 1 &&
        expr.arguments[0].type !== 'SpreadElement'
    ) ?
      expr.arguments[0]
    : expr;
}

/** Parses `a=1&b=${x}` query text into args properties; null if it can't */
function parseQuery(j, text, expressions) {
  const props = [];
  const pairs = text.split('&');
  let exprIndex = 0;
  for (const pair of pairs) {
    if (!pair) continue;
    const eq = pair.indexOf('=');
    if (eq <= 0) return null;
    const key = pair.slice(0, eq);
    const value = pair.slice(eq + 1);
    if (!/^[A-Za-z_$][\w$]*$/.test(key)) return null;
    // a repeated key would collapse into one arg
    if (props.some(p => p.key.name === key)) return null;
    if (value === '\0') {
      const expr = expressions[exprIndex++];
      props.push(
        j.objectProperty.from({
          key: j.identifier(key),
          value: expr,
          shorthand: expr.type === 'Identifier' && expr.name === key,
        }),
      );
    } else if (!value.includes('\0')) {
      let decoded;
      try {
        decoded = decodeURIComponent(value.replace(/\+/g, ' '));
      } catch {
        return null;
      }
      props.push(j.objectProperty(j.identifier(key), j.stringLiteral(decoded)));
    } else {
      return null;
    }
  }
  return exprIndex === expressions.length ? props : null;
}

/**
 * Turns an axios url into a RestEndpoint path, with the values its
 * template expressions (and query string) pass as args.
 * Returns null when the url can't be expressed as a path.
 */
function toPath(j, urlArg) {
  let quasis;
  let expressions;
  if (urlArg.type === 'StringLiteral' || urlArg.type === 'Literal') {
    if (typeof urlArg.value !== 'string') return null;
    quasis = [urlArg.value];
    expressions = [];
  } else if (urlArg.type === 'TemplateLiteral') {
    quasis = urlArg.quasis.map(q => q.value.cooked);
    expressions = urlArg.expressions.map(unencoded);
    if (quasis.some(q => q == null || q.includes('\0'))) return null;
  } else {
    return null;
  }

  let urlPrefix;
  const origin = quasis[0].match(ORIGIN);
  if (origin) {
    urlPrefix = origin[0];
    quasis = [quasis[0].slice(urlPrefix.length), ...quasis.slice(1)];
  }

  // Join with \0 where each expression sits, then split off the query.
  const joined = quasis.join('\0');
  // fragments aren't sent
  if (joined.includes('#')) return null;
  const queryStart = joined.indexOf('?');
  const pathPart = queryStart === -1 ? joined : joined.slice(0, queryStart);
  const queryPart = queryStart === -1 ? '' : joined.slice(queryStart + 1);
  const pathExprCount = (pathPart.match(/\0/g) || []).length;

  const args = [];
  const names = new Map();
  let path = '';
  const segments = pathPart.split('\0');
  for (let i = 0; i < segments.length; i++) {
    const text = segments[i];
    if (RESERVED_PATH_CHARS.test(text)) return null;
    path += text;
    if (i === segments.length - 1) break;
    // each expression must fill a whole path segment
    const next = segments[i + 1];
    if (!path.endsWith('/') || (next && !next.startsWith('/'))) return null;
    const expr = expressions[i];
    let name = memberName(expr) || 'param';
    // the same variable can fill two segments; anything else is evaluated once each
    const source = isPure(expr) ? j(expr).toSource() : {};
    if (names.has(name) && names.get(name) !== source) {
      let n = 2;
      while (names.has(name + n)) n++;
      name = name + n;
    }
    if (!names.has(name)) {
      names.set(name, source);
      args.push(
        j.objectProperty.from({
          key: j.identifier(name),
          value: expr,
          shorthand: expr.type === 'Identifier' && expr.name === name,
        }),
      );
    }
    path += ':' + name;
  }
  if (!path) path = '/';

  let query = [];
  if (queryPart) {
    query = parseQuery(j, queryPart, expressions.slice(pathExprCount));
    if (!query) return null;
  }

  return { path, urlPrefix, args, query };
}

function propKey(prop) {
  if (prop.type !== 'ObjectProperty' && prop.type !== 'Property') return null;
  if (prop.computed) return null;
  if (prop.key.type === 'Identifier') return prop.key.name;
  if (prop.key.type === 'StringLiteral' || prop.key.type === 'Literal')
    return String(prop.key.value);
  return null;
}

/**
 * For an `AxiosResponse<T>` annotation, T; undefined for a bare
 * `AxiosResponse`; null when it isn't an AxiosResponse at all
 */
function unwrapResponseType(annotation) {
  const type = annotation && annotation.typeAnnotation;
  if (
    type &&
    type.type === 'TSTypeReference' &&
    type.typeName.type === 'Identifier' &&
    type.typeName.name === 'AxiosResponse'
  ) {
    const params = type.typeParameters || type.typeArguments;
    return params && params.params.length ? params.params[0] : undefined;
  }
  return null;
}

function isDataMember(node, object) {
  return (
    node.type === 'MemberExpression' &&
    node.object === object &&
    !node.computed &&
    node.property.type === 'Identifier' &&
    node.property.name === 'data'
  );
}

/** Replaces each `name.data` read with `name`; false if `name` is read any other way */
function dropDataReads(j, within, name, scope, exclude) {
  const reads = readsOf(j, j(within), name, scope)
    .filter(p => p.node !== exclude)
    .paths();
  if (!reads.every(p => isDataMember(p.parent.node, p.node))) return false;
  reads.forEach(p => j(p.parent).replaceWith(p.node));
  return true;
}

/** `{ data }` or `{ data: alias }` → the pattern data was bound to */
function dataPattern(pattern) {
  if (pattern.type !== 'ObjectPattern' || pattern.properties.length !== 1)
    return null;
  const prop = pattern.properties[0];
  if (propKey(prop) !== 'data') return null;
  if (prop.value.type === 'AssignmentPattern') return null;
  return prop.value;
}

/**
 * Axios resolves to a response whose `.data` is the body; endpoints resolve
 * to the body. Rewrites how `callPath`'s result is read.
 * Returns false when it can't tell, so the caller marks it.
 */
function unwrapData(j, callPath) {
  const parent = callPath.parent;

  if (parent.node.type === 'AwaitExpression') {
    const awaitNode = parent.node;
    const outer = parent.parent;
    if (isDataMember(outer.node, awaitNode)) {
      // (await x).data loses its parentheses with its .data
      if (awaitNode.extra) awaitNode.extra.parenthesized = false;
      j(outer).replaceWith(awaitNode);
      return true;
    }
    if (
      outer.node.type === 'VariableDeclarator' &&
      outer.node.init === awaitNode
    ) {
      const id = outer.node.id;
      const bodyType = unwrapResponseType(id.typeAnnotation);
      if (id.type === 'Identifier') {
        const scope = outer.scope.lookup(id.name);
        if (!scope) return false;
        // other modules may read `.data` from an exported response
        if (outer.parent.parent.node.type === 'ExportNamedDeclaration')
          return false;
        if (!dropDataReads(j, scope.path, id.name, scope, id)) return false;
        if (bodyType) id.typeAnnotation = j.tsTypeAnnotation(bodyType);
        else if (bodyType === undefined) id.typeAnnotation = null;
        return true;
      }
      const inner = dataPattern(id);
      if (inner) {
        if (bodyType && !inner.typeAnnotation)
          inner.typeAnnotation = j.tsTypeAnnotation(bodyType);
        outer.node.id = inner;
        return true;
      }
    }
    return false;
  }

  // promise.then(res => res.data)
  if (
    parent.node.type === 'MemberExpression' &&
    parent.node.object === callPath.node &&
    !parent.node.computed &&
    parent.node.property.type === 'Identifier' &&
    parent.node.property.name === 'then' &&
    parent.parent.node.type === 'CallExpression' &&
    parent.parent.node.callee === parent.node
  ) {
    const thenPath = parent.parent;
    const cb = thenPath.node.arguments[0];
    if (
      !cb ||
      (cb.type !== 'ArrowFunctionExpression' &&
        cb.type !== 'FunctionExpression') ||
      !cb.params.length
    )
      return false;
    const param = cb.params[0];
    if (param.type === 'Identifier') {
      const cbPath = j(thenPath)
        .find(
          cb.type === 'ArrowFunctionExpression' ?
            j.ArrowFunctionExpression
          : j.FunctionExpression,
        )
        .filter(p => p.node === cb)
        .paths()[0];
      if (!dropDataReads(j, cbPath, param.name, cbPath.scope, param))
        return false;
      const bodyType = unwrapResponseType(param.typeAnnotation);
      param.typeAnnotation = bodyType ? j.tsTypeAnnotation(bodyType) : null;
    } else {
      const inner = dataPattern(param);
      if (!inner) return false;
      cb.params[0] = inner;
    }
    // .then(res => res) does nothing now
    if (
      thenPath.node.arguments.length === 1 &&
      cb.type === 'ArrowFunctionExpression' &&
      cb.params.length === 1 &&
      cb.params[0].type === 'Identifier' &&
      cb.body.type === 'Identifier' &&
      cb.body.name === cb.params[0].name
    ) {
      j(thenPath).replaceWith(callPath.node);
    }
    return true;
  }

  return false;
}

const GUIDE = 'https://dataclient.io/rest/guides/axios-migration';
const TODO = 'TODO(data-client):';

/** table[key], ignoring inherited keys like `toString` that source code can name */
function own(table, key) {
  return Object.hasOwn(table, key) ? table[key] : undefined;
}

const OPTION_ANCHORS = {
  timeout: 'timeout',
  signal: 'cancellation',
  cancelToken: 'cancellation',
  responseType: 'binary-responses',
  paramsSerializer: 'query-serialization',
  auth: 'basic-auth',
  validateStatus: 'accepting-error-statuses',
  xsrfCookieName: 'csrf-headers',
  xsrfHeaderName: 'csrf-headers',
  withXSRFToken: 'csrf-headers',
  onUploadProgress: 'upload-progress',
  onDownloadProgress: 'upload-progress',
};

function optionsTodo(keys, target = 'the endpoint') {
  const anchors = [...new Set(keys.map(k => own(OPTION_ANCHORS, k)))];
  const anchor =
    anchors.length === 1 && anchors[0] ? anchors[0] : 'quick-reference';
  return [
    `move axios ${keys.map(k => `\`${k}\``).join(', ')} to ${target}`,
    anchor,
  ];
}

/**
 * Adds a TODO comment above the nearest statement or class member holding
 * `path` (outside any `export`), once per message
 */
function markTodo(j, path, message, anchor) {
  let p = path;
  while (
    p.parent &&
    !(
      j.Statement.check(p.node) &&
      p.parent.node.type !== 'ExportNamedDeclaration' &&
      p.parent.node.type !== 'ExportDefaultDeclaration'
    ) &&
    p.node.type !== 'ClassProperty' &&
    p.node.type !== 'ClassMethod' &&
    p.node.type !== 'MethodDefinition'
  ) {
    p = p.parent;
  }
  if (
    p.parent &&
    (p.parent.node.type === 'ExportNamedDeclaration' ||
      p.parent.node.type === 'ExportDefaultDeclaration')
  ) {
    p = p.parent;
  }
  addTodo(j, p.node, message, anchor);
}

function addTodo(j, node, message, anchor) {
  const text = ` ${TODO} ${message}: ${GUIDE}#${anchor}`;
  const comments = node.comments || (node.comments = []);
  if (comments.some(c => c.value === text)) return;
  comments.push(j.commentLine(text, true, false));
}

function buildCall(j, callPath, className, prefixed, isTS) {
  const callee = callPath.node.callee;
  const methodName = callee.property.name;
  const args = callPath.node.arguments;
  if (args.length === 0) return null;

  const url = toPath(j, args[0]);
  if (!url) return null;
  if (prefixed) {
    // the class's urlPrefix field would override a urlPrefix option
    if (url.urlPrefix) return null;
    // axios puts a '/' between baseURL and a relative url
    if (!url.path.startsWith('/')) url.path = '/' + url.path;
  }

  const hasBody = BODY_METHODS.has(methodName);
  const data = hasBody ? args[1] : undefined;
  const config = hasBody ? args[2] : args[1];
  if (args.some(a => a.type === 'SpreadElement')) return null;

  const configParams = [];
  const spreadParams = [];
  const unknownOptions = [];
  const todos = [];
  if (config) {
    if (config.type !== 'ObjectExpression') return null;
    for (const prop of config.properties) {
      const key = propKey(prop);
      if (key === 'params') {
        if (prop.value.type === 'ObjectExpression') {
          configParams.push(...prop.value.properties);
        } else {
          // first, so it can't replace a path param
          spreadParams.push(j.spreadElement(prop.value));
        }
      } else if (key) {
        unknownOptions.push(key);
      } else {
        return null;
      }
    }
  }

  // axios evaluates the url, then the body, then params; the endpoint call
  // takes spread params first and the body last
  const spreadValues = spreadParams.map(p => p.argument);
  const urlValues = [...url.args, ...url.query].map(p => p.value);
  const paramValues = configParams.map(p => p.value).filter(Boolean);
  if (
    reordersEffects(spreadValues, urlValues) ||
    (data && reordersEffects([...spreadValues, ...paramValues], [data]))
  )
    return null;

  // each query key must be distinct from the path params and each other
  const keys = new Set(url.args.map(propKey));
  for (const prop of [...url.query, ...configParams]) {
    const key = propKey(prop);
    if (!key || keys.has(key)) return null;
    keys.add(key);
  }
  // axios leaves out null and undefined params
  const sentParams = configParams.filter(p => !isNullish(p.value));
  // and serializes them its own way, so only literal scalars are sure to match
  if (spreadParams.length || sentParams.some(p => !isLiteral(p.value))) {
    todos.push([
      'check these query params serialize as before: axios leaves out null and undefined values and formats arrays and objects its own way; match it in `searchToString()`',
      'query-serialization',
    ]);
  }
  const query = [...url.query, ...sentParams];
  const callArgs = [...spreadParams, ...url.args, ...query];

  const options = [];
  if (url.urlPrefix) {
    options.push(
      j.objectProperty(
        j.identifier('urlPrefix'),
        j.stringLiteral(url.urlPrefix),
      ),
    );
  }
  options.push(
    j.objectProperty(j.identifier('path'), j.stringLiteral(url.path)),
  );
  if (methodName !== 'get') {
    options.push(
      j.objectProperty(
        j.identifier('method'),
        j.stringLiteral(methodName.toUpperCase()),
      ),
    );
  }
  if (isTS && (query.length || spreadParams.length)) {
    // axios params are untyped too; narrow this once you know the query
    const searchParams = j.tsAsExpression(
      j.objectExpression([]),
      j.tsTypeReference(
        j.identifier('Record'),
        j.tsTypeParameterInstantiation([
          j.tsStringKeyword(),
          j.tsUnknownKeyword(),
        ]),
      ),
    );
    options.push(j.objectProperty(j.identifier('searchParams'), searchParams));
  }
  // with no body, a single argument is params rather than the body
  if (hasBody && !data) {
    options.push(
      j.objectProperty(j.identifier('body'), j.identifier('undefined')),
    );
  }
  const typeArgs =
    callPath.node.typeParameters || callPath.node.typeArguments || null;
  const endpoint = j.newExpression(j.identifier(className || 'RestEndpoint'), [
    j.objectExpression(options),
  ]);
  const params = callArgs.length ? j.objectExpression(callArgs) : null;
  const invokeArgs =
    data ?
      params ? [params, data]
      : [data]
    : params ? [params]
    : [];

  return {
    node: j.callExpression(endpoint, invokeArgs),
    // the response type the axios call was given
    responseType: isTS && typeArgs && typeArgs.params[0],
    unknownOptions,
    todos,
  };
}

function transformDirectCalls(
  j,
  root,
  axiosLocalName,
  axiosImportScope,
  { createToClass, prefixedClasses },
  isTS,
) {
  let dirty = false;
  let marked = false;
  const callTargets = new Set([axiosLocalName, ...createToClass.keys()]);

  // innermost calls first, so a call nested in another call's args converts
  // before its parent rebuilds around it
  const calls = root
    .find(j.CallExpression)
    .filter(callPath => {
      const callee = callPath.node.callee;
      return (
        callee &&
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callTargets.has(callee.object.name) &&
        callee.property.type === 'Identifier' &&
        HTTP_METHODS.has(callee.property.name)
      );
    })
    .paths()
    .reverse();

  for (const callPath of calls) {
    const targetName = callPath.node.callee.object.name;
    const callBindingScope = callPath.scope.lookup(targetName);

    let className;
    if (targetName === axiosLocalName) {
      // Only transform calls that still refer to the imported axios binding.
      if (callBindingScope !== axiosImportScope) continue;
    } else {
      const scopedClassNames = createToClass.get(targetName);
      if (!scopedClassNames) continue;
      className = scopedClassNames.get(callBindingScope);
      // Avoid rewriting shadowed identifiers with the same name.
      if (!className) continue;
    }

    const result = buildCall(
      j,
      callPath,
      className,
      prefixedClasses.has(className),
      isTS,
    );
    if (!result) {
      markTodo(
        j,
        callPath,
        `convert this ${targetName}.${callPath.node.callee.property.name}() call to an endpoint`,
        'call-sites',
      );
      marked = true;
      continue;
    }

    j(callPath).replaceWith(result.node);
    if (result.unknownOptions.length) {
      const [message, anchor] = optionsTodo(result.unknownOptions);
      markTodo(j, callPath, message, anchor);
    }
    for (const [message, anchor] of result.todos)
      markTodo(j, callPath, message, anchor);
    if (!unwrapData(j, callPath)) {
      markTodo(
        j,
        callPath,
        'this resolves to the response body now, not an axios response, so drop `.data` (`status` and `headers` are gone too)',
        'call-sites',
      );
    }
    if (result.responseType) {
      // cast where the call ends up; a process() override would skip the base class's
      const castPath = root
        .find(j.CallExpression)
        .filter(p => p.node === result.node)
        .paths()[0];
      if (castPath) {
        const cast = j.tsAsExpression(
          result.node,
          j.tsTypeReference(
            j.identifier('Promise'),
            j.tsTypeParameterInstantiation([result.responseType]),
          ),
        );
        // recast won't add these itself, and `await x as T` casts the awaited value
        cast.extra = { parenthesized: true };
        j(castPath).replaceWith(cast);
      }
    }
    dirty = true;
  }

  return { dirty, marked };
}

// --- 4. Mark what's left for a person or agent ---

const AXIOS_MEMBER_TODOS = {
  isAxiosError: [
    'check `NetworkError` instead of `isAxiosError()`',
    'error-handling',
  ],
  isCancel: [
    "check `error.name === 'AbortError'` instead of `isCancel()`",
    'cancellation',
  ],
  all: ['use `Promise.all()` instead of `axios.all()`', 'call-sites'],
  spread: [
    'destructure the `Promise.all()` result instead of `axios.spread()`',
    'call-sites',
  ],
  CancelToken: [
    'use an `AbortSignal` instead of `CancelToken`',
    'cancellation',
  ],
};

function markLeftovers(
  j,
  root,
  axiosLocalName,
  axiosImportScope,
  createToClass,
) {
  let dirty = false;

  // calls it couldn't convert are marked already
  const isMarkedCall = p =>
    p.parent.node.type === 'MemberExpression' &&
    p.parent.node.object === p.node &&
    HTTP_METHODS.has(memberName(p.parent.node));

  // axios instances are classes now; anything else reading them needs a hand
  for (const [name, scopes] of createToClass) {
    root
      .find(j.Identifier, { name })
      .filter(
        p =>
          scopes.has(p.scope.lookup(name)) &&
          isRead(p) &&
          p.parent.node.type !== 'ClassDeclaration' &&
          !isMarkedCall(p),
      )
      .forEach(p => {
        const className = scopes.get(p.scope.lookup(name));
        const parent = p.parent.node;
        const member =
          parent.type === 'MemberExpression' && parent.object === p.node ?
            memberName(parent)
          : null;
        if (member === 'interceptors') {
          markTodo(
            j,
            p,
            `move this interceptor into \`${className}\``,
            'base-endpoint',
          );
        } else if (member === 'defaults') {
          markTodo(
            j,
            p,
            `move these defaults into \`${className}\``,
            'base-endpoint',
          );
        } else {
          markTodo(
            j,
            p,
            `\`${name}\` is the \`${className}\` class now; call an endpoint instead`,
            'call-sites',
          );
        }
        dirty = true;
      });
  }

  if (axiosImportScope) {
    readsOf(j, root, axiosLocalName, axiosImportScope, { types: false })
      .filter(p => !isMarkedCall(p))
      .forEach(p => {
        const parent = p.parent.node;
        const member =
          parent.type === 'MemberExpression' && parent.object === p.node ?
            memberName(parent)
          : null;
        const [message, anchor] = own(AXIOS_MEMBER_TODOS, member) || [
          'replace this axios call with an endpoint',
          'call-sites',
        ];
        markTodo(j, p, message, anchor);
        dirty = true;
      });
  }

  // runtime uses of AxiosError / CancelToken imports
  root
    .find(j.ImportDeclaration)
    .filter(
      p => p.node.source.value === 'axios' && p.node.importKind !== 'type',
    )
    .forEach(importPath => {
      for (const s of importPath.node.specifiers || []) {
        if (s.type !== 'ImportSpecifier' || s.importKind === 'type') continue;
        const imported = s.imported.name || s.imported.value;
        const local = (s.local && s.local.name) || imported;
        const todo =
          imported === 'AxiosError' ?
            ['check `NetworkError` instead of `AxiosError`', 'error-handling']
          : own(AXIOS_MEMBER_TODOS, imported);
        if (!todo) continue;
        readsOf(j, root, local, importPath.scope, { types: false }).forEach(
          p => {
            markTodo(j, p, todo[0], todo[1]);
            dirty = true;
          },
        );
      }
    });

  return dirty;
}

// --- Main ---

module.exports = function transformer(fileInfo, api) {
  // skip parsing files that can't import axios
  if (!fileInfo.source.includes('axios')) return fileInfo.source;
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  const isTS = /\.[cm]?tsx?$/.test(fileInfo.path || '');

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

  const createResult = transformAxiosCreate(j, root, axiosLocalName, isTS);
  dirty = createResult.dirty || dirty;

  const calls = transformDirectCalls(
    j,
    root,
    axiosLocalName,
    axiosImportScope,
    createResult,
    isTS,
  );
  const directCallsDirty = calls.dirty;
  dirty = calls.dirty || calls.marked || dirty;

  dirty =
    markLeftovers(
      j,
      root,
      axiosLocalName,
      axiosImportScope,
      createResult.createToClass,
    ) || dirty;

  dirty =
    transformImports(
      j,
      root,
      axiosLocalName,
      createResult.dirty || directCallsDirty,
      isTS && createResult.dirty ?
        ['RestEndpoint', 'RestGenerics']
      : ['RestEndpoint'],
    ) || dirty;

  return dirty ? root.toSource({ quote: 'single' }) : fileInfo.source;
};

module.exports.parser = 'tsx';
