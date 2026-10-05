/**
 * Renders a release blog post's social card to static/img/social/X.Y-card.png
 * from the post's frontmatter and summary bullets.
 *
 * Usage (from repo root):
 *   yarn workspace rdc-website social-card blog/2026-10-03-v0.19-batch-set.md
 *   yarn workspace rdc-website social-card 0.19 --force   # overwrite existing
 *
 * Cards before v0.19 are hand-made; don't --force over them.
 *
 * Requires a Chromium for Playwright (`npx playwright install chromium`), or
 * set CHROMIUM_PATH to an existing Chromium binary.
 */
import yaml from 'js-yaml';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';

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
  if (!arg) throw new Error('Pass a blog post path or a version like 0.19');
  if (fs.existsSync(arg)) return arg;
  const inBlog = path.join(WEBSITE_ROOT, arg);
  if (fs.existsSync(inBlog)) return inBlog;
  const version = arg.replace(/^v/, '');
  const match = fs
    .readdirSync(BLOG_DIR)
    .find(f => f.includes(`-v${version}-`) && /\.mdx?$/.test(f));
  if (!match) throw new Error(`No blog post found for v${version}`);
  return path.join(BLOG_DIR, match);
}

function parsePost(source) {
  const [, front, body] = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const { title, description = '', image } = yaml.load(front);
  const [, version, headline] = title.match(/^v(\d+\.\d+):?\s*(.*)$/);
  const [summary, details = ''] = body.split(
    /\{\/\*\s*truncate\s*\*\/\}|<!--\s*truncate\s*-->/,
  );
  const bullets = summaryBullets(summary);
  return {
    version,
    headline,
    description,
    image,
    rows: bullets
      .slice(0, MAX_ROWS)
      .map(({ tag, text }) => ({ tag, label: bulletLabel(text) })),
    feature: featureVisual(bullets, details),
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

// Code windows for the headline features: a Before/After pair from the first
// feature's section, else the first code block of each new feature's section
function featureVisual(bullets, details) {
  const features = bullets
    .filter(b => b.tag === 'new')
    .slice(0, 3)
    .map(b => ({ ...b, ...featureSection(b.text, details) }))
    // bullets that link to the same section show its code once
    .filter(
      (f, i, all) =>
        f.blocks?.length && all.findIndex(o => o.section === f.section) === i,
    );
  if (!features.length) return;
  const [first] = features;
  const before = first.blocks.find(b => b.title === 'Before');
  const after = first.blocks.find(b => b.title === 'After');
  const windows =
    before && after ?
      [
        { ...before, kind: 'before' },
        { ...after, kind: 'after' },
      ]
    : features.map(f => ({
        title: bulletLabel(f.text),
        code: f.blocks[0].code,
      }));
  const speedup = (first.text + first.section).match(
    /(\d+(?:\.\d+)?)x faster/i,
  )?.[1];
  return { windows, speedup };
}

// The section a bullet's #anchor links to, and its fenced code blocks
function featureSection(bullet, details) {
  const anchor = bullet.match(/\]\([^)#]*#([\w-]+)\)/)?.[1];
  const start =
    anchor ? details.search(new RegExp(`^##.*\\{#${anchor}\\}`, 'm')) : -1;
  if (start < 0) return;
  const section = details.slice(start).split(/\n## /)[0];
  const blocks = [...section.matchAll(/```\w*([^\n]*)\n([\s\S]*?)\n```/g)].map(
    ([, meta, code]) => ({
      title: meta.match(/title="([^"]+)"/)?.[1],
      code: firstLines(code.replace(/^\s*\/\/ highlight-next-line\n/gm, '')),
    }),
  );
  return { section, blocks };
}

// Up to MAX_CODE_LINES, ending at a blank line when cut so statements stay whole
function firstLines(code) {
  const lines = code.split('\n');
  if (lines.length <= MAX_CODE_LINES) return code;
  const head = lines.slice(0, MAX_CODE_LINES);
  const blank = head.lastIndexOf('');
  return head.slice(0, blank > 0 ? blank : MAX_CODE_LINES).join('\n');
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

function windowsHtml({ windows, speedup }) {
  const html = windows
    .map(
      ({ title, code, kind = '' }, i) =>
        `<div class="editor ${kind} w${i + 1}-of-${windows.length}"><div class="chrome"><i></i><i></i><i></i><span>${escape(title ?? '')}</span></div><pre>${code
          .split('\n')
          .map(line => `<div class="line">${highlight(line) || ' '}</div>`)
          .join('')}</pre></div>`,
    )
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

// Deterministic per-version so re-running produces the same image
function prng(seed) {
  let s = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}

// Light streams fanning out from behind the panel to the right edge
function lightStreams(random) {
  const colors = ['#3e96db', '#4fc3f7', '#7c6cf0', '#22d3ee'];
  let paths = '';
  let dots = '';
  for (let i = 0; i < 46; i++) {
    const color = i % 11 === 5 ? '#f59e0b' : colors[Math.floor(random() * 4)];
    const p0 = [WIDTH * 0.68, HEIGHT * (0.4 + random() * 0.2)];
    const p3 = [WIDTH, HEIGHT * (-0.05 + random() * 1.1)];
    const p1 = [WIDTH * 0.8, p0[1]];
    const p2 = [WIDTH * 0.86, p3[1]];
    // cubic bezier point at t
    const at = t =>
      [0, 1].map(
        k =>
          (1 - t) ** 3 * p0[k] +
          3 * (1 - t) ** 2 * t * p1[k] +
          3 * (1 - t) * t ** 2 * p2[k] +
          t ** 3 * p3[k],
      );
    paths += `<path d="M${p0} C${p1} ${p2} ${p3}" stroke="${color}" stroke-width="${(0.6 + random() * 1.2).toFixed(1)}" fill="none" opacity="${(0.15 + random() * 0.5).toFixed(2)}"/>`;
    for (let j = 0; j < 3; j++) {
      const [x, y] = at(0.45 + random() * 0.55);
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.5 + random() * 2.5).toFixed(1)}" fill="${color}" filter="url(#glow)"/>`;
    }
  }
  return `<svg class="streams" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs><filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    ${paths}${dots}</svg>`;
}

// Inline the site's fonts so rendering is offline and reproducible
function fontFace(family, file) {
  const woff2 = fs.readFileSync(
    path.join(WEBSITE_ROOT, 'static/font', file),
    'base64',
  );
  return `@font-face { font-family: '${family}'; font-weight: 100 900; src: url(data:font/woff2;base64,${woff2}) format('woff2'); }`;
}

function cardHtml({ version, headline, description, rows, feature }) {
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
  .streams { position: absolute; inset: 0; -webkit-mask-image: linear-gradient(90deg, transparent 70%, #000 90%); }
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
  .headline { margin-top: 30px; height: 250px; font-weight: 600; line-height: 1.05; letter-spacing: -0.01em; }
  .headline .accent { color: #3b8cf5; }
  .rule { margin-top: 34px; width: 560px; height: 1px; background: linear-gradient(90deg, #2a3a55, transparent); }
  .tagline {
    margin-top: 30px; width: 640px; font-size: 32px; font-weight: 300; line-height: 1.4; color: #b4bfd0;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
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
  .w1-of-3 { top: 60px; right: 60px; width: 600px; }
  .w2-of-3 { top: 300px; right: 330px; width: 520px; }
  .w3-of-3 { bottom: 60px; right: 90px; width: 620px; }
  .chrome { display: flex; align-items: center; gap: 9px; padding: 14px 20px; background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.06); }
  .chrome i { width: 13px; height: 13px; border-radius: 50%; background: #2c3a55; }
  .chrome span { margin-left: 14px; font: 500 20px 'Roboto Mono', monospace; letter-spacing: 0.08em; text-transform: uppercase; color: #8aa0c0; }
  .after .chrome span, .w1-of-1 .chrome span, .w1-of-3 .chrome span { color: #5eead4; }
  .editor pre { padding: 20px 26px 24px 0; font: 400 24px/1.55 'Roboto Mono', monospace; color: #d6deeb; white-space: pre; overflow: hidden; }
  .line::before { content: ''; display: inline-block; width: 26px; text-align: center; }
  .before .line::before { content: '−'; width: 52px; color: #f87171; }
  .after .line::before { content: '+'; width: 52px; color: #4ade80; }
  .t-keyword { color: #c792ea; } .t-string { color: #c3e88d; } .t-number { color: #f78c6c; }
  .t-type { color: #ffcb6b; } .t-call { color: #82aaff; } .t-comment { color: #637777; font-style: italic; }
  .stat {
    position: absolute; right: 50px; bottom: 45px; padding: 18px 30px 20px; border-radius: 22px;
    background: linear-gradient(160deg, rgba(20,60,120,0.95), rgba(10,26,58,0.97));
    border: 1.5px solid rgba(94,234,212,0.45); box-shadow: 0 30px 70px rgba(0,0,0,0.6), 0 0 50px rgba(45,212,191,0.25);
  }
  .stat .big { font-size: 92px; font-weight: 700; line-height: 1; background: linear-gradient(180deg, #5eead4, #3b8cf5); -webkit-background-clip: text; color: transparent; }
  .stat .big small { font-size: 0.55em; }
  .stat .unit { font-size: 30px; font-weight: 500; letter-spacing: 0.12em; color: #cfe3ff; text-transform: uppercase; margin-top: 4px; }
</style></head><body>
${lightStreams(prng(version))}
<div class="left">
  <div class="brand">${logo}<div><div class="name">REACTIVE</div><div class="sub">DATA CLIENT</div></div></div>
  <div class="version"><span class="num">v${escape(version)}</span><span class="pill">RELEASE</span></div>
  <div class="headline" id="headline">${lines}</div>
  <div class="rule"></div>
  <div class="tagline">${escape(description)}</div>
</div>
${
  feature ? windowsHtml(feature)
  : panelRows ?
    `<div class="panel"><h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/><path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></svg>WHAT'S NEW</h2>${panelRows}</div>`
  : ''
}
</body></html>`;
}

async function render(html, outFile) {
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
    // Shrink the headline and code until every line fits, with real font metrics
    await page.evaluate(() => {
      for (const box of document.querySelectorAll('#headline, pre')) {
        let size = box.id ? 120 : 26;
        box.style.fontSize = size + 'px';
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
  const post = parsePost(
    fs.readFileSync(postFile, 'utf8').replace(/\r\n/g, '\n'),
  );
  const outFile = path.join(OUT_DIR, `${post.version}-card.png`);
  if (fs.existsSync(outFile) && !values.force)
    throw new Error(
      `${path.relative(process.cwd(), outFile)} exists; pass --force to overwrite`,
    );
  await render(cardHtml(post), outFile);
  console.log(`Wrote ${path.relative(process.cwd(), outFile)}`);
  const image = `/img/social/${post.version}-card.png`;
  if (post.image !== image)
    console.log(
      `Add to ${path.basename(postFile)} frontmatter:\n  image: ${image}`,
    );
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});
