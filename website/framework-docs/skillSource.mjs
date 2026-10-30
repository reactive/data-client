/**
 * Renders a SKILL.md source shared by several skills for one framework
 * (references.json `skillMd`, see skillReferences.mjs).
 */
import { FRAMEWORKS } from './docsInstances.js';
import { FM, rewriteFrontMatter } from './index.js';

/** Splits markdown so fenced code is at odd indexes */
export const FENCED = /(^```[\s\S]*?^```)/m;

/**
 * `content` rendered for `framework`, written with the docs' markers
 * (website/framework-docs/README.md) but applied to the text as written, so the
 * output keeps the source's exact markdown: `vue_<key>` front matter overrides
 * `<key>`; lines between `:::react` / `:::vue` and `:::` are kept for that
 * framework only (the marker lines are dropped, so blocks can sit inside
 * lists); `:react[...]` / `:vue[...]` pick inline text outside code fences.
 * remarkFramework.js would parse the same markers, but its remark-stringify
 * output reformats the markdown, so marker changes go in both.
 * `where` names the source in errors.
 */
export function renderSkillMd(content, framework, where) {
  const other = FRAMEWORKS.filter(f => f !== framework).join('|');
  const [frontMatter] =
    rewriteFrontMatter(content, framework)
      // other frameworks' overrides
      .replace(FM, fm => fm.replace(new RegExp(`^(${other})_.*\\n`, 'gm'), ''))
      .match(FM) ?? [];
  if (!frontMatter) throw new Error(`${where}: needs front matter`);
  const lines = [];
  let block, fence;
  for (const line of content.replace(FM, '').split('\n')) {
    if (line.startsWith('```')) fence = !fence;
    else if (!fence && line.startsWith(':::')) {
      const [, name] = line.match(/^:::(\w*)\s*$/) ?? [];
      if (name === undefined || (name && !FRAMEWORKS.includes(name)))
        throw new Error(`${where}: "${line}" isn't :::react, :::vue or :::`);
      if (Boolean(name) === Boolean(block))
        throw new Error(
          `${where}: "${line}" ${block ? `inside :::${block}` : 'closes no block'}`,
        );
      block = name;
      continue;
    }
    if (!block || block === framework) lines.push(line);
  }
  if (block) throw new Error(`${where}: unclosed :::${block}`);
  const body = lines
    .join('\n')
    .split(FENCED)
    .map((part, i) => (i % 2 ? part : inlineFrameworks(part, framework, where)))
    .join('');
  return frontMatter + body;
}

/** `:react[...]` / `:vue[...]` in prose: this framework's text, without the marker */
function inlineFrameworks(text, framework, where) {
  const marker = new RegExp(`:(${FRAMEWORKS.join('|')})\\[`, 'g');
  let out = '';
  let from = 0;
  for (let match; (match = marker.exec(text));) {
    let depth = 1;
    let end = marker.lastIndex;
    for (; end < text.length && depth; end++)
      depth += { '[': 1, ']': -1 }[text[end]] ?? 0;
    if (depth) throw new Error(`${where}: unclosed :${match[1]}[`);
    out += text.slice(from, match.index);
    if (match[1] === framework) out += text.slice(marker.lastIndex, end - 1);
    from = marker.lastIndex = end;
  }
  return out + text.slice(from);
}
