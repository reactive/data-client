/* global module */
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
  node.children = node.children.flatMap(child => {
    filterChildren(child, framework);
    if (!DIRECTIVES.includes(child.type) || !FRAMEWORKS.includes(child.name))
      return [child];
    if (child.name !== framework) return [];
    // container label (:::vue[label]) is a paragraph flagged as directiveLabel
    return child.children.filter(c => !c.data?.directiveLabel);
  });
}

module.exports = function remarkFramework({ framework }) {
  return tree => filterChildren(tree, framework);
};
module.exports.FRAMEWORKS = FRAMEWORKS;
