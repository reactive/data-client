/* global require, module, __dirname, Buffer */
/**
 * Remark plugin that resolves framework-specific content in shared docs.
 *
 * Block:   :::react ... :::   or   :::vue ... :::
 * Inline:  :react[Suspense boundary] / :vue[<Suspense>]
 *
 * Matching blocks are unwrapped, the rest are removed. Runs per docs instance,
 * so the same source file renders once for React and once for Vue.
 */
const FRAMEWORKS = ['react', 'vue'];
const DIRECTIVES = ['containerDirective', 'leafDirective', 'textDirective'];

function filterChildren(node, framework) {
  if (!node.children) return;
  const next = [];
  for (const child of node.children) {
    if (DIRECTIVES.includes(child.type) && FRAMEWORKS.includes(child.name)) {
      if (child.name !== framework) continue;
      filterChildren(child, framework);
      // container label (:::vue[label]) is a paragraph flagged as directiveLabel
      next.push(...child.children.filter(c => !c.data?.directiveLabel));
      continue;
    }
    filterChildren(child, framework);
    next.push(child);
  }
  node.children = next;
}

module.exports = function remarkFramework({ framework }) {
  if (!FRAMEWORKS.includes(framework))
    throw new Error(`remarkFramework: unknown framework "${framework}"`);
  return tree => filterChildren(tree, framework);
};
module.exports.FRAMEWORKS = FRAMEWORKS;
