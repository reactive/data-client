/* global require, module, __filename */
/** The Playground's Fixtures panel prints `response`/`fetchResponse`
 * functions with `${fn}`, which shows minified code in production builds.
 * These plugins pin each fixture function's `toString()` to its authored
 * source, and its `returnedSource` to what it returns, on one line, for the
 * panel's collapsed rows: `babelPlugin` for fixtures in JS/TS modules (minus
 * their types), `recmaPlugin` for fixtures written inline in MDX.
 */
const { createRequire } = require('module');
const prettier = require('prettier');

// `delay` too, so the panel can show a function's fixed delay
const FN_KEYS = new Set(['response', 'fetchResponse', 'delay']);
// Babel child keys holding TypeScript-only syntax, cut from the shown source
// (Babel 8 moves call and `new` type arguments to typeArguments)
const TYPE_KEYS = new Set([
  'typeAnnotation',
  'returnType',
  'typeParameters',
  'typeArguments',
]);

const keyName = prop =>
  !prop.computed && prop.key && (prop.key.name ?? prop.key.value);
const isFixture = props => props.some(prop => keyName(prop) === 'endpoint');

/** Where in a function (Babel or ESTree) the node it returns sits: an
 * arrow's expression body, or the argument of its body's only `return`
 * (with several, it has no one value to show) */
function returnedKey(fn) {
  if (fn.body.type !== 'BlockStatement') return 'body';
  let returns = 0;
  const count = node => {
    if (!node || typeof node.type !== 'string') return;
    // a nested function's returns are its own
    if (/Function|Method/.test(node.type)) return;
    if (node.type === 'ReturnStatement') returns++;
    for (const key in node) {
      if (key === 'loc' || key.endsWith('Comments')) continue;
      [node[key]].flat().forEach(count);
    }
  };
  fn.body.body.forEach(count);
  const i = fn.body.body.length - 1;
  const last = fn.body.body[i];
  return returns === 1 && last?.type === 'ReturnStatement' && last.argument ?
      `body.body.${i}.argument`
    : undefined;
}

// The Babel Docusaurus builds with, to reprint returned expressions
const docusaurusRequire = createRequire(require.resolve('@docusaurus/babel'));
const { default: generate } = docusaurusRequire('@babel/generator');
const { parseExpression } = createRequire(
  docusaurusRequire.resolve('@babel/core'),
)('@babel/parser');

/** A glance at an expression's text: reprinted on one line, without
 * comments; undefined for text that doesn't parse alone (like `yield`) */
function oneLine(text) {
  try {
    const expression = parseExpression(text, {
      plugins: ['jsx'],
      allowAwaitOutsideFunction: true,
    });
    return generate(expression, { concise: true, comments: false }).code;
  } catch {
    return undefined;
  }
}

const estreeProperty = (name, value) => ({
  type: 'Property',
  kind: 'init',
  method: false,
  shorthand: false,
  computed: false,
  key: { type: 'Identifier', name },
  value,
});
/** In ESTree: `Object.defineProperties(fn, {
 *   toString: { value: () => source },
 *   returnedSource: { value: returned },
 * })` */
const withSourceEstree = (fn, source, returned) => ({
  type: 'CallExpression',
  callee: {
    type: 'MemberExpression',
    computed: false,
    object: { type: 'Identifier', name: 'Object' },
    property: { type: 'Identifier', name: 'defineProperties' },
  },
  arguments: [
    fn,
    {
      type: 'ObjectExpression',
      properties: Object.entries({
        toString: {
          type: 'ArrowFunctionExpression',
          params: [],
          body: { type: 'Literal', value: source },
        },
        returnedSource:
          returned ?
            { type: 'Literal', value: returned }
          : { type: 'Identifier', name: 'undefined' },
      }).map(([name, value]) =>
        estreeProperty(name, {
          type: 'ObjectExpression',
          properties: [estreeProperty('value', value)],
        }),
      ),
    },
  ],
});

/** Only the panel's text is at stake, so a fixture that can't be shown as
 * authored keeps its minified `toString()` rather than failing the build
 */
