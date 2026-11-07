'use strict';

const fs = require('fs');
const { createRequire } = require('module');
const nodePath = require('path');

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

/** `base`, or `base2`, `base3`... when `taken` has it; adds the result to `taken` */
function uniqueName(base, taken) {
  let name = base;
  for (let n = 2; taken.has(name); n++) name = base + n;
  taken.add(name);
  return name;
}

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

// nodes whose non-computed `key` names a member rather than reading a binding
const KEYED = new Set([
  'ObjectProperty',
  'Property',
  'ClassProperty',
  'ClassMethod',
  'ObjectMethod',
  'TSPropertySignature',
  'TSMethodSignature',
  'TSDeclareMethod',
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
  // `ns.Name` and enum members name a member, like the keys below
  if (parent.type === 'TSQualifiedName' && parent.right === path.node)
    return false;
  if (parent.type === 'TSEnumMember' && parent.id === path.node) return false;
  if (
    KEYED.has(parent.type) &&
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

function hasLiveReference(j, root, localName, importScope) {
  return readsOf(j, root, localName, importScope).size() > 0;
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
          imported.add(specName(s.imported));
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
    const decl = importPath.node;
    if (decl.source.value !== 'axios') return;
    const isType = s =>
      decl.importKind === 'type' ||
      s.importKind === 'type' ||
      (s.type === 'ImportSpecifier' &&
        AXIOS_TYPE_IMPORTS.has(specName(s.imported)));
    const isRuntime = s =>
      s.type === 'ImportSpecifier' &&
      AXIOS_RUNTIME_IMPORTS.has(specName(s.imported));
    const isKnown = s => isType(s) || isRuntime(s);

    // a name stays while code still reads it, even as a type; tsc fails without it
    const remaining = decl.specifiers.filter(s => {
      if (isKnown(s))
        return hasLiveReference(j, root, s.local.name, importPath.scope);
      return axiosStillUsed || s.type !== 'ImportDefaultSpecifier';
    });
    // axios's own names left after the calls convert, which keep axios installed
    const keptNames = remaining.map(s => s.local.name);

    if (!remaining.length) {
      j(importPath).remove();
      dirty = true;
      return;
    }
    if (remaining.length !== decl.specifiers.length) {
      decl.specifiers = remaining;
      dirty = true;
    }
    if (keptNames.length && !axiosStillUsed) {
      addTodo(
        j,
        decl,
        `replace axios's ${keptNames.map(n => `\`${n}\``).join(', ')}, then remove this import`,
        'remove-axios',
      );
      dirty = true;
    }
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

  const isCreate = init =>
    init &&
    init.type === 'CallExpression' &&
    init.callee.type === 'MemberExpression' &&
    init.callee.object.type === 'Identifier' &&
    init.callee.object.name === axiosLocalName &&
    memberName(init.callee) === 'create';
  // a class can't share a statement, and taking its client's place keeps it
  // after the variables it can read and before the ones that can use it
  splitDeclarations(j, root, declarator => isCreate(declarator.init));

  root.find(j.VariableDeclarator).forEach(declPath => {
    const init = declPath.node.init;
    if (!isCreate(init)) return;
    const { statement, wrap } = statementOf(j, declPath.parent);
    // like a `for` initializer, where no class can go
    if (!inStatementList(statement)) return;

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
          if (literal && ORIGIN.exec(prefix.value)?.[0].includes('@')) {
            unknownTodos.push([
              'fetch rejects credentials in a url: remove `user:pass@` from `urlPrefix` and send them as an `Authorization` header from `getHeaders()`',
              'basic-auth',
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

    const classStatement = wrap(classDecl);
    markOptions(classStatement);
    replaceStatement(j, statement, [classStatement]);
    dirty = true;
  });

  return { dirty, createToClass, prefixedClasses };
}

/** The statement holding a declaration (its `export` when exported), and a function wrapping a node the same way */
function statementOf(j, declarationPath) {
  const exported =
    declarationPath.parent.node.type === 'ExportNamedDeclaration';
  return {
    statement: exported ? declarationPath.parent : declarationPath,
    wrap: node => (exported ? j.exportNamedDeclaration(node) : node),
  };
}

/** Whether a statement is in a block or the program, where other statements can join it */
function inStatementList(statement) {
  return typeof statement.name === 'number';
}

/** Replaces a statement with `nodes`, keeping the comments above it */
function replaceStatement(j, statement, nodes) {
  nodes[0].comments = [
    ...(statement.node.comments || []),
    ...(nodes[0].comments || []),
  ];
  j(statement).replaceWith(nodes);
}

/** Gives each declarator that passes `test` its own statement, keeping the ones between grouped */
function splitDeclarations(j, root, test) {
  root
    .find(j.VariableDeclaration)
    .filter(
      p => p.node.declarations.length > 1 && p.node.declarations.some(test),
    )
    .forEach(p => {
      const { statement, wrap } = statementOf(j, p);
      if (!inStatementList(statement)) return;
      const groups = [];
      let grouping = false;
      for (const declarator of p.node.declarations) {
        const passes = test(declarator);
        if (grouping && !passes) groups[groups.length - 1].push(declarator);
        else groups.push([declarator]);
        grouping = !passes;
      }
      replaceStatement(
        j,
        statement,
        groups.map(group => wrap(j.variableDeclaration(p.node.kind, group))),
      );
    });
}

// --- 2b. Instances imported from another file ---

// a client module usually exports `axios.create()` for the rest of the app;
// jscodeshift runs one file at a time, so read that module to know its class
const exportedInstanceCache = new Map();
// an import and a member read that an instance could have
const INSTANCE_CALL =
  /from\s*['"][\s\S]*\.\s*(?:get|post|put|patch|delete|interceptors|defaults)\b/;

function findFile(base) {
  const stem = base.replace(/\.[cm]?jsx?$/, '');
  const exts = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs', '.cts', '.cjs'];
  const candidates = [
    base,
    ...exts.map(e => stem + e),
    ...exts.map(e => nodePath.join(base, 'index' + e)),
  ];
  return candidates.find(f => {
    try {
      return fs.statSync(f).isFile();
    } catch {
      return false;
    }
  });
}

// tsconfig/jsconfig `paths` and `baseUrl` of the nearest config, so aliased
// imports like `@/lib/api-client` resolve too
const pathsCache = new Map();
function readConfig(file) {
  const text = fs
    .readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\/|("(?:\\.|[^"\\])*")|\/\/[^\n]*/g, (m, str) =>
      str ? m : '',
    )
    .replace(/,(\s*[}\]])/g, '$1');
  const config = JSON.parse(text);
  const options = config.compilerOptions || {};
  const dir = nodePath.dirname(file);
  if (typeof config.extends === 'string' && config.extends.startsWith('.')) {
    let parent = nodePath.resolve(dir, config.extends);
    if (!parent.endsWith('.json')) parent += '.json';
    try {
      const inherited = readConfig(parent);
      return {
        baseUrl:
          options.baseUrl ?
            nodePath.resolve(dir, options.baseUrl)
          : inherited.baseUrl,
        paths: options.paths || inherited.paths,
        pathsDir: options.paths ? dir : inherited.pathsDir,
      };
    } catch {
      // fall through to this config alone
    }
  }
  return {
    baseUrl: options.baseUrl && nodePath.resolve(dir, options.baseUrl),
    paths: options.paths,
    pathsDir: dir,
  };
}

function aliasConfig(fromFile) {
  const dir = nodePath.dirname(nodePath.resolve(fromFile));
  if (pathsCache.has(dir)) return pathsCache.get(dir);
  let config = null;
  for (const name of ['tsconfig.json', 'jsconfig.json']) {
    const file = nodePath.join(dir, name);
    if (!fs.existsSync(file)) continue;
    try {
      config = readConfig(file);
    } catch {
      config = {};
    }
    break;
  }
  const parent = nodePath.dirname(dir);
  // a file in the parent folder, so the lookup continues from there
  if (!config && parent !== dir)
    config = aliasConfig(nodePath.join(parent, 'index.js'));
  pathsCache.set(dir, config || {});
  return config || {};
}

// each folder's imports resolve the same way, so files there share lookups
const resolveCache = new Map();
function resolveModule(fromFile, spec) {
  const key = nodePath.dirname(nodePath.resolve(fromFile)) + '\0' + spec;
  if (!resolveCache.has(key)) resolveCache.set(key, findModule(fromFile, spec));
  return resolveCache.get(key);
}

function findModule(fromFile, spec) {
  if (spec.startsWith('.'))
    return findFile(nodePath.resolve(nodePath.dirname(fromFile), spec));
  const { baseUrl, paths, pathsDir } = aliasConfig(fromFile);
  const root = baseUrl || pathsDir;
  for (const [pattern, targets] of Object.entries(paths || {})) {
    const star = pattern.indexOf('*');
    let rest;
    if (star === -1) {
      if (spec !== pattern) continue;
      rest = '';
    } else {
      const prefix = pattern.slice(0, star);
      const suffix = pattern.slice(star + 1);
      if (!spec.startsWith(prefix) || !spec.endsWith(suffix)) continue;
      rest = spec.slice(prefix.length, spec.length - suffix.length);
    }
    for (const target of targets) {
      const file = findFile(
        nodePath.resolve(root, target.split('*').join(rest)),
      );
      if (file) return file;
    }
  }
  // a bare import is a package unless baseUrl has a file by that name
  return baseUrl ? findFile(nodePath.resolve(baseUrl, spec)) : undefined;
}

/** Names of the instances whose `.interceptors.response` the module uses */
function responseInterceptorTargets(j, root) {
  return new Set(
    root
      .find(j.MemberExpression, {
        object: {
          type: 'MemberExpression',
          object: { type: 'Identifier' },
          property: { name: 'interceptors' },
        },
        property: { name: 'response' },
      })
      .nodes()
      .map(node => node.object.object.name),
  );
}

// exported name ('default' for a default export) -> { className, prefixed,
// intercepted } for each axios instance a module exports, before or after
// this codemod has rewritten it
function exportedInstances(j, file) {
  if (exportedInstanceCache.has(file)) return exportedInstanceCache.get(file);
  const found = new Map();
  // what the module imports or re-exports at runtime, to spot an import cycle
  const imports = [];
  const entry = { instances: found, imports };
  exportedInstanceCache.set(file, entry);
  let root;
  try {
    root = j(fs.readFileSync(file, 'utf8'));
  } catch {
    return entry;
  }
  for (const node of root.get().node.program.body)
    if (
      node.source &&
      typeof node.source.value === 'string' &&
      node.importKind !== 'type' &&
      node.exportKind !== 'type'
    )
      imports.push(node.source.value);
  // exported name -> local binding
  const exportsOf = new Map();
  root.find(j.ExportNamedDeclaration).forEach(p => {
    const { declaration, specifiers, source } = p.node;
    if (source) return;
    if (declaration && declaration.type === 'VariableDeclaration') {
      for (const d of declaration.declarations)
        if (d.id.type === 'Identifier') exportsOf.set(d.id.name, d.id.name);
    } else if (declaration && declaration.id) {
      exportsOf.set(declaration.id.name, declaration.id.name);
    }
    for (const spec of specifiers || [])
      if (spec.local && spec.exported)
        exportsOf.set(specName(spec.exported), specName(spec.local));
  });
  root.find(j.ExportDefaultDeclaration).forEach(p => {
    const decl = p.node.declaration;
    if (decl.type === 'Identifier') exportsOf.set('default', decl.name);
    else if (decl.type === 'ClassDeclaration' && decl.id)
      exportsOf.set('default', decl.id.name);
  });
  // a response interceptor can change what `.data` means at each call
  const interceptedNames = responseInterceptorTargets(j, root);
  const intercepts = name => interceptedNames.has(name);

  const axiosDefault = root
    .find(j.ImportDeclaration, { source: { value: 'axios' } })
    .find(j.ImportDefaultSpecifier)
    .nodes()[0];
  if (axiosDefault) {
    // not rewritten yet: name the classes the way the rewrite will
    const { createToClass, prefixedClasses } = transformAxiosCreate(
      j,
      root,
      axiosDefault.local.name,
      /\.[cm]?tsx?$/.test(file),
    );
    for (const [exported, local] of exportsOf) {
      const scopes = createToClass.get(local);
      if (!scopes || scopes.size !== 1) continue;
      const className = [...scopes.values()][0];
      found.set(exported, {
        className,
        // the rewrite keeps an alias, and gives the class's own name otherwise
        exportName: exported === local ? className : exported,
        prefixed: prefixedClasses.has(className),
        intercepted: intercepts(local),
      });
    }
  }
  // rewritten already: the instance's export now exports its class
  const classes = new Map();
  root.find(j.ClassDeclaration).forEach(p => {
    const { id, superClass, body } = p.node;
    if (id && superClass && superClass.name === 'RestEndpoint')
      classes.set(
        id.name,
        body.body.some(m => m.key && m.key.name === 'urlPrefix' && !m.static),
      );
  });
  for (const [exported, local] of exportsOf) {
    if (!classes.has(local)) continue;
    const name = local.replace(/Endpoint$/, '');
    // the instance names the rewrite would derive this class's name from
    const sources = [name, name.charAt(0).toLowerCase() + name.slice(1)].filter(
      c => deriveClassName(c) === local,
    );
    // an aliased or default export keeps its name; otherwise the class took
    // the instance's place
    const candidates =
      exported !== local ? [exported] : sources.filter(c => !exportsOf.has(c));
    const intercepted = sources.some(intercepts);
    for (const candidate of candidates)
      if (!found.has(candidate))
        found.set(candidate, {
          className: local,
          exportName: exported,
          prefixed: classes.get(local),
          intercepted,
        });
  }
  return entry;
}

/** Whether the module `file`, with these `imports`, imports `target` */
function importsFile(file, imports, target) {
  const resolved = nodePath.resolve(target);
  return imports.some(spec => resolveModule(file, spec) === resolved);
}

// imports of axios instances from the project's own modules; renames each
// import to the instance's class once the caller has converted the calls
function importedInstances(j, root, filePath) {
  const result = {
    createToClass: new Map(),
    prefixedClasses: new Set(),
    intercepted: new Set(),
    // classes from a client module that imports this one, so they aren't
    // defined yet while this module loads
    cyclic: new Set(),
    renames: [],
  };
  if (!filePath) return result;
  const { createToClass, prefixedClasses, intercepted, cyclic, renames } =
    result;
  const taken = getExistingClassNames(j, root);
  root
    .find(j.ImportDeclaration)
    .filter(
      p =>
        p.node.importKind !== 'type' && typeof p.node.source.value === 'string',
    )
    .forEach(importPath => {
      const file = resolveModule(filePath, importPath.node.source.value);
      if (!file) return;
      const { instances, imports } = exportedInstances(j, file);
      if (!instances.size) return;
      const inCycle = importsFile(file, imports, filePath);
      for (const s of importPath.node.specifiers || []) {
        if (s.importKind === 'type') continue;
        const imported =
          s.type === 'ImportDefaultSpecifier' ? 'default'
          : s.type === 'ImportSpecifier' ? specName(s.imported)
          : null;
        const instance = imported && instances.get(imported);
        if (!instance) continue;
        const local = s.local.name;
        const { className, prefixed } = instance;
        // another binding already has the class's name
        if (
          taken.has(className) ||
          root.find(j.Identifier, { name: className }).size()
        )
          continue;
        const scope = importPath.scope.lookup(local) || importPath.scope;
        createToClass.set(local, new Map([[scope, className]]));
        if (prefixed) prefixedClasses.add(className);
        if (instance.intercepted) intercepted.add(local);
        if (inCycle) cyclic.add(className);
        renames.push({
          declaration: importPath.node,
          specifier: s,
          className,
          exportName: instance.exportName,
        });
      }
    });
  return result;
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

/** A module export or import name, which can be a string literal */
const specName = node => node.name || node.value;

/** The property name when `node` reads a non-computed member of `object` */
function memberOf(node, object) {
  return node.type === 'MemberExpression' && node.object === object ?
      memberName(node)
    : null;
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
    // fetch rejects credentials in a url
    if (origin[0].includes('@')) return null;
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

  const args = [];
  const taken = new Set();
  // the same variable can fill two segments: its source -> the param it got
  const shared = new Map();
  let path = '';
  const segments = pathPart.split('\0');
  const pathExprCount = segments.length - 1;
  for (let i = 0; i < segments.length; i++) {
    const text = segments[i];
    if (RESERVED_PATH_CHARS.test(text)) return null;
    path += text;
    if (i === segments.length - 1) break;
    // each expression must fill a whole path segment
    const next = segments[i + 1];
    if (!path.endsWith('/') || (next && !next.startsWith('/'))) return null;
    const expr = expressions[i];
    const source = isPure(expr) ? j(expr).toSource() : undefined;
    let name = source && shared.get(source);
    if (!name) {
      name = uniqueName(memberName(expr) || 'param', taken);
      if (source) shared.set(source, name);
      args.push(
        j.objectProperty.from({
          key: j.identifier(name),
          value: expr,
          shorthand: expr.type === 'Identifier' && expr.name === name,
        }),
      );
    }
    // an effect can change what a later read of an earlier variable sees
    if (!isSimple(expr)) shared.clear();
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

/** The name of a non-computed key, or null */
function keyName(node) {
  if (node.computed) return null;
  const { key } = node;
  if (key.type === 'Identifier') return key.name;
  if (key.type === 'PrivateName') return key.id.name;
  if (key.type === 'StringLiteral' || key.type === 'Literal')
    return String(key.value);
  return null;
}

function propKey(prop) {
  if (prop.type !== 'ObjectProperty' && prop.type !== 'Property') return null;
  return keyName(prop);
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
  return memberOf(node, object) === 'data';
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

  // `await api.delete(url);` reads nothing from the response
  if (parent.node.type === 'ExpressionStatement') return true;

  if (parent.node.type === 'AwaitExpression') {
    const awaitNode = parent.node;
    const outer = parent.parent;
    if (outer.node.type === 'ExpressionStatement') return true;
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
      const cbPath = thenPath.get('arguments', 0);
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

  // axios sends both a url query key and the same key from spread params;
  // an object keeps only one
  if (spreadParams.length && url.query.length) return null;
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
  const params =
    !callArgs.length ? null
    : data ? oneLineObject(j, callArgs)
    : j.objectExpression(callArgs);
  const invokeArgs = [params, data].filter(Boolean);

  return {
    node: j.callExpression(endpoint, invokeArgs),
    method: methodName,
    path: url.path,
    // the response type the axios call was given
    responseType: isTS && typeArgs && typeArgs.params[0],
    unknownOptions,
    todos,
  };
}

/**
 * A short object recast prints on one line, as people write params before a
 * body (recast prints the objects it builds over several lines). Prettier,
 * when it runs, breaks the call if the line is too long.
 */
function oneLineObject(j, properties) {
  const text = `{ ${properties.map(p => j(p).toSource()).join(', ')} }`;
  if (text.includes('\n') || text.length > 50)
    return j.objectExpression(properties);
  // a parsed node reprints as its source text (unless it was parenthesized)
  return j(`f(${text})`).find(j.CallExpression).get().node.arguments[0];
}

// --- 3b. Build each endpoint once, at module scope ---

/** What a function is called: its own name, its key, or what it's assigned to */
function functionName(path) {
  const { node } = path;
  if (node.id) return node.id.name;
  if (node.key) return keyName(node);
  const parent = path.parent.node;
  if (parent.type === 'VariableDeclarator')
    return parent.id.type === 'Identifier' ? parent.id.name : null;
  if (parent.type === 'AssignmentExpression' && parent.right === node)
    return memberName(parent.left);
  if (parent.value === node && parent.key) return keyName(parent);
  return null;
}

/**
 * The nearest function around a call that has a name, as `{ fn, fnName }`
 * (both null when none does); null when the call is in no function, where
 * its endpoint is built once anyway.
 */
function enclosingFunction(j, callPath) {
  const fns = [];
  for (let p = callPath.parent; p; p = p.parent)
    if (j.Function.check(p.node))
      fns.push({ fn: p.node, fnName: toIdentifier(functionName(p)) });
  if (!fns.length) return null;
  return fns.find(f => f.fnName) || { fn: null, fnName: null };
}

/** camelCase identifier from text like `get-post` or `/users/:id/posts` */
function toIdentifier(text) {
  const words = (text || '').split(/[^A-Za-z0-9_$]+/).filter(Boolean);
  if (!words.length) return null;
  const name = words[0] + words.slice(1).map(capitalize).join('');
  return /^\d/.test(name) ? '_' + name : name;
}

/**
 * Where a module-level endpoint goes: after the imports, and after the class
 * it extends when the module declares it. Not just above its function, since
 * a function declaration can run before its own statement.
 */
function insertionIndex(body, className) {
  const importsEnd =
    body.findLastIndex(
      s =>
        s.type === 'ImportDeclaration' ||
        s.type === 'TSImportEqualsDeclaration',
    ) + 1;
  const classEnd =
    body.findIndex(s => {
      const decl = s.declaration || s;
      return (
        decl.type === 'ClassDeclaration' &&
        decl.id &&
        decl.id.name === className
      );
    }) + 1;
  return Math.max(importsEnd, classEnd);
}

/**
 * Moves each endpoint a function builds into a module `const`, so it's built
 * once and can take a `schema` or go to `useSuspense()` later. It's named
 * after its function, or by method and path when a function has several.
 */
function hoistEndpoints(j, root, hoists) {
  if (!hoists.length) return;
  const program = root.get().node.program;
  const taken = new Set(
    root
      .find(j.Identifier)
      .nodes()
      .map(n => n.name),
  );
  const perFunction = new Map();
  for (const { fn } of hoists)
    if (fn) perFunction.set(fn, (perFunction.get(fn) || 0) + 1);
  // its function's name when it's the function's only endpoint
  const endpointName = ({ fn, fnName, method, path }) =>
    uniqueName(
      (fn && perFunction.get(fn) === 1 ?
        fnName
      : toIdentifier(`${method} ${path.replace(/:\w+/g, '')}`)) + 'Endpoint',
      taken,
    );

  // body index -> declarations to insert there, in source order
  const inserts = new Map();
  for (const hoist of hoists.sort((a, b) => a.start - b.start)) {
    const { node: call, className, unknownOptions } = hoist;
    const name = endpointName(hoist);

    const decl = j.variableDeclaration('const', [
      j.variableDeclarator(j.identifier(name), call.callee),
    ]);
    call.callee = j.identifier(name);
    if (unknownOptions.length) {
      const [message, anchor] = optionsTodo(unknownOptions, `\`${name}\``);
      addTodo(j, decl, message, anchor);
    }

    const index = insertionIndex(program.body, className);
    if (!inserts.has(index)) inserts.set(index, []);
    inserts.get(index).push(decl);
  }
  for (const index of [...inserts.keys()].sort((a, b) => b - a))
    program.body.splice(index, 0, ...inserts.get(index));
}

