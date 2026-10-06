/**
 * Renders a release blog post's social card to static/img/social/X.Y-card.png
 * from the post's frontmatter and summary bullets.
 *
 * Usage (from repo root):
 *   yarn workspace rdc-website social-card blog/2026-10-03-v0.19-batch-set.md
 *   yarn workspace rdc-website social-card 0.19 --force   # overwrite existing
 *   yarn workspace rdc-website social-card coding-agents  # non-release post, by slug
 *
 * Release posts (titled `vX.Y: ...`) write X.Y-card.png with a RELEASE pill;
 * other posts write <slug>-card.png with their first tag's label as the pill.
 *
 * Cards before v0.19 are hand-made; don't --force over them.
 *
 * Requires a Chromium for Playwright (`npx playwright install chromium`), or
 * set CHROMIUM_PATH to an existing Chromium binary.
 */
import {
  createSlugger,
  DEFAULT_PARSE_FRONT_MATTER,
  parseMarkdownHeadingId,
} from '@docusaurus/utils';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const WEBSITE_ROOT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const BLOG_DIR = path.join(WEBSITE_ROOT, 'blog');
const OUT_DIR = path.join(WEBSITE_ROOT, 'static/img/social');
// Same size as the hand-made v0.14–v0.18 cards (≈1.91:1 Open Graph ratio)
const WIDTH = 1731;
const HEIGHT = 909;
const MAX_ROWS = 4;

function findPost(arg) {
  if (!arg)
    throw new Error('Pass a blog post path, a version like 0.19, or a slug');
  if (fs.existsSync(arg)) return arg;
  const inBlog = path.join(WEBSITE_ROOT, arg);
  if (fs.existsSync(inBlog)) return inBlog;
  const version = arg.replace(/^v/, '');
  const posts = fs.readdirSync(BLOG_DIR).filter(f => /\.mdx?$/.test(f));
  const match =
    posts.find(f => f.includes(`-v${version}-`)) ??
    posts.find(f => postSlug(f) === arg);
  if (!match) throw new Error(`No blog post found for ${arg}`);
  return path.join(BLOG_DIR, match);
}

// File name without its date prefix and extension, as Docusaurus slugs it
const postSlug = file =>
  path.basename(file).replace(/^\d{4}-\d{2}-\d{2}-|\.mdx?$/g, '');

// A tag's label from tags.yml, like 'AI Agents' for `agents`
function tagLabel(tag) {
  const tags = fs.readFileSync(path.join(BLOG_DIR, 'tags.yml'), 'utf8');
  return tags.match(
    new RegExp(`^${tag}:\\s*\\n\\s*label: '([^']+)'`, 'm'),
  )?.[1];
}

async function parsePost(postFile) {
  const { frontMatter, content: body } = await DEFAULT_PARSE_FRONT_MATTER({
    filePath: postFile,
    fileContent: fs.readFileSync(postFile, 'utf8').replace(/\r\n/g, '\n'),
  });
  const { title, description = '', image, tags = [] } = frontMatter;
  const [, version, headline = title] =
    title.match(/^v(\d+\.\d+):?\s*(.*)$/) ?? [];
  const name = version ?? postSlug(postFile);
  const pill =
    version ? 'RELEASE' : (tagLabel(tags[0]) ?? tags[0] ?? '').toUpperCase();
  const [summary, details = ''] = body.split(
    /\{\/\*\s*truncate\s*\*\/\}|<!--\s*truncate\s*-->/,
  );
  const bullets = summaryBullets(summary);
  return {
    version,
    name,
    pill,
    headline,
    description,
    image,
    rows: bullets
      .slice(0, MAX_ROWS)
      .map(({ tag, text }) => ({ tag, label: bulletLabel(text) })),
    feature: featureVisual(headline, bullets, details),
  };
}

// Bullets under **Bold section:** headings in the summary, new features first
function summaryBullets(summary) {
  const rows = [];
  let tag;
  for (const line of summary.split('\n')) {
    const heading = line.match(/^\*\*(.+?):?\*\*:?\s*$/);
    if (heading) {
      tag =
        /breaking/i.test(heading[1]) ? undefined
        : /new/i.test(heading[1]) ? 'new'
        : 'improved';
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.*)/);
    if (tag && bullet) rows.push({ tag, text: bullet[1] });
  }
  return rows.sort((a, b) => (b.tag === 'new') - (a.tag === 'new'));
}

