/* global module, require */
/**
 * Remark plugin that resolves framework-specific content in shared docs.
 *
 * Block:   :::react ... :::   or   :::vue ... :::
 * Inline:  :react[Suspense boundary] / :vue[<Suspense>]
 *
 * Matching blocks are unwrapped, the rest are removed. Runs per docs instance,
 * so the same source file renders once for React and once for Vue. Imports
 * left unused afterwards (a React-only partial on a Vue page) are dropped so
 * they are not bundled.
 *
 * With `routeBasePath`, absolute `/docs/...` links are pointed at this
 * instance when the target doc exists in it (`docIds`), so Vue pages link to
 * Vue pages; links to React-only docs keep going to /docs.
 */
const { DOCS_INSTANCES } = require('./docsInstances.js');

const FRAMEWORKS = DOCS_INSTANCES.flatMap(d => d.framework ?? []);
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

/** Names a tree may reference (over-approximated: any identifier counts) */
function collectReferences(node, refs = new Set()) {
  if (node.type === 'ImportDeclaration') return refs;
  if (node.type === 'Identifier' || node.type === 'JSXIdentifier')
    refs.add(node.name);
  if (
    (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') &&
    node.name
  )
    refs.add(node.name.split(/[.:]/)[0]);
  for (const key in node) {
    const value = node[key];
    if (key === 'position' || !value || typeof value !== 'object') continue;
    if (Array.isArray(value)) {
      for (const child of value)
        if (child && typeof child === 'object') collectReferences(child, refs);
    } else collectReferences(value, refs);
  }
  return refs;
}

/** Remove import declarations whose bindings are no longer referenced */
function pruneImports(tree) {
  const refs = collectReferences(tree);
  const isUsed = statement =>
    statement.type !== 'ImportDeclaration' ||
    !statement.specifiers.length ||
    statement.specifiers.some(s => refs.has(s.local.name));
  // MDX compiles ESM from `data.estree`; `value` is not read downstream
  tree.children = tree.children.filter(node => {
    const program = node.type === 'mdxjsEsm' && node.data?.estree;
    if (!program) return true;
    program.body = program.body.filter(isUsed);
    return program.body.length > 0;
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
    pruneImports(tree);
    if (routeBasePath) rewriteLinks(tree, routeBasePath, docIds);
  };
};
module.exports.FRAMEWORKS = FRAMEWORKS;