function transformDirectCalls(
  j,
  root,
  axiosLocalName,
  axiosImportScope,
  { createToClass, prefixedClasses, intercepted: importedIntercepted, cyclic },
  isTS,
) {
  let dirty = false;
  let marked = false;
  const hoists = [];
  const callTargets = new Set([axiosLocalName, ...createToClass.keys()]);
  // a response interceptor can change what `.data` refers to (often the
  // body's own `data` field, after `response => response.data`)
  const intercepted = new Set([
    ...[...responseInterceptorTargets(j, root)].filter(name =>
      callTargets.has(name),
    ),
    ...importedIntercepted,
  ]);

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

    // the endpoint's options are literals, so it can move to module scope
    // when the instance it's called on is module-level too, and its class is
    // defined before this module runs
    const site =
      (!className || (callBindingScope.isGlobal && !cyclic.has(className))) &&
      enclosingFunction(j, callPath);
    if (site) {
      const { node, method, path, unknownOptions } = result;
      hoists.push({
        ...site,
        start: callPath.node.start,
        node,
        method,
        path,
        unknownOptions,
        className,
      });
    }
    j(callPath).replaceWith(result.node);
    // a hoisted endpoint gets this TODO itself
    if (!site && result.unknownOptions.length) {
      const [message, anchor] = optionsTodo(result.unknownOptions);
      markTodo(j, callPath, message, anchor);
    }
    for (const [message, anchor] of result.todos)
      markTodo(j, callPath, message, anchor);
    if (intercepted.has(targetName)) {
      markTodo(
        j,
        callPath,
        `\`${targetName}\` has a response interceptor, so check each \`.data\` read of this call: drop it if it read axios's response, keep it if it reads the body's own field`,
        'base-endpoint',
      );
    } else if (!unwrapData(j, callPath)) {
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
  return { dirty, marked, hoists };
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
  AxiosError: [
    'check `NetworkError` instead of `AxiosError`',
    'error-handling',
  ],
};

/** Instance members that configure it: [what, how it was handled, pronoun] */
const INSTANCE_SETUP = {
  interceptors: ['this interceptor', 'is commented out', 'it'],
  defaults: ['these defaults', 'are commented out', 'them'],
};

function markLeftovers(
  j,
  root,
  axiosLocalName,
  axiosImportScope,
  createToClass,
) {
  let dirty = false;
  /** module-level statements that read a removed instance, to their TODO */
  const commentOut = new Map();

  // calls it couldn't convert are marked already
  const isMarkedCall = p => HTTP_METHODS.has(memberOf(p.parent.node, p.node));

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
        // the module exports the class now, which importers convert to
        if (parent.type === 'ExportSpecifier') {
          if (parent.local !== p.node) return;
          const exported = specName(parent.exported);
          parent.local = j.identifier(className);
          if (exported === name) parent.exported = j.identifier(className);
          dirty = true;
          return;
        }
        if (parent.type === 'ExportDefaultDeclaration') {
          parent.declaration = j.identifier(className);
          dirty = true;
          return;
        }
        const member = memberOf(parent, p.node);
        const setup = own(INSTANCE_SETUP, member);
        if (setup) {
          const [noun, isCommentedOut, pronoun] = setup;
          // module setup like `api.interceptors.request.use(fn)` would read
          // the removed instance, so keep it as comments to move by hand
          const statement = moduleStatement(j, p);
          if (statement) {
            commentOut.set(
              statement,
              `\`${name}\` is the \`${className}\` class now, so ${noun} ${isCommentedOut}; move ${pronoun} into \`${className}\``,
            );
          } else {
            markTodo(
              j,
              p,
              `move ${noun} into \`${className}\``,
              'base-endpoint',
            );
          }
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
        const member = memberOf(parent, p.node);
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
        const imported = specName(s.imported);
        const local = (s.local && s.local.name) || imported;
        const todo = own(AXIOS_MEMBER_TODOS, imported);
        if (!todo) continue;
        readsOf(j, root, local, importPath.scope, { types: false }).forEach(
          p => {
            markTodo(j, p, todo[0], todo[1]);
            dirty = true;
          },
        );
      }
    });

  return { dirty, commentOut };
}