const MAX_CODE_LINES = 8;
const MAX_CHART_ROWS = 4;
// Put {/* card */} right before a chart, diagram, image or code block in a
// feature section to pick what the card shows for that feature
const CARD_MARKER = /\{\/\*\s*card\s*\*\/\}/g;
const PERF = /fast|perf|speed|parallel/i;

// One visual per headline feature (the title's comma-separated parts, else the
// new bullets' sections): the marked one, else a chart for performance
// features, else a diagram, image, code or chart, in that order
function featureVisual(headline, bullets, details) {
  const sections = headlineSections(headline, bullets, details);
  if (!sections.length) return;
  const speedupIn = text => text?.match(/(\d+(?:\.\d+)?)x faster/i)?.[1];
  const visuals = sections
    .map(({ title, id, section }) => {
      const found = findVisuals(section);
      const order =
        PERF.test(title) ?
          ['chart', 'diagram', 'image', 'code']
        : ['diagram', 'image', 'code', 'chart'];
      const pick =
        found.find(v => v.marked) ??
        order.map(k => found.find(v => v.kind === k)).find(Boolean);
      // the section's own claim, else the claim in the bullet linking to it
      const speedup =
        speedupIn(section) ??
        speedupIn(bullets.find(b => id && b.text.includes(`#${id})`))?.text);
      return pick && { ...pick, title, speedup };
    })
    .filter(Boolean);
  if (!visuals.length) return;
  const [first] = visuals;
  // A lone feature with Before/After code shows both sides, with a big badge
  const pair = visuals.length === 1 && first.before;
  const panels =
    pair ?
      [
        { kind: 'code', title: 'Before', code: first.before, diff: 'before' },
        { ...first, title: 'After', diff: 'after', speedup: undefined },
      ]
    : visuals;
  return { panels, speedup: pair && first.speedup };
}

// Sections for the title's comma-separated parts (by shared heading words),
// then the sections the new bullets link to; else the first section with a visual
function headlineSections(headline, bullets, details) {
  // anchors as Docusaurus makes them: one slugger over every heading in order,
  // so explicit {#id}s and repeated titles get the same -1 suffixes
  const slugger = createSlugger();
  const headings = [...details.matchAll(/^(#{2,6}) (.+)$/gm)]
    .map(m => {
      const { text, id } = parseMarkdownHeadingId(m[2]);
      const title = text.replace(/`/g, '');
      return {
        level: m[1].length,
        title,
        id: id ? slugger.slug(id, { maintainCase: true }) : slugger.slug(title),
        index: m.index,
      };
    })
    .filter(
      h =>
        h.level === 2 && !/migration|other improvements|upgrade/i.test(h.title),
    );
  const words = s =>
    new Set(
      s
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(w => w.length > 2)
        .map(w => w.replace(/s$/, '')),
    );
  const byTitle = headline.split(/,\s*/).map(part => {
    const partWords = [...words(part)];
    let best,
      bestScore = 0;
    for (const h of headings) {
      const hWords = words(h.title);
      const score = partWords.filter(w => hWords.has(w)).length;
      if (score > bestScore) [best, bestScore] = [h, score];
    }
    return best && { ...best, title: part };
  });
  const byBullet = bullets
    .filter(b => b.tag === 'new')
    .map(b => {
      const anchor = b.text.match(/\]\([^)#]*#([\w-]+)\)/)?.[1];
      const h = headings.find(h => h.id === anchor);
      return h && { ...h, title: bulletLabel(b.text) };
    });
  const sectionAt = index => details.slice(index).split(/\n## /)[0];
  const chosen = [...byTitle, ...byBullet].filter(
    (h, i, all) => h && all.findIndex(o => o?.index === h.index) === i,
  );
  const picked =
    chosen.length ? chosen : (
      headings.filter(h => findVisuals(sectionAt(h.index)).length).slice(0, 1)
    );
  return picked
    .slice(0, 3)
    .map(({ title, id, index }) => ({ title, id, section: sectionAt(index) }));
}

// Every chart, diagram, image and code block in a section, in source order
function findVisuals(section) {
  const patterns = [
    [/<PerfChart([\s\S]*?)\/>/g, perfChart],
    [/```mermaid\n([\s\S]*?)\n```/g, mermaidVisual],
    [/(?:!\[[^\]]*\]\(|<img[^>]*src=")(\/img\/[^)\s"]+)/g, imageVisual],
    [/```(?!mermaid)\w*([^\n]*)\n([\s\S]*?)\n```/g, codeVisual],
  ];
  const visuals = patterns
    .flatMap(([re, parse]) =>
      [...section.matchAll(re)].map(m => {
        const visual = parse(...m.slice(1));
        return visual && { ...visual, index: m.index };
      }),
    )
    .filter(Boolean);
  // each {/* card */} marks the first visual after it
  visuals.sort((a, b) => a.index - b.index);
  for (const { index } of section.matchAll(CARD_MARKER)) {
    const next = visuals.find(v => v.index > index);
    if (next) next.marked = true;
  }
  const before = visuals.find(v => v.kind === 'code' && v.title === 'Before');
  return visuals
    .filter(v => v !== before)
    .map(v =>
      before && v.kind === 'code' && v.title === 'After' ?
        { ...v, before: before.code }
      : v,
    );
}

function perfChart(props) {
  const prop = name => props.match(new RegExp(`${name}="([^"]*)"`))?.[1];
  const rows = [
    ...props.matchAll(
      /label:\s*'([^']*)',\s*baseline:\s*([\d.]+),\s*value:\s*([\d.]+)/g,
    ),
  ].map(([, label, baseline, value]) => ({
    label,
    baseline: +baseline,
    value: +value,
  }));
  if (!rows.length) return;
  return {
    kind: 'chart',
    chartTitle: prop('title'),
    baselineLabel: prop('baselineLabel'),
    valueLabel: prop('valueLabel'),
    higherIsBetter: /higherIsBetter(?!=\{false\})/.test(props),
    rows,
  };
}

// xychart-beta "% of baseline" bars become a chart; other mermaid is a diagram
function mermaidVisual(source) {
  if (!/^\s*xychart/.test(source)) return { kind: 'diagram', source };
  const labels = source.match(/x-axis\s*\[([^\]]*)\]/)?.[1];
  const bars = source.match(/bar\s*\[([^\]]*)\]/)?.[1];
  if (!labels || !bars) return;
  const values = bars.split(',').map(Number);
  return {
    kind: 'chart',
    chartTitle: source.match(/title\s+"([^"]*)"/)?.[1],
    higherIsBetter: true,
    rows: labels.split(',').map((l, i) => ({
      label: l.trim().replace(/^"|"$/g, ''),
      baseline: 100,
      value: values[i],
    })),
  };
}

