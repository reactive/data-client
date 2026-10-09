/**
 * Markdown structure for translation: what a translator may change (prose)
 * and what must survive it unchanged (code, imports, JSX, directives, links).
 */
import remarkComment from '@slorber/remark-comment';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

const require = createRequire(import.meta.url);
const preprocessContent =
  require('@docusaurus/mdx-loader/lib/preprocessor').default;
const { createSlugger, parseMarkdownHeadingId } = require('@docusaurus/utils');
const yaml = require('js-yaml');

const { FM } = require('../framework-docs/index.js');

const FENCE = /^(\s*)(`{3,}|~{3,})(.*)$/;
const PLACEHOLDER = /^\s*%%CODE_([0-9a-f]{8})%%\s*$/;
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

/** Line ranges [start, end] of fenced code blocks */
function fences(lines) {
  const blocks = [];
  let open;
  lines.forEach((line, i) => {
    const match = FENCE.exec(line);
    if (!open) {
      // ``` with a backtick in its info string is inline code, not a fence
      if (match && !(match[2][0] === '`' && match[3].includes('`')))
        open = { start: i, char: match[2][0], length: match[2].length };
    } else if (
      match &&
      match[2][0] === open.char &&
      match[2].length >= open.length &&
      !match[3].trim()
    ) {
      blocks.push([open.start, i]);
      open = undefined;
    }
  });
  if (open) blocks.push([open.start, lines.length - 1]);
  return blocks;
}

/** Lines outside fenced code, with their index */
function proseLines(content) {
  const lines = content.split('\n');
  const inCode = new Set();
  for (const [start, end] of fences(lines))
    for (let i = start; i <= end; i++) inCode.add(i);
  return lines
    .map((line, i) => ({ line, i }))
    .filter(({ i }) => !inCode.has(i));
}

const hash = text =>
  crypto.createHash('sha256').update(text).digest('hex').slice(0, 8);

/**
 * Replaces each fenced code block with a `%%CODE_<hash>%%` line, so the
 * translator never sees (or alters) code. Equal blocks share a placeholder, so
 * placeholders stay stable across source revisions.
 */
export function protectCode(content) {
  const lines = content.split('\n');
  const blocks = new Map();
  const out = [];
  let next = 0;
  for (const [start, end] of fences(lines)) {
    out.push(...lines.slice(next, start));
    const block = lines.slice(start, end + 1).join('\n');
    const id = hash(block);
    blocks.set(id, block);
    out.push(`${FENCE.exec(lines[start])[1]}%%CODE_${id}%%`);
    next = end + 1;
  }
  out.push(...lines.slice(next));
  return { text: out.join('\n'), blocks };
}

/** Puts back the code `protectCode` took out, as in `source` (protected) */
export function restoreCode(translated, source, blocks) {
  const expected = placeholders(source);
  const actual = placeholders(translated);
  if (expected.join() !== actual.join())
    throw new TranslationError([
      `code placeholders differ: expected ${expected.length} in source order, got ${actual.length}${actual.length === expected.length ? ' (reordered)' : ''}`,
    ]);
  return translated
    .split('\n')
    .map(line => {
      const match = PLACEHOLDER.exec(line);
      return match ? blocks.get(match[1]) : line;
    })
    .join('\n');
}

const placeholders = text =>
  text
    .split('\n')
    .map(line => PLACEHOLDER.exec(line)?.[1])
    .filter(Boolean);

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

const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkMdx)
  .use(remarkComment)
  .use(remarkGfm)
  .use(remarkDirective);

/** Parses like the site does; throws on content MDX can't compile */
function parse(content, filePath) {
  const input = preprocessContent({
    fileContent: content,
    filePath,
    markdownConfig: { mdx1Compat: { headingIds: true, admonitions: true } },
    admonitions: true,
  });
  try {
    return processor.parse(input);
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

/** Line of an import/export naming its module (`} from` ends multi-line ones) */
const IMPORT =
  /^((?:import|export)\s(?:.*?\sfrom\s+)?|\}\s*from\s+)(['"])(\.\.?\/[^'"]+)\2/;

/**
 * Relative specifiers of a file's `import ... from './x'` lines (outside code),
 * with the line index of each
 */
export function relativeImports(content) {
  return proseLines(content)
    .map(({ line, i }) => {
      const match = IMPORT.exec(line);
      return match && { i, specifier: match[3] };
    })
    .filter(Boolean);
}

/**
 * Points a translation's relative imports where `resolve` says the i-th
 * import of its source lives now
 * @param {(specifier: string) => string} resolve source specifier -> new one
 */
export function rewriteImports(translated, source, resolve) {
  const want = relativeImports(source);
  const have = relativeImports(translated);
  if (want.length !== have.length)
    throw new TranslationError([
      `expected ${want.length} relative imports, got ${have.length}`,
    ]);
  const lines = translated.split('\n');
  have.forEach(({ i, specifier }, n) => {
    const next = resolve(want[n].specifier);
    if (specifier !== next)
      lines[i] = lines[i].replace(
        IMPORT,
        (_, start, quote) => `${start}${quote}${next}${quote}`,
      );
  });
  return lines.join('\n');
}

/** Specifier as JS reads it (MDX formatters write `\_` in import paths) */
export const unescape = specifier => specifier.replace(/\\(.)/g, '$1');

export class TranslationError extends Error {
  constructor(problems) {
    super(problems.join('\n'));
    this.problems = problems;
  }
}