/** The module-level expression statement `path` reads in directly, not from a nested function */
function moduleStatement(j, path) {
  if (enclosingFunction(j, path)) return null;
  let p = path;
  while (p.parent && p.parent.node.type !== 'Program') p = p.parent;
  return p.parent && p.node.type === 'ExpressionStatement' ? p : null;
}

const COMMENTED_OUT = '__dataClientCommentedOut';

/**
 * Swaps each statement for a placeholder that `restoreCommentedOut()` turns
 * into its source as line comments, under a TODO. Returns what to restore.
 */
function commentOutStatements(j, commentOut) {
  const commentedOut = [];
  for (const [path, message] of commentOut) {
    const { node } = path;
    const comments = node.comments || [];
    // the saved source leaves out the comments, which stay comments, on the
    // placeholder
    node.comments = null;
    const index = commentedOut.length;
    commentedOut.push({
      source: j(node).toSource(),
      blankAfter: blankLineAfter(path),
    });
    node.comments = comments;
    const placeholder = j.expressionStatement(
      j.identifier(`${COMMENTED_OUT}${index}`),
    );
    addTodo(j, placeholder, message, 'base-endpoint');
    replaceStatement(j, path, [placeholder]);
  }
  return commentedOut;
}

/** Whether a blank line separates the statement at `path` from the next one */
function blankLineAfter(path) {
  const next = path.parent.node.body[path.name + 1];
  if (!next || !next.loc || !path.node.loc) return true;
  const first = (next.comments || []).find(c => c.leading && c.loc) || next;
  return first.loc.start.line - path.node.loc.end.line > 1;
}

