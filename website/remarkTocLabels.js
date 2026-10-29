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
 * a final `?`.
 * When two headings on a page shorten to the same name, both keep their
 * parameters so they stay distinguishable: `paginated(paginationfield)`.
 *
 * Runs after Docusaurus' default plugins, rewriting the `toc` export they add.
 */
// [static] name[?][(params)][: type]; params may nest one level of parens
const SIGNATURE =
  /^(static\s+)?([A-Za-z_$][\w$]*(?:\.[\w$]+)*)(\?)?(\([^()]*(?:\([^()]*\)[^()]*)*\))?(\s*:.*)?$/s;

/** { name, params } for a signature heading's text, else undefined */
function parseSignature(text) {
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
    return { name, params };
}

const toText = node =>
  node.type === 'text' || node.type === 'inlineCode' ?
    node.value
  : (node.children ?? []).map(toText).join('');

const escapeHtml = text =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Labels for the TOC's headings by id; only headings whose label changes */
function tocLabels(headings) {
  const signatures = headings.map(h => ({
    ...h,
    signature: parseSignature(h.text),
  }));
  const count = new Map();
  for (const { text, signature } of signatures) {
    const label = signature?.name ?? text;
    count.set(label, (count.get(label) ?? 0) + 1);
  }
  const labels = new Map();
  for (const { id, signature } of signatures) {
    if (!signature) continue;
    const { name, params = '' } = signature;
    labels.set(id, count.get(name) > 1 ? name + params : name);
  }
  return labels;
}

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

function relabel(tree, file) {
  // the levels the page's TOC shows, so hidden headings don't count as clashes
  const { toc_min_heading_level: min = 2, toc_max_heading_level: max = 3 } =
    file.data.frontMatter ?? {};
  const headings = [];
  const visit = node => {
    if (
      node.type === 'heading' &&
      node.data?.id &&
      node.depth >= min &&
      node.depth <= max
    )
      headings.push({ id: node.data.id, text: toText(node) });
    node.children?.forEach(visit);
  };
  visit(tree);
  const labels = tocLabels(headings);
  if (!labels.size) return;

  for (const node of tree.children) {
    if (node.type !== 'mdxjsEsm') continue;
    const toc = tocArray(node);
    if (!toc) continue;
    for (const item of toc.elements) {
      if (item?.type !== 'ObjectExpression') continue;
      const label = labels.get(property(item, 'id')?.value.value);
      const value = property(item, 'value');
      if (label === undefined || !value) continue;
      value.value = { type: 'Literal', value: escapeHtml(label) };
    }
  }
}

module.exports = function remarkTocLabels() {
  return relabel;
};
module.exports.parseSignature = parseSignature;
module.exports.tocLabels = tocLabels;
