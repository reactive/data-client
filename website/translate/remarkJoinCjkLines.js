/* global module */
/**
 * Remark plugin that drops line breaks between Chinese or Japanese characters
 * in prose. Markdown renders a line break inside a paragraph as a space, which
 * reads as a stray gap in languages written without spaces; a break next to
 * Latin text keeps its space, as those languages space Latin words.
 */
const CJK =
  '\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\u3000-\\u303f\\uff00-\\uffef';
const IS_CJK = new RegExp(`[${CJK}]`, 'u');
const BREAK = new RegExp(`([${CJK}])[ \\t]*\\n[ \\t]*(?=[${CJK}])`, 'gu');

// text at the edge of a node, looking through inline wrappers like links
const edge = (node, last) => {
  if (node.type === 'text') return node.value;
  const children = node.children ?? [];
  const child = last ? children.at(-1) : children[0];
  return child ? edge(child, last) : '';
};

const join = node => {
  const children = node.children ?? [];
  children.forEach((child, i) => {
    if (child.type !== 'text') return join(child);
    child.value = child.value.replace(BREAK, '$1');
    // a break between this text and the inline node beside it
    const before = children[i - 1] && edge(children[i - 1], true).at(-1);
    if (
      before &&
      IS_CJK.test(before) &&
      IS_CJK.test(child.value.trimStart()[0] ?? '')
    )
      child.value = child.value.replace(/^[ \t]*\n[ \t]*/, '');
    const after = children[i + 1] && edge(children[i + 1], false)[0];
    if (
      after &&
      IS_CJK.test(after) &&
      IS_CJK.test(child.value.trimEnd().at(-1) ?? '')
    )
      child.value = child.value.replace(/[ \t]*\n[ \t]*$/, '');
  });
};

module.exports = function remarkJoinCjkLines() {
  return join;
};