/**
 * Turns each placeholder `commentOutStatements()` left into the statement's
 * source as line comments
 */
function restoreCommentedOut(output, commentedOut) {
  if (!commentedOut.length) return output;
  const restored = output.replace(
    // recast spaces the placeholder from the next statement with a blank line
    new RegExp(
      `^([ \\t]*)${COMMENTED_OUT}(\\d+);?[ \\t]*(\\n(?=[ \\t]*\\n))?`,
      'gm',
    ),
    (_, indent, index, blank) => {
      const { source, blankAfter } = commentedOut[index];
      const lines = source
        .split('\n')
        .map(line => (line ? `${indent}// ${line}` : `${indent}//`))
        .join('\n');
      return blank && blankAfter ? lines + blank : lines;
    },
  );
  // a placeholder left behind would be a ReferenceError at runtime
  if (restored.includes(COMMENTED_OUT))
    throw new Error(
      'axios-to-rest: could not restore a commented-out statement',
    );
  return restored;
}

// --- Output style ---

/**
 * The quotes and trailing commas the file already uses, so reprinted code
 * matches what its formatter expects. With no sample: single quotes, and
 * trailing commas like Prettier 3's default
 */
function sourceStyle(j, root, source) {
  const votes = { single: 0, double: 0 };
  root.find(j.StringLiteral).forEach(p => {
    // JSX attributes follow their own setting (jsxSingleQuote)
    if (p.parent.node.type === 'JSXAttribute') return;
    const raw = p.node.extra && p.node.extra.raw;
    if (raw && raw[0] === "'") votes.single++;
    else if (raw && raw[0] === '"') votes.double++;
  });

  // [with, without] a trailing comma, among lists whose closing bracket
  // sits on its own line
  const commas = { lists: [0, 0], parameters: [0, 0] };
  const vote = (kind, last, closeIndex) => {
    if (!last || last.end == null || closeIndex < last.end) return;
    const between = source.slice(last.end, closeIndex);
    if (!between.includes('\n')) return;
    commas[kind][between.includes(',') ? 0 : 1]++;
  };
  const voteList = ({ node }, items) =>
    node.end != null && vote('lists', items[items.length - 1], node.end - 1);
  root.find(j.ObjectExpression).forEach(p => voteList(p, p.node.properties));
  root.find(j.ArrayExpression).forEach(p => voteList(p, p.node.elements));
  root.find(j.Function).forEach(({ node }) => {
    const last = node.params[node.params.length - 1];
    if (last && last.type !== 'RestElement')
      vote('parameters', last, source.indexOf(')', last.end));
  });
  const lists = commas.lists[0] >= commas.lists[1];
  const [withComma, without] = commas.parameters;
  return {
    quote: votes.double > votes.single ? 'double' : 'single',
    trailingComma: {
      objects: lists,
      arrays: lists,
      parameters: withComma || without ? withComma >= without : lists,
    },
  };
}