function imageVisual(src) {
  const file = path.join(WEBSITE_ROOT, 'static', src);
  return fs.existsSync(file) ? { kind: 'image', file } : undefined;
}

function codeVisual(meta, code) {
  return {
    kind: 'code',
    title: meta.match(/title="([^"]+)"/)?.[1],
    code: code.replace(/^\s*\/\/ highlight-next-line\n/gm, ''),
  };
}

// Up to MAX_CODE_LINES, ending at a blank line when cut so statements stay whole
function firstLines(code, max = MAX_CODE_LINES) {
  // imports say little on a card, so skip them when other code follows
  const body = code.replace(/^(import [^;]*;\s*\n)+\s*/, '');
  const lines = (body.trim() ? body : code).split('\n');
  if (lines.length <= max) return lines.join('\n');
  const head = lines.slice(0, max);
  const blank = head.lastIndexOf('');
  return head.slice(0, blank > 0 ? blank : max).join('\n');
}

const KEYWORDS =
  'const|let|var|function|return|for|of|in|if|else|new|class|extends|import|export|from|await|async|static|this|typeof';
const TOKEN_KINDS = ['comment', 'string', 'keyword', 'number', 'type', 'call'];
const TOKEN = new RegExp(
  [
    '(\\/\\/.*)',
    '(`[^`]*`|\'[^\']*\'|"[^"]*")',
    `\\b(${KEYWORDS})\\b`,
    '\\b(\\d+(?:\\.\\d+)?)\\b',
    '\\b([A-Z]\\w*)',
    '\\b(\\w+)(?=\\()',
  ].join('|'),
  'g',
);

