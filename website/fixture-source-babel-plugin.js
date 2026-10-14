/* global module */
const FN_KEYS = new Set(['response', 'fetchResponse']);
// Child keys holding TypeScript-only syntax, removed from the shown source
const TYPE_KEYS = new Set(['typeAnnotation', 'returnType', 'typeParameters']);

/** The Playground's Fixtures panel prints interceptor functions with `${fn}`,
 * which shows minified code in production builds. This pins `toString()` of
 * each fixture's `response`/`fetchResponse` function to its authored source,
 * minus TypeScript types.
 */
module.exports = function fixtureSource({ types: t }) {
  const keyName = prop =>
    !t.isSpreadElement(prop) &&
    !prop.computed &&
    (prop.key.name ?? prop.key.value);

  function authoredSource(path) {
    const { start, end } = path.node;
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
        } else if (child.isTSNonNullExpression()) {
          cuts.push([child.node.end - 1, child.node.end]);
        }
      },
    });
    const code = path.hub.getCode();
    let source = '';
    let at = start;
    for (const [from, to] of cuts.sort((a, b) => a[0] - b[0])) {
      // Cuts can nest, e.g. a type annotation inside an `as` expression
      if (from > at) source += code.slice(at, from);
      at = Math.max(at, to);
    }
    source += code.slice(at, end);
    // Nested methods keep their file indentation after the first line
    const indent = new RegExp(`^ {0,${path.node.loc.start.column}}`, 'gm');
    return source.replace(indent, '');
  }

  return {
    visitor: {
      ObjectExpression(path) {
        const props = path.node.properties;
        if (!props.some(prop => keyName(prop) === 'endpoint')) return;
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
          // Object.defineProperty(fn, 'toString', { value: () => source })
          const wrapped = t.callExpression(
            t.memberExpression(
              t.identifier('Object'),
              t.identifier('defineProperty'),
            ),
            [
              fn,
              t.stringLiteral('toString'),
              t.objectExpression([
                t.objectProperty(
                  t.identifier('value'),
                  t.arrowFunctionExpression([], t.stringLiteral(source)),
                ),
              ]),
            ],
          );
          propPath.replaceWith(t.objectProperty(prop.key, wrapped));
        });
      },
    },
  };
};
