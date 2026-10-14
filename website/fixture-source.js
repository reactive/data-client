/* global require, module, __filename */
/** The Playground's Fixtures panel prints `response`/`fetchResponse`
 * functions with `${fn}`, which shows minified code in production builds.
 * These plugins pin each fixture function's `toString()` to its authored
 * source: `babelPlugin` for fixtures in JS/TS modules (minus their types),
 * `recmaPlugin` for fixtures written inline in MDX.
 */
const prettier = require('prettier');

const FN_KEYS = new Set(['response', 'fetchResponse']);
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

/** `Object.defineProperty(fn, 'toString', { value: () => source })` in ESTree */
const withSourceEstree = (fn, source) => ({
  type: 'CallExpression',
  callee: {
    type: 'MemberExpression',
    computed: false,
    object: { type: 'Identifier', name: 'Object' },
    property: { type: 'Identifier', name: 'defineProperty' },
  },
  arguments: [
    fn,
    { type: 'Literal', value: 'toString' },
    {
      type: 'ObjectExpression',
      properties: [
        {
          type: 'Property',
          kind: 'init',
          method: false,
          shorthand: false,
          computed: false,
          key: { type: 'Identifier', name: 'value' },
          value: {
            type: 'ArrowFunctionExpression',
            params: [],
            body: { type: 'Literal', value: source },
          },
        },
      ],
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
          literals.push(child.node);
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
    // nesting, so cut their shared indent (text inside template literals
    // and JSX attribute strings is the fixture's data, so it's neither
    // measured nor cut)
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

  const withSourceBabel = (fn, source) =>
    template.expression.ast`Object.defineProperty(${fn}, 'toString', {
      value: () => ${t.stringLiteral(source)},
    })`;

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
          let fn, source;
          if (t.isObjectMethod(prop, { kind: 'method' })) {
            source = authoredSource(propPath);
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
            const error = parseError(source);
            if (error) return warnMinified(filename, prop, error);
            fn = prop.value;
          } else {
            return;
          }
          propPath.replaceWith(
            t.objectProperty(prop.key, withSourceBabel(fn, source)),
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
  prop.value = withSourceEstree(prop.value, source);
  prop.method = false;
}

module.exports = { babelPlugin, recmaPlugin };