// --- Main ---

function transform(fileInfo, api) {
  // skip parsing files that neither import axios nor could call an instance
  // imported from another module
  const { source } = fileInfo;
  if (!source.includes('axios') && !INSTANCE_CALL.test(source)) return source;
  const j = api.jscodeshift;
  const root = j(source);
  const isTS = /\.[cm]?tsx?$/.test(fileInfo.path || '');

  const axiosImport = root
    .find(j.ImportDeclaration)
    .filter(p => p.node.source.value === 'axios');
  const imported = importedInstances(j, root, fileInfo.path);
  if (!axiosImport.length && !imported.renames.length) return source;
  // before any edit, while every node still has its source position
  const printOptions = sourceStyle(j, root, source);

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
  for (const [name, scopes] of imported.createToClass)
    createResult.createToClass.set(name, scopes);
  for (const className of imported.prefixedClasses)
    createResult.prefixedClasses.add(className);
  createResult.intercepted = imported.intercepted;
  createResult.cyclic = imported.cyclic;

  const calls = transformDirectCalls(
    j,
    root,
    axiosLocalName,
    axiosImportScope,
    createResult,
    isTS,
  );
  dirty = calls.dirty || calls.marked || dirty;

  const leftovers = markLeftovers(
    j,
    root,
    axiosLocalName,
    axiosImportScope,
    createResult.createToClass,
  );
  dirty = leftovers.dirty || dirty;
  const commentedOut = commentOutStatements(j, leftovers.commentOut);

  // after the calls, which look the instance up by its imported name
  for (const {
    declaration,
    specifier,
    className,
    exportName,
  } of imported.renames) {
    declaration.specifiers = declaration.specifiers.map(s =>
      s !== specifier ? s
      : s.type === 'ImportDefaultSpecifier' ?
        j.importDefaultSpecifier(j.identifier(className))
      : exportName === className ? j.importSpecifier(j.identifier(className))
      : j.importSpecifier(j.identifier(exportName), j.identifier(className)),
    );
    dirty = true;
  }

  if (axiosImport.length) {
    dirty =
      transformImports(
        j,
        root,
        axiosLocalName,
        createResult.dirty || calls.dirty,
        isTS && createResult.dirty ?
          ['RestEndpoint', 'RestGenerics']
        : ['RestEndpoint'],
      ) || dirty;
  }
  // last, so the names the imports and renamed instances took are taken
  hoistEndpoints(j, root, calls.hoists);

  return dirty ?
      restoreCommentedOut(root.toSource(printOptions), commentedOut)
    : source;
}

/**
 * Formats the output with the project's own Prettier and config, when it has
 * them and already keeps this file formatted. Recast can't measure line width.
 */
async function formatLikeProject(output, file, source) {
  if (!file) return output;
  const filepath = nodePath.resolve(file);
  let prettier;
  try {
    prettier = createRequire(filepath)('prettier');
  } catch {
    // no Prettier, or one that can't load here: keep recast's output
    return output;
  }
  // the CLI reads .editorconfig too
  const config = await prettier.resolveConfig(filepath, { editorconfig: true });
  if (!config) return output;
  const options = { ...config, filepath };
  // leave files the project doesn't format alone, so the diff stays small
  if (!(await prettier.check(source, options))) return output;
  return prettier.format(output, options);
}

module.exports = async function transformer(fileInfo, api, options = {}) {
  const output = transform(fileInfo, api);
  // --prettier=false keeps recast's output
  return output === fileInfo.source || String(options.prettier) === 'false' ?
      output
    : formatLikeProject(output, fileInfo.path, fileInfo.source);
};

module.exports.parser = 'tsx';
