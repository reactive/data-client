#!/usr/bin/env node
// Blog posts take their date (and URL) from the filename prefix, so a draft
// written weeks before release would publish with its draft date.
//
//   yarn blog:publish website/blog/<post>.md
//     removes `draft: true`, renames the post to today's date, rewrites its
//     /blog/YYYY/MM/DD/slug links repo-wide and stages the post
//   node website/scripts/blog-publish.mjs --check <base-ref>
//     (CI) fails when a post published since <base-ref> isn't dated within
//     MAX_DAYS of today, or is dated any way but its filename
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { basename } from 'node:path';

const BLOG_DIR = 'website/blog';
const MAX_DAYS = 3;
const MARKDOWN = /\.mdx?$/;
const POST = /^(\d{4})-(\d{2})-(\d{2})-(.+)\.mdx?$/;
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---/;
const DRAFT = /^draft:\s*true\s*(#.*)?$/m;

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
const today = new Date().toISOString().slice(0, 10);

// Front matter is read with regexes rather than @docusaurus/utils so CI can
// run this before installing packages.
function frontMatter(source) {
  const block = source.match(FRONT_MATTER)?.[1] ?? '';
  return { draft: DRAFT.test(block), hasDate: /^date:/m.test(block) };
}

function publish(path) {
  const file = basename(path);
  const match = file.match(POST);
  if (!existsSync(`${BLOG_DIR}/${file}`) || !match) {
    throw new Error(`${path}: expected ${BLOG_DIR}/YYYY-MM-DD-slug.md`);
  }
  path = `${BLOG_DIR}/${file}`;
  const source = readFileSync(path, 'utf8');
  if (frontMatter(source).hasDate) {
    throw new Error(
      `${path}: remove its \`date:\` field; the filename dates it`,
    );
  }
  writeFileSync(
    path,
    source.replace(FRONT_MATTER, block =>
      block.replace(/^draft:\s*true\s*(#.*)?\r?\n/m, ''),
    ),
  );

  const [, year, month, day, slug] = match;
  const newFile = today + file.slice(today.length);
  if (newFile !== file) {
    if (existsSync(`${BLOG_DIR}/${newFile}`)) {
      throw new Error(`${path}: can't rename, ${newFile} already exists`);
    }
    // Not `git mv`: a new post may not be tracked yet
    renameSync(path, `${BLOG_DIR}/${newFile}`);
    rewriteLinks(
      `/blog/${year}/${month}/${day}/${slug}`,
      `/blog/${today.replaceAll('-', '/')}/${slug}`,
    );
  }
  // Stage after the rewrite so the commit gets the updated self-links
  git('add', '--', `${BLOG_DIR}/${newFile}`);
  if (newFile !== file) {
    git('rm', '--cached', '-q', '--ignore-unmatch', '--', path);
  }
  console.log(`published ${BLOG_DIR}/${newFile}`);
}

function rewriteLinks(oldUrl, newUrl) {
  // Stop at the slug's end so siblings like `${slug}-notes` are untouched
  const oldUrlPattern = new RegExp(
    `${oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w.-])`,
    'g',
  );
  let linking = [];
  try {
    linking = git('grep', '--untracked', '-lF', oldUrl)
      .split('\n')
      .filter(Boolean);
  } catch (error) {
    // git grep exits 1 when nothing links to the post
    if (error.status !== 1) throw error;
  }
  for (const linked of linking) {
    const text = readFileSync(linked, 'utf8');
    writeFileSync(linked, text.replace(oldUrlPattern, newUrl));
  }
}

function check(base) {
  const publishedAtBase = new Set(
    git('ls-tree', '--name-only', base, `${BLOG_DIR}/`)
      .split('\n')
      .map(path => path.slice(BLOG_DIR.length + 1))
      .filter(file => MARKDOWN.test(file))
      .filter(
        file => !frontMatter(git('show', `${base}:${BLOG_DIR}/${file}`)).draft,
      ),
  );
  // A published post that was only renamed (slug fix, .md -> .mdx) stays published
  const renamedFrom = new Map(
    git('diff', '--name-status', '-M', '--diff-filter=R', base, '--', BLOG_DIR)
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const [, from, to] = line.split('\t');
        return [to.slice(BLOG_DIR.length + 1), from.slice(BLOG_DIR.length + 1)];
      }),
  );

  let failed = false;
  const fail = message => {
    console.error(message);
    failed = true;
  };
  for (const entry of readdirSync(BLOG_DIR, { withFileTypes: true })) {
    const file = entry.name;
    const path = `${BLOG_DIR}/${file}`;
    // Docusaurus also builds posts from folders, which this check can't date
    if (entry.isDirectory() && !file.startsWith('.')) {
      fail(`${path}: use a YYYY-MM-DD-slug.md file, not a post folder`);
      continue;
    }
    if (!MARKDOWN.test(file)) continue;
    if (publishedAtBase.has(renamedFrom.get(file) ?? file)) continue;
    const { draft, hasDate } = frontMatter(readFileSync(path, 'utf8'));
    if (draft) continue;

    const match = file.match(POST);
    if (!match || hasDate) {
      fail(
        `${path}: name published posts YYYY-MM-DD-slug.md, without a \`date:\` front matter field`,
      );
      continue;
    }
    const postDate = `${match[1]}-${match[2]}-${match[3]}`;
    const days = Math.abs(Date.parse(postDate) - Date.parse(today)) / 864e5;
    if (days > MAX_DAYS) {
      fail(
        `${path}: published with date ${postDate}, but today is ${today}. ` +
          `Run \`yarn blog:publish ${path}\` to date it today and fix its links.`,
      );
    }
  }
  return failed;
}

const [first, second] = process.argv.slice(2);
if (first === '--check' && second) {
  process.exit(check(second) ? 1 : 0);
} else if (first && !first.startsWith('-')) {
  try {
    publish(first);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
} else {
  console.error(
    'usage: yarn blog:publish <post> | blog-publish.mjs --check <base-ref>',
  );
  process.exit(2);
}
