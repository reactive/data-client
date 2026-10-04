/* global module */
/**
 * Remark plugin that resolves framework-specific content in shared docs.
 *
 * Block:   :::react ... :::   or   :::vue ... :::
 * Inline:  :react[Suspense boundary] / :vue[<Suspense>]
 *
 * Matching blocks are unwrapped, the rest are removed. Runs per docs instance,
 * so the same source file renders once for React and once for Vue.
 *
 * With `routeBasePath`, absolute `/docs/...` links are pointed at this
 * instance when the target doc exists in it (`docIds`), so Vue pages link to
 * Vue pages; links to React-only docs keep going to /docs.
 */
const FRAMEWORKS = ['react', 'vue'];
const DIRECTIVES = ['containerDirective', 'leafDirective', 'textDirective'];

/** Heading left with no text (at most a `{#id}`) once the other framework's content is removed */
const isEmptyHeading = node =>
  node.type === 'heading' &&
  node.children.every(
    c => c.type === 'text' && /^\s*(\\?\{#[^}]*\})?\s*$/.test(c.value),
  );

function filterChildren(node, framework) {
  if (!node.children) return;
  node.children = node.children.flatMap(child => {
    filterChildren(child, framework);
    if (isEmptyHeading(child)) return [];
    if (!DIRECTIVES.includes(child.type) || !FRAMEWORKS.includes(child.name))
      return [child];
    if (child.name !== framework) return [];
    // container label (:::vue[label]) is a paragraph flagged as directiveLabel
    return child.children.filter(c => !c.data?.directiveLabel);
  });
}

const DOCS_LINK = /^\/docs(?:\/([^#?]*))?([#?].*)?$/;

function rewriteLinks(node, routeBasePath, docIds) {
  if (node.type === 'link' || node.type === 'definition') {
    const match = node.url.match(DOCS_LINK);
    const id = match?.[1]?.replace(/\.mdx?$/, '').replace(/\/$/, '');
    if (match && (!id || docIds.has(id)))
      node.url = `/${routeBasePath}${id ? `/${id}` : ''}${match[2] ?? ''}`;
  }
  node.children?.forEach(child => rewriteLinks(child, routeBasePath, docIds));
}

module.exports = function remarkFramework({
  framework,
  routeBasePath,
  docIds,
}) {
  return tree => {
    filterChildren(tree, framework);
    if (routeBasePath) rewriteLinks(tree, routeBasePath, docIds);
  };
};
module.exports.FRAMEWORKS = FRAMEWORKS;
