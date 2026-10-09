/**
 * Markdown structure for translation: what a translator may change (prose)
 * and what must survive it unchanged (code, imports, JSX, directives, links).
 */
import { createRequire } from 'node:module';
import { visit } from 'unist-util-visit';

import { parseMarkdown } from '../framework-docs/parseMarkdown.mjs';

const require = createRequire(import.meta.url);
const { createSlugger, parseMarkdownHeadingId } = require('@docusaurus/utils');
const yaml = require('js-yaml');

const { proseLines } = require('./localeDocs.js');
const { FM } = require('../framework-docs/index.js');

const HEADING = /^(#{1,6})\s+(.*)$/;
const DIRECTIVE_OPEN = /^\s*:{3,}([a-z][\w-]*)/;
const DIRECTIVE_CLOSE = /^\s*:{3,}\s*$/;
/** Front matter values a translation may change */
const TRANSLATABLE_KEY =
  /^(?:(?:react|vue)_)?(?:title|sidebar_label|description)$/;
/** JSX attributes holding prose */
const TRANSLATABLE_ATTRIBUTE = new Set([
  'alt',
  'label',
  'title',
  'description',
]);

/** Headings outside code: level, text (without `{#id}`), explicit id, framework */
function headings(content) {
  const stack = [];
  const result = [];
  for (const { line } of proseLines(content)) {
    const open = DIRECTIVE_OPEN.exec(line);
    if (open) stack.push(open[1]);
    else if (DIRECTIVE_CLOSE.test(line)) stack.pop();
    const match = HEADING.exec(line);
    if (!match) continue;
    const { text, id } = parseMarkdownHeadingId(match[2]);
    result.push({
      level: match[1].length,
      text,
      id,
      framework: stack.findLast(name => name === 'react' || name === 'vue'),
    });
  }
  return result;
}

/**
 * Anchor of each h2+ heading in `source`, as Docusaurus generates it: explicit
 * `{#id}`s reserved first, then slugs from the heading text. React and Vue
 * pages each render only their framework's headings, so each gets a slugger.
 */
export function headingIds(source) {
  const list = headings(source).filter(h => h.level > 1);
  const sluggers = { react: createSlugger(), vue: createSlugger() };
  for (const { id } of list) {
    if (id) for (const slugger of Object.values(sluggers)) slugger.slug(id);
  }
  return list.map(({ text, id, framework }) => {
    if (id) return id;
    // React and Vue would slug it differently; one anchor can't match both
    if (/:(?:react|vue)\[/.test(text))
      throw new TranslationError([
        `English heading "${text}" needs an explicit {#id} (it differs by framework)`,
      ]);
    // like Docusaurus' write-heading-ids: link text, not link targets
    const plain = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
    if (framework) return sluggers[framework].slug(plain);
    sluggers.vue.slug(plain);
    return sluggers.react.slug(plain);
  });
}

/**
 * Gives every h2+ heading of a translation the anchor of its English heading,
 * so `#links` (in any language) keep working
 */
export function pinHeadingIds(translated, source) {
  const ids = headingIds(source);
  const lines = translated.split('\n');
  let n = 0;
  for (const { line, i } of proseLines(translated)) {
    const match = HEADING.exec(line);
    if (!match || match[1].length === 1) continue;
    const { text } = parseMarkdownHeadingId(match[2]);
    lines[i] = `${match[1]} ${text.trim()} {#${ids[n++]}}`;
  }
  if (n !== ids.length)
    throw new TranslationError([
      `expected ${ids.length} h2+ headings, got ${n}`,
    ]);
  return lines.join('\n');
}

/** Parses like the site does; throws on content MDX can't compile */
function parse(content, filePath) {
  try {
    return parseMarkdown(content, filePath).tree;
  } catch (error) {
    throw new TranslationError([
      `invalid MDX at ${error.line}:${error.column}: ${error.message}`,
    ]);
  }
}

const attributes = node =>
  node.attributes
    .map(attr =>
      attr.type === 'mdxJsxAttribute' ?
        `${attr.name}=${
          (
            TRANSLATABLE_ATTRIBUTE.has(attr.name) &&
            typeof attr.value === 'string'
          ) ?
            '<text>'
          : JSON.stringify(attr.value?.value ?? attr.value)
        }`
      : `{${attr.value}}`,
    )
    .join(' ');

/** Everything a translation must keep, by kind; values compared as multisets */
function skeleton(content, filePath) {
  const parts = {
    blocks: [],
    code: [],
    inlineCode: [],
    esm: [],
    jsx: [],
    expressions: [],
    directives: [],
    links: [],
  };
  visit(parse(content, filePath), node => {
    switch (node.type) {
      case 'heading':
        parts.blocks.push(`h${node.depth}`);
        break;
      // dropped or merged paragraphs and list items change these
      case 'paragraph':
      case 'listItem':
      case 'tableCell':
      case 'blockquote':
        parts.blocks.push(node.type);
        break;
      case 'code':
        parts.code.push(`${node.lang} ${node.meta}\n${node.value}`);
        break;
      case 'inlineCode':
        parts.inlineCode.push(node.value);
        break;
      case 'mdxjsEsm':
        parts.esm.push(node.value);
        break;
      case 'mdxJsxFlowElement':
      case 'mdxJsxTextElement':
        parts.jsx.push(`<${node.name ?? ''} ${attributes(node)}>`);
        break;
      case 'mdxFlowExpression':
      case 'mdxTextExpression':
        // `{/* comments */}` are prose
        if (!/^\s*\/\*[\s\S]*\*\/\s*$/.test(node.value))
          parts.expressions.push(node.value);
        break;
      case 'containerDirective':
      case 'leafDirective':
      case 'textDirective':
        parts.directives.push(`${node.type}:${node.name}`);
        break;
      case 'link':
      case 'image':
      case 'definition':
        parts.links.push(node.url);
        break;
    }
  });
  return parts;
}

function frontMatterProblems(source, translated) {
  const parseFM = content => yaml.load(content.match(FM)?.[1] ?? '') ?? {};
  let src, out;
  try {
    src = parseFM(source);
    out = parseFM(translated);
  } catch (error) {
    return [`invalid front matter: ${error.message}`];
  }
  const problems = [];
  const keys = new Set([...Object.keys(src), ...Object.keys(out)]);
  for (const key of keys) {
    if (!(key in src) || !(key in out))
      problems.push(`front matter key \`${key}\` added or removed`);
    else if (
      !TRANSLATABLE_KEY.test(key) &&
      JSON.stringify(src[key]) !== JSON.stringify(out[key])
    )
      problems.push(
        `front matter \`${key}\` must stay ${JSON.stringify(src[key])}`,
      );
  }
  return problems;
}

/** Why `content` doesn't compile as MDX, if it doesn't */
export function mdxProblems(content, filePath) {
  try {
    parse(content, filePath);
    return [];
  } catch (error) {
    if (error instanceof TranslationError) return error.problems;
    throw error;
  }
}

/** What `translated` changed that it must not have, versus its `source` */
export function structureProblems(source, translated, filePath) {
  const problems = frontMatterProblems(source, translated);
  const src = skeleton(source, filePath);
  let out;
  try {
    out = skeleton(translated, filePath);
  } catch (error) {
    if (error instanceof TranslationError)
      return [...problems, ...error.problems];
    throw error;
  }
  // blocks and directives are ordered; the rest compare as multisets
  for (const kind of ['blocks', 'directives']) {
    const i = src[kind].findIndex((value, i) => value !== out[kind][i]);
    if (i !== -1 || src[kind].length !== out[kind].length) {
      const at = i === -1 ? src[kind].length : i;
      problems.push(
        `${kind} differ from #${at + 1}: expected ${src[kind].slice(at, at + 3).join(', ') || 'nothing'}, got ${out[kind].slice(at, at + 3).join(', ') || 'nothing'}`,
      );
    }
  }
  for (const kind of [
    'code',
    'inlineCode',
    'esm',
    'jsx',
    'expressions',
    'links',
  ]) {
    const missing = difference(src[kind], out[kind]);
    const added = difference(out[kind], src[kind]);
    if (missing.length || added.length)
      problems.push(
        `${kind} changed:${missing.map(v => `\n  - ${clip(v)}`).join('')}${added.map(v => `\n  + ${clip(v)}`).join('')}`,
      );
  }
  return problems;
}

/** Items of `a` not matched one-for-one in `b` */
function difference(a, b) {
  const rest = [...b];
  return a.filter(value => {
    const i = rest.indexOf(value);
    if (i === -1) return true;
    rest.splice(i, 1);
    return false;
  });
}

const clip = value =>
  value.length > 120 ?
    `${value.slice(0, 117).replace(/\n/g, '⏎')}...`
  : value.replace(/\n/g, '⏎');

export class TranslationError extends Error {
  constructor(problems) {
    super(problems.join('\n'));
    this.problems = problems;
  }
}