// Minimal TS highlighting: comments, strings, keywords, numbers, Types, calls
function highlight(code) {
  let html = '';
  let last = 0;
  for (const m of code.matchAll(TOKEN)) {
    const kind = TOKEN_KINDS[m.slice(1).findIndex(g => g !== undefined)];
    html += `${escape(code.slice(last, m.index))}<span class="t-${kind}">${escape(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return html + escape(code.slice(last));
}

const fmt = n => (n >= 10 ? Math.round(n) : +n.toFixed(1));

// Before vs after bars per row, with each row's multiplier
function chartBody({
  rows: allRows,
  baselineLabel = 'Before',
  valueLabel = 'After',
  higherIsBetter,
}) {
  const rows = allRows.slice(0, MAX_CHART_ROWS);
  const max = Math.max(...rows.flatMap(r => [r.baseline, r.value]));
  const bar = (n, cls) =>
    `<div class="bar ${cls}" style="width: ${Math.max((n / max) * 100, 1.5)}%"></div>`;
  return `<div class="legend"><span class="key base"></span>${escape(baselineLabel)}<span class="key value"></span>${escape(valueLabel)}</div>${rows
    .map(({ label, baseline, value }) => {
      const speedup = higherIsBetter ? value / baseline : baseline / value;
      return `<div class="chart-row"><div class="chart-label">${escape(label)}<b>${fmt(speedup)}×</b></div>${bar(baseline, 'base')}${bar(value, 'value')}</div>`;
    })
    .join('')}`;
}

function panelBody(panel, maxLines) {
  switch (panel.kind) {
    case 'chart':
      return `<div class="chart">${chartBody(panel)}</div>`;
    case 'diagram':
      return `<div class="diagram"><div class="diagram-src">${escape(panel.source)}</div></div>`;
    case 'image': {
      const ext = path.extname(panel.file);
      const type = { '.svg': 'svg+xml', '.jpg': 'jpeg' }[ext] ?? ext.slice(1);
      return `<div class="image"><img src="data:image/${type};base64,${fs.readFileSync(panel.file, 'base64')}"></div>`;
    }
    default:
      return `<pre>${firstLines(panel.code, maxLines)
        .split('\n')
        .map(line => `<div class="line">${highlight(line) || ' '}</div>`)
        .join('')}</pre>`;
  }
}

function panelsHtml({ panels, speedup }) {
  const n = panels.length;
  const maxLines = n > 2 ? 5 : MAX_CODE_LINES;
  const html = panels
    .map((panel, i) => {
      const title = (n === 1 && panel.chartTitle) || panel.title;
      // the After side, else the first window, gets the accent title
      const primary = panel.diff ? panel.diff === 'after' : i === 0;
      const chip =
        panel.speedup ?
          `<em class="speed">${escape(panel.speedup)}× faster</em>`
        : '';
      return `<div class="editor ${panel.diff ?? ''} ${primary ? 'primary' : ''} w${i + 1}-of-${n}"><div class="chrome"><i></i><i></i><i></i><span>${escape(title)}</span>${chip}</div>${panelBody(panel, maxLines)}</div>`;
    })
    .join('');
  return speedup ?
      `${html}<div class="stat"><div class="big">${escape(speedup)}<small>×</small></div><div class="unit">faster</div></div>`
    : html;
}

// A leading link's text, else the bullet's first clause
function bulletLabel(text) {
  const link = text.match(/^\[([^\]]+)\]\(/);
  if (link) return link[1].replace(/`/g, '');
  const plain = text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`/g, '')
    .split(/[;,]| \(| - /)[0]
    .trim();
  if (plain.length <= 40) return plain;
  return plain.slice(0, 40).replace(/\s+\S*$/, '') + '…';
}

const escape = s =>
  s.replace(
    /[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  );

// Each comma-separated feature gets a line, alternating white/blue. A single
// multi-word feature splits its last word onto a blue line instead.
function headlineLines(headline) {
  const parts = headline.split(/,\s*/);
  if (parts.length > 1) return parts;
  const words = headline.split(' ');
  return words.length > 1 ?
      [words.slice(0, -1).join(' '), words.at(-1)]
    : words;
}

// Deterministic per-post so re-running produces the same image
function prng(seed) {
  let s = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}

// Background motif and accent colors that fit the release's theme, picked from
// its title then description: speed streaks for performance, a node graph for
// schemas and data relationships, a grid for types, else flowing streams
const THEMES = [
  {
    match: PERF,
    draw: speedMotif,
    colors: ['#3e96db', '#4fc3f7', '#22d3ee', '#f59e0b'],
  },
  {
    draw: networkMotif,
    match: /schema|normaliz|entit|relation|graph|collection|union|query/i,
    colors: ['#7c6cf0', '#a78bfa', '#3e96db', '#22d3ee'],
  },
  {
    draw: gridMotif,
    match: /type|typescript/i,
    colors: ['#2dd4bf', '#3e96db', '#5eead4', '#7c6cf0'],
  },
];
const FLOW = {
  draw: flowMotif,
  colors: ['#3e96db', '#4fc3f7', '#7c6cf0', '#22d3ee'],
};

function pickTheme(headline, description) {
  return (
    THEMES.find(t => t.match.test(headline)) ??
    THEMES.find(t => t.match.test(description)) ??
    FLOW
  );
}

const fixed = (v, d = 1) => v.toFixed(d);
const GLOW = `<defs><filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;

function background({ colors, draw }, random) {
  const pick = () => colors[Math.floor(random() * colors.length)];
  return `<svg class="bg" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">${GLOW}${draw(random, pick, colors)}</svg>`;
}

function speedMotif(random, pick) {
  let body = '';
  // motion streaks rushing left, each with a bright head
  for (let i = 0; i < 60; i++) {
    const y = HEIGHT * random();
    const x = WIDTH * (0.45 + random() * 0.5);
    const len = 80 + random() * 380;
    const c = pick();
    body += `<line x1="${fixed(x)}" y1="${fixed(y)}" x2="${fixed(x + len)}" y2="${fixed(y)}" stroke="${c}" stroke-width="${fixed(1 + random() * 1.5)}" opacity="${fixed(0.2 + random() * 0.5, 2)}" stroke-linecap="round"/><circle cx="${fixed(x)}" cy="${fixed(y)}" r="${fixed(1.5 + random() * 2)}" fill="${c}" filter="url(#glow)"/>`;
  }
  return body;
}

function networkMotif(random, pick) {
  let body = '';
  // nodes linked to their nearest neighbors
  const nodes = Array.from({ length: 34 }, () => [
    WIDTH * (0.5 + random() * 0.5),
    HEIGHT * random(),
  ]);
  for (const [i, [x, y]] of nodes.entries()) {
    const near = nodes
      .map(([x2, y2], j) => [Math.hypot(x2 - x, y2 - y), j])
      .filter(([, j]) => j > i)
      .sort((a, b) => a[0] - b[0])
      .slice(0, 2);
    for (const [, j] of near)
      body += `<line x1="${fixed(x)}" y1="${fixed(y)}" x2="${fixed(nodes[j][0])}" y2="${fixed(nodes[j][1])}" stroke="${pick()}" stroke-width="1.2" opacity="0.35"/>`;
  }
  for (const [x, y] of nodes)
    body += `<circle cx="${fixed(x)}" cy="${fixed(y)}" r="${fixed(2.5 + random() * 3.5)}" fill="${pick()}" filter="url(#glow)"/>`;
  return body;
}

function gridMotif(random, pick, colors) {
  let body = '';
  // a perspective floor grid with a few lit nodes
  const horizon = HEIGHT * 0.38;
  const vx = WIDTH * 0.78;
  for (let i = -14; i <= 14; i++)
    body += `<line x1="${vx}" y1="${horizon}" x2="${fixed(vx + i * 160)}" y2="${HEIGHT}" stroke="${colors[0]}" stroke-width="1" opacity="0.25"/>`;
  for (let i = 1; i <= 12; i++) {
    const y = horizon + (HEIGHT - horizon) * (i / 12) ** 2;
    body += `<line x1="0" y1="${fixed(y)}" x2="${WIDTH}" y2="${fixed(y)}" stroke="${colors[1]}" stroke-width="1" opacity="${fixed(0.1 + i * 0.02, 2)}"/>`;
  }
  for (let i = 0; i < 18; i++)
    body += `<circle cx="${fixed(WIDTH * (0.5 + random() * 0.5))}" cy="${fixed(horizon + (HEIGHT - horizon) * random())}" r="${fixed(2 + random() * 2)}" fill="${pick()}" filter="url(#glow)"/>`;
  return body;
}

function flowMotif(random, pick) {
  let body = '';
  // light streams fanning out to the right edge
  for (let i = 0; i < 46; i++) {
    const c = pick();
    const p0 = [WIDTH * 0.68, HEIGHT * (0.4 + random() * 0.2)];
    const p3 = [WIDTH, HEIGHT * (-0.05 + random() * 1.1)];
    const p1 = [WIDTH * 0.8, p0[1]];
    const p2 = [WIDTH * 0.86, p3[1]];
    const at = t =>
      [0, 1].map(
        k =>
          (1 - t) ** 3 * p0[k] +
          3 * (1 - t) ** 2 * t * p1[k] +
          3 * (1 - t) * t ** 2 * p2[k] +
          t ** 3 * p3[k],
      );
    body += `<path d="M${p0} C${p1} ${p2} ${p3}" stroke="${c}" stroke-width="${fixed(0.6 + random() * 1.2)}" fill="none" opacity="${fixed(0.15 + random() * 0.5, 2)}"/>`;
    for (let j = 0; j < 3; j++) {
      const [x, y] = at(0.45 + random() * 0.55);
      body += `<circle cx="${fixed(x)}" cy="${fixed(y)}" r="${fixed(1.5 + random() * 2.5)}" fill="${c}" filter="url(#glow)"/>`;
    }
  }
  return body;
}

// Inline the site's fonts so rendering is offline and reproducible
function fontFace(family, file) {
  const woff2 = fs.readFileSync(
    path.join(WEBSITE_ROOT, 'static/font', file),
    'base64',
  );
  return `@font-face { font-family: '${family}'; font-weight: 100 900; src: url(data:font/woff2;base64,${woff2}) format('woff2'); }`;
}

function cardHtml({
  version,
  name,
  pill,
  headline,
  description,
  rows,
  feature,
}) {
  const theme = pickTheme(headline, description);
  const logo = fs
    .readFileSync(path.join(WEBSITE_ROOT, 'static/img/client-logo.svg'), 'utf8')
    .replace(/<\?xml[^>]*>|<!--[\s\S]*?-->/g, '');
  const lines = headlineLines(headline)
    .map(
      (line, i) =>
        `<div class="${i % 2 ? 'accent' : ''}">${escape(line)}</div>`,
    )
    .join('');
  const panelRows = rows
    .map(
      ({ tag, label }) =>
        `<div class="row"><span class="chip ${tag}">${tag}</span><span class="label">${escape(label)}</span></div>`,
    )
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8">
<style>
  ${fontFace('Rubik', 'Rubik.woff2')}
  ${fontFace('Roboto Mono', 'Roboto-Mono.woff2')}
  * { box-sizing: border-box; margin: 0; }
  body {
    width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; position: relative;
    font-family: Rubik, sans-serif; color: #fff;
    background:
      radial-gradient(ellipse 60% 70% at 85% 55%, #0d2a55 0%, transparent 70%),
      radial-gradient(ellipse 50% 60% at 10% 10%, #0b1d3a 0%, transparent 70%),
      #050b17;
  }
  .bg { position: absolute; inset: 0; -webkit-mask-image: linear-gradient(90deg, transparent 70%, #000 90%); }
  .left { position: absolute; left: 88px; top: 80px; width: 760px; }
  .brand { display: flex; align-items: center; gap: 26px; }
  .brand svg { width: 150px; height: auto; }
  .brand .name { font-size: 64px; font-weight: 400; letter-spacing: 0.42em; line-height: 1; }
  .brand .sub { font-size: 22px; font-weight: 500; letter-spacing: 0.62em; margin-top: 18px; text-align: center; padding-left: 0.6em; }
  .version { display: flex; align-items: center; gap: 72px; margin-top: 68px; }
  .version .num {
    font-size: 150px; font-weight: 700; line-height: 0.9; letter-spacing: -0.02em;
    background: linear-gradient(180deg, #4aa3ff, #1f6fe5); -webkit-background-clip: text; color: transparent;
  }
  .pill {
    border: 2.5px solid #2f7cf0; border-radius: 999px; padding: 10px 28px;
    color: #4aa3ff; font-size: 30px; font-weight: 500; letter-spacing: 0.18em;
  }
  .headline { margin-top: 30px; height: 250px; font-size: 120px; font-weight: 600; line-height: 1.05; letter-spacing: -0.01em; }
  .headline .accent { color: #3b8cf5; }
  .rule { margin-top: 34px; width: 560px; height: 1px; background: linear-gradient(90deg, #2a3a55, transparent); }
  .tagline {
    margin-top: 26px; width: 680px; font-size: 28px; font-weight: 300; line-height: 1.35; color: #b4bfd0;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  }
  .panel {
    position: absolute; right: 95px; top: 50%; width: 750px; transform: translateY(-50%) perspective(1600px) rotateY(-9deg);
    padding: 36px 34px 30px; border-radius: 26px;
    background: linear-gradient(160deg, rgba(26,40,68,0.95), rgba(10,18,34,0.96));
    border: 1.5px solid rgba(120,160,230,0.28);
    box-shadow: 0 40px 90px rgba(0,0,0,0.6), 0 0 60px rgba(47,124,240,0.18), inset 0 1px 0 rgba(255,255,255,0.08);
  }
  .panel h2 { font-size: 34px; font-weight: 500; color: #4aa3ff; letter-spacing: 0.06em; margin-bottom: 22px; display: flex; gap: 16px; align-items: center; }
  .panel h2 svg { width: 34px; height: 34px; }
  .row {
    display: flex; align-items: center; gap: 22px; padding: 18px 20px; margin-top: 12px;
    border-radius: 12px; background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.06);
  }
  .chip {
    flex: none; width: 128px; text-align: center; padding: 7px 0; border-radius: 8px;
    font: 500 21px 'Roboto Mono', monospace; text-transform: uppercase; letter-spacing: 0.04em;
  }
  .chip.new { color: #5eead4; background: rgba(20,184,166,0.16); border: 1px solid rgba(94,234,212,0.35); }
  .chip.improved { color: #a5b4fc; background: rgba(99,102,241,0.18); border: 1px solid rgba(165,180,252,0.35); font-size: 18px; }
  .label { font-size: 26px; color: #e6edf7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .editor {
    position: absolute; right: 90px; width: 740px; border-radius: 18px; overflow: hidden;
    background: linear-gradient(160deg, rgba(22,33,58,0.97), rgba(9,15,30,0.98));
    border: 1.5px solid rgba(120,160,230,0.25);
    box-shadow: 0 40px 90px rgba(0,0,0,0.6);
    transform: perspective(1600px) rotateY(-9deg);
  }
  .editor.after { border-color: rgba(74,163,255,0.6); box-shadow: 0 40px 90px rgba(0,0,0,0.65), 0 0 70px rgba(47,124,240,0.35); }
  .editor.before { opacity: 0.55; filter: saturate(0.6); }
  .w1-of-1 { top: 50%; translate: 0 -50%; }
  .w1-of-2 { top: 90px; right: 150px; width: 620px; }
  .w2-of-2 { bottom: 150px; }
  .w1-of-3, .w2-of-3, .w3-of-3 { width: 640px; }
  .w1-of-3 { top: 30px; right: 70px; }
  .w2-of-3 { top: 310px; right: 160px; }
  .w3-of-3 { top: 590px; right: 70px; }
  .chrome { display: flex; align-items: center; gap: 9px; padding: 14px 20px; background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.06); }
  .chrome i { width: 13px; height: 13px; border-radius: 50%; background: #2c3a55; }
  .chrome span { margin-left: 14px; font: 500 20px 'Roboto Mono', monospace; letter-spacing: 0.08em; text-transform: uppercase; color: #8aa0c0; }
  .primary .chrome span { color: #5eead4; }
  .editor pre { padding: 20px 26px 24px 0; font: 400 26px/1.55 'Roboto Mono', monospace; color: #d6deeb; white-space: pre; overflow: hidden; }
  .line::before { content: ''; display: inline-block; width: 26px; text-align: center; }
  .before .line::before { content: '−'; width: 52px; color: #f87171; }
  .after .line::before { content: '+'; width: 52px; color: #4ade80; }
  .t-keyword { color: #c792ea; } .t-string { color: #c3e88d; } .t-number { color: #f78c6c; }
  .t-type { color: #ffcb6b; } .t-call { color: #82aaff; } .t-comment { color: #637777; font-style: italic; }
  .chart { padding: 22px 30px 28px; }
  .legend { display: flex; align-items: center; gap: 12px; font-size: 20px; color: #8aa0c0; margin-bottom: 8px; }
  .legend .value { margin-left: 18px; }
  .key { width: 18px; height: 10px; border-radius: 3px; }
  .chart-row { margin-top: 16px; }
  .chart-label { display: flex; justify-content: space-between; font-size: 24px; color: #e6edf7; margin-bottom: 8px; }
  .chart-label b { font-weight: 700; color: #5eead4; }
  .bar { height: 12px; border-radius: 6px; margin-top: 5px; }
  .base { background: #3a4a66; }
  .value { background: linear-gradient(90deg, #3b8cf5, #5eead4); box-shadow: 0 0 14px rgba(94,234,212,0.45); }
  .diagram, .image { padding: 22px; display: flex; justify-content: center; }
  .diagram-src { width: 100%; }
  .diagram svg { width: 100%; max-width: none !important; height: auto; max-height: 260px; }
  .image img { max-width: 100%; max-height: 260px; }
  .w1-of-1 .diagram svg, .w1-of-1 .image img { max-height: 560px; }
  .chrome .speed { margin-left: auto; font: 600 20px Rubik, sans-serif; font-style: normal; color: #5eead4; border: 1.5px solid rgba(94,234,212,0.45); border-radius: 999px; padding: 3px 14px; }
  .stat {
    position: absolute; right: 50px; bottom: 45px; padding: 18px 30px 20px; border-radius: 22px;
    background: linear-gradient(160deg, rgba(20,60,120,0.95), rgba(10,26,58,0.97));
    border: 1.5px solid rgba(94,234,212,0.45); box-shadow: 0 30px 70px rgba(0,0,0,0.6), 0 0 50px rgba(45,212,191,0.25);
  }
  .stat .big { font-size: 92px; font-weight: 700; line-height: 1; background: linear-gradient(180deg, #5eead4, #3b8cf5); -webkit-background-clip: text; color: transparent; }
  .stat .big small { font-size: 0.55em; }
  .stat .unit { font-size: 30px; font-weight: 500; letter-spacing: 0.12em; color: #cfe3ff; text-transform: uppercase; margin-top: 4px; }
</style></head><body>
${background(theme, prng(name))}
<div class="left">
  <div class="brand">${logo}<div><div class="name">REACTIVE</div><div class="sub">DATA CLIENT</div></div></div>
  <div class="version">${version ? `<span class="num">v${escape(version)}</span>` : ''}<span class="pill">${escape(pill)}</span></div>
  <div class="headline" id="headline">${lines}</div>
  <div class="rule"></div>
  <div class="tagline">${escape(description)}</div>
</div>
${
  feature ? panelsHtml(feature)
  : panelRows ?
    `<div class="panel"><h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/><path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></svg>WHAT'S NEW</h2>${panelRows}</div>`
  : ''
}
</body></html>`;
}

async function render(html, outFile, feature) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: WIDTH, height: HEIGHT },
    });
    await page.setContent(html);
    const fontsLoaded = await page.evaluate(async () =>
      (
        await Promise.all(
          ['600 40px Rubik', '500 20px "Roboto Mono"'].map(f =>
            document.fonts.load(f),
          ),
        )
      ).every(faces => faces.length),
    );
    if (!fontsLoaded) throw new Error('Rubik/Roboto Mono failed to load');
    if (feature?.panels.some(p => p.kind === 'diagram')) {
      // added after load, so mermaid doesn't render before this config
      await page.addScriptTag({
        path: require.resolve('mermaid/dist/mermaid.min.js'),
      });
      await page.evaluate(async () => {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          // svg text measures with the loaded fonts; html labels clip
          htmlLabels: false,
          flowchart: { htmlLabels: false },
          themeVariables: {
            fontFamily: 'Rubik',
            fontSize: '22px',
            primaryColor: '#16213a',
            primaryTextColor: '#e6edf7',
            primaryBorderColor: '#4aa3ff',
            lineColor: '#5eead4',
            secondaryColor: '#1d2b4a',
            tertiaryColor: '#0f1830',
          },
        });
        await window.mermaid.run({ querySelector: '.diagram-src' });
      });
    }
    // Shrink the headline and code until every line fits, with real font metrics
    await page.evaluate(() => {
      for (const box of document.querySelectorAll('#headline, pre')) {
        let size = parseFloat(getComputedStyle(box).fontSize);
        while (
          size > 14 &&
          (box.scrollHeight > box.clientHeight ||
            [...box.children].some(l => l.scrollWidth > box.clientWidth))
        )
          box.style.fontSize = --size + 'px';
      }
    });
    await page.screenshot({ path: outFile });
  } finally {
    await browser.close();
  }
}

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { force: { type: 'boolean' } },
  });
  const postFile = findPost(positionals[0]);
  const post = await parsePost(postFile);
  const outFile = path.join(OUT_DIR, `${post.name}-card.png`);
  const rel = path.relative(process.cwd(), outFile);
  if (fs.existsSync(outFile) && !values.force)
    throw new Error(`${rel} exists; pass --force to overwrite`);
  await render(cardHtml(post), outFile, post.feature);
  console.log(`Wrote ${rel}`);
  const image = `/img/social/${post.name}-card.png`;
  if (post.image !== image)
    console.log(
      `Add to ${path.basename(postFile)} frontmatter:\n  image: ${image}`,
    );
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});