const warnMinified = (file, node, error) =>
  console.warn(
    `${file}:${node.loc?.start.line}: Fixtures panel shows this fixture minified: ${error.message.split('\n')[0]}`,
  );

function babelPlugin({ types: t, template }) {
  function authoredSource(path) {
    const code = path.hub.getCode();
    const { start, end } = path.node;
    const cuts = [];
    const literals = [];
    // A node's range leaves out its own parens; space or comments can sit
    // before the closing one
    const closeParen = node => code.indexOf(')', node.end) + 1;
    path.traverse({
      enter(child) {
        if (child.isTemplateElement() || child.isStringLiteral()) {
          // Only multi-line text can hold a line start, so skip the rest to
          // keep the per-line scan below short (keep ones of unknown extent)
          const { loc } = child.node;
          if (!loc || loc.start.line !== loc.end.line) {
            literals.push(child.node);
          }
        } else if (TYPE_KEYS.has(child.key)) {
          cuts.push([child.node.start, child.node.end]);
          child.skip();
        } else if (
          child.isTSAsExpression() ||
          child.isTSSatisfiesExpression() ||
          child.isTSTypeAssertion()
        ) {
          const { expression, extra } = child.node;
          // `(post as any).author` and `(<any>post).author` read as `post.author`
          if (extra?.parenthesized && t.isIdentifier(expression)) {
            cuts.push([extra.parenStart, expression.start]);
            cuts.push([expression.end, closeParen(child.node)]);
          } else if (child.isTSTypeAssertion()) {
            // `<any>(a + 1)` keeps its parens
            cuts.push([
              child.node.start,
              expression.extra?.parenStart ?? expression.start,
            ]);
          } else {
            // `(a + 1) as any` keeps its parens
            const exprEnd =
              expression.extra?.parenthesized ?
                closeParen(expression)
              : expression.end;
            cuts.push([exprEnd, child.node.end]);
          }
        } else if (child.isIdentifier({ optional: true })) {
          // `init?: RequestInit` reads as `init`; TS allows space or comments
          // before the `?`, so cut everything up to the type
          const { start, name, typeAnnotation, end } = child.node;
          cuts.push([start + name.length, typeAnnotation?.start ?? end]);
        } else if (
          child.listKey === 'params' &&
          child.isIdentifier({ name: 'this' })
        ) {
          // a `this: T` parameter only exists for types
          const next = child.getSibling(child.key + 1).node;
          cuts.push([child.node.start, next?.start ?? child.node.end]);
          child.skip();
        } else if (child.isTSNonNullExpression()) {
          cuts.push([child.node.end - 1, child.node.end]);
        }
      },
    });
    // The first line starts at the fixture; later ones keep the file's
    // nesting, so cut their shared indent (text inside string and template
    // literals, e.g. a multi-line JSX attribute, is the fixture's data, so
    // it's neither measured nor cut)
    const indents = [];
    for (let nl = code.indexOf('\n', start); nl !== -1 && nl < end;) {
      const line = nl + 1;
      nl = code.indexOf('\n', line);
      if (literals.some(l => l.start < line && line <= l.end)) continue;
      const indent = /^ */.exec(code.slice(line, nl === -1 ? end : nl))[0];
      indents.push({
        line,
        length: indent.length,
        blank: line + indent.length === nl,
      });
    }
    const base = Math.min(
      ...indents.filter(({ blank }) => !blank).map(({ length }) => length),
    );
    for (const { line, length } of indents) {
      cuts.push([line, line + Math.min(length, base)]);
    }
    let source = '';
    let at = start;
    for (const [from, to] of cuts.sort((a, b) => a[0] - b[0])) {
      // Cuts can nest, e.g. a type annotation inside an `as` expression
      if (from > at) source += code.slice(at, from);
      at = Math.max(at, to);
    }
    return source + code.slice(at, end);
  }

  const withSourceBabel = (fn, source, returned) =>
    template.expression.ast`Object.defineProperties(${fn}, {
      toString: { value: () => ${t.stringLiteral(source)} },
      returnedSource: {
        value: ${returned ? t.stringLiteral(returned) : t.identifier('undefined')},
      },
    })`;

  const returnedSource = fnPath => {
    const key = returnedKey(fnPath.node);
    return key && oneLine(authoredSource(fnPath.get(key)));
  };

  // Text cuts can miss shapes no fixture uses yet, like `((a as any)).b`,
  // so source that doesn't parse is never shown
  const parseError = expression => {
    try {
      // Parse-only check: enables JSX (fixtures may be .tsx) and turns off
      // placeholders, which would otherwise claim ALL_CAPS names
      template.expression(expression, {
        plugins: ['jsx'],
        placeholderPattern: false,
      })();
    } catch (error) {
      return error;
    }
  };

  return {
    visitor: {
      ObjectExpression(path, { filename }) {
        const props = path.node.properties;
        if (!isFixture(props)) return;
        props.forEach((prop, i) => {
          if (!FN_KEYS.has(keyName(prop))) return;
          const propPath = path.get(`properties.${i}`);
          let fn, source, returned;
          if (t.isObjectMethod(prop, { kind: 'method' })) {
            source = authoredSource(propPath);
            returned = returnedSource(propPath);
            const error = parseError(`({ ${source} })`);
            if (error) return warnMinified(filename, prop, error);
            fn = t.functionExpression(
              null,
              prop.params,
              prop.body,
              prop.generator,
              prop.async,
            );
          } else if (t.isObjectProperty(prop) && t.isFunction(prop.value)) {
            source = authoredSource(propPath.get('value'));
            returned = returnedSource(propPath.get('value'));
            const error = parseError(source);
            if (error) return warnMinified(filename, prop, error);
            fn = prop.value;
          } else {
            return;
          }
          propPath.replaceWith(
            t.objectProperty(prop.key, withSourceBabel(fn, source, returned)),
          );
        });
      },
    },
  };
}

