/* global module */
/**
 * Remark plugin that shortens API signature headings in the page's table of
 * contents to the member's name. The heading itself, its anchor and the .md
 * output keep the full signature:
 *
 *   ### static process(input, parent, key, args): processedEntity {#process}
 *
 * lists as `process`. A heading counts as a signature when it starts with
 * `static`, or a name followed by `(`, `?:`, or (for a lowercase name) `:` or
 * a final `?`. Overloads list under the same name.
 *
 * Runs after Docusaurus' default plugins, rewriting the `toc` export they add.
 */
// [static] name[?][(params)][: type]; params may nest one level of parens
const SIGNATURE =
  /^(static\s+)?([A-Za-z_$][\w$]*(?:\.[\w$]+)*)(\?)?(\([^()]*(?:\([^()]*\)[^()]*)*\))?(\s*:.*)?$/s;

/** Member name of a signature heading's text, else undefined */
function signatureName(text) {
  const match = SIGNATURE.exec(text.trim());
  if (!match) return;
  const [, isStatic, name, optional, params, type] = match;
  // `Example: ...` and `Why?` are prose; members are camelCase
  const member = /^[a-z_$]/.test(name);
  if (
    isStatic ||
    params ||
    (type && (optional || member)) ||
    (optional && member)
  )
    return name;
}

const toText = node =>
  node.type === 'text' || node.type === 'inlineCode' ?
    node.value
  : (node.children ?? []).map(toText).join('');

/** `export const toc = [...]` that Docusaurus adds to every page */
function tocArray(node) {
  const declaration = node.data?.estree?.body?.[0]?.declaration;
  const declarator = declaration?.declarations?.[0];
  if (
    declarator?.id?.name === 'toc' &&
    declarator.init?.type === 'ArrayExpression'
  )
    return declarator.init;
}

/** `{ value, id, level }` property of a TOC item */
const property = (item, key) =>
  item.properties.find(p => (p.key.name ?? p.key.value) === key);

/** Heading id -> member name, for signature headings */
function signatureLabels(tree) {
  const labels = new Map();
  const visit = node => {
    const name = node.type === 'heading' && signatureName(toText(node));
    if (name && node.data?.id) labels.set(node.data.id, name);
    node.children?.forEach(visit);
  };
  visit(tree);
  return labels;
}

/** Sets each item's `value` to its label, when it has one */
function relabelToc(toc, labels) {
  for (const item of toc.elements) {
    if (item?.type !== 'ObjectExpression') continue;
    const label = labels.get(property(item, 'id')?.value.value);
    const valueProperty = property(item, 'value');
    // `value` is HTML; a name is an identifier, so it needs no escaping
    if (label && valueProperty)
      valueProperty.value = { type: 'Literal', value: label };
  }
}

function relabel(tree) {
  const labels = signatureLabels(tree);
  if (!labels.size) return;
  for (const node of tree.children) {
    const toc = node.type === 'mdxjsEsm' && tocArray(node);
    if (toc) relabelToc(toc, labels);
  }
}

module.exports = function remarkTocLabels() {
  return relabel;
};
module.exports.signatureName = signatureName;
