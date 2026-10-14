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

function babelPlugin({ types: t, template }) {
  function authoredSource(path) {
    const code = path.hub.getCode();
    const cuts = [];
    path.traverse({
      enter(child) {
        if (TYPE_KEYS.has(child.key)) {
          cuts.push([child.node.start, child.node.end]);
          child.skip();
        } else if (
          child.isTSAsExpression() ||
          child.isTSSatisfiesExpression()
        ) {
          const { expression, extra } = child.node;
          // `(post as any).author` reads as `post.author`
          if (extra?.parenthesized && t.isIdentifier(expression)) {
            cuts.push([extra.parenStart, expression.start]);
            cuts.push([expression.end, child.node.end + 1]);
          } else {
            cuts.push([expression.end, child.node.end]);
          }
        } else if (child.isIdentifier({ optional: true })) {
          // `init?: RequestInit` reads as `init`
          const nameEnd = child.node.start + child.node.name.length;
          cuts.push([nameEnd, code.indexOf('?', nameEnd) + 1]);
        } else if (child.isTSNonNullExpression()) {
          cuts.push([child.node.end - 1, child.node.end]);
        }
      },
    });
    let source = '';
    let at = path.node.start;
    for (const [from, to] of cuts.sort((a, b) => a[0] - b[0])) {
      // Cuts can nest, e.g. a type annotation inside an `as` expression
      if (from > at) source += code.slice(at, from);
      at = Math.max(at, to);
    }
    source += code.slice(at, path.node.end);
    // The first line starts at the fixture; later ones keep the file's
    // nesting, so dedent them by their shallowest line
    const later = source
      .split('\n')
      .slice(1)
      .filter(line => line.trim());
    const indent = Math.min(...later.map(line => /^ */.exec(line)[0].length));
    return later.length ?
        source.replace(new RegExp(`^ {0,${indent}}`, 'gm'), '')
      : source;
  }

  const withSourceBabel = (fn, source) =>
    template.expression.ast`Object.defineProperty(${fn}, 'toString', {
      value: () => ${t.stringLiteral(source)},
    })`;

  return {
    visitor: {
      ObjectExpression(path) {
        const props = path.node.properties;
        if (!isFixture(props)) return;
        props.forEach((prop, i) => {
          if (!FN_KEYS.has(keyName(prop))) return;
          const propPath = path.get(`properties.${i}`);
          let fn, source;
          if (t.isObjectMethod(prop, { kind: 'method' })) {
            source = authoredSource(propPath);
            fn = t.functionExpression(
              null,
              prop.params,
              prop.body,
              prop.generator,
              prop.async,
            );
          } else if (t.isObjectProperty(prop) && t.isFunction(prop.value)) {
            source = authoredSource(propPath.get('value'));
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
    for (const prop of matches) await format(prop, code, config);
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