let prettierConfig;
/** MDX keeps the author's (often unindented) text, so it's run through
 * Prettier, as the repo formats its own fixture modules.
 */
function recmaPlugin() {
  return async (tree, file) => {
    const matches = [];
    const walk = node => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node.type !== 'string') return;
      if (node.type === 'ObjectExpression' && isFixture(node.properties)) {
        matches.push(
          ...node.properties.filter(
            prop =>
              prop.type === 'Property' &&
              FN_KEYS.has(keyName(prop)) &&
              /^(Arrow)?FunctionExpression$/.test(prop.value.type),
          ),
        );
      }
      for (const key in node) if (key !== 'loc') walk(node[key]);
    };
    walk(tree);
    if (!matches.length) return;
    const code = String(file.value);
    const config = await (prettierConfig ??=
      prettier.resolveConfig(__filename));
    for (const prop of matches) {
      // Prettier can't parse a fixture in a blockquote, which keeps its `> `
      // prefixes
      await format(prop, code, config).catch(error =>
        warnMinified(file.path, prop, error),
      );
    }
  };
}

async function format(prop, code, config) {
  // Methods only parse inside an object
  const [open, close] = prop.method ? ['_ = {', '}'] : ['_ = ', ''];
  // A parenthesized value's own range leaves out its parens
  const node = prop.method ? prop : prop.value;
  const formatted = await prettier.format(
    open + code.slice(node.start, node.end) + close,
    { ...config, parser: 'babel' },
  );
  let source = formatted.trim().slice(open.length).replace(/;$/, '');
  if (prop.method) {
    // Unwrap the object: drop its braces and trailing comma, then dedent
    source = source
      .slice(1, -1)
      .trim()
      .replace(/,$/, '')
      .replace(/^ {2}/gm, '');
  }
  const key = returnedKey(prop.value);
  const returned =
    key && key.split('.').reduce((parent, k) => parent[k], prop.value);
  prop.value = withSourceEstree(
    prop.value,
    source,
    returned && oneLine(code.slice(returned.start, returned.end)),
  );
  prop.method = false;
}

module.exports = { babelPlugin, recmaPlugin };
