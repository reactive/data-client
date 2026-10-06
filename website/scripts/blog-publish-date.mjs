#!/usr/bin/env node
// Blog posts take their date (and URL) from the filename prefix, so a draft
// written weeks before release would publish with its draft date. This fails
// when a post is published (newly added without `draft: true`, or its
// `draft: true` removed) and its date isn't within MAX_DAYS of today.
//
//   node website/scripts/blog-publish-date.mjs <base-ref>        check
//   node website/scripts/blog-publish-date.mjs <base-ref> --fix  rename to today
//
// --fix renames the file and rewrites its /blog/YYYY/MM/DD/slug links repo-wide.
// A newly published post must be dated by its filename alone (no `date:`).
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';

const BLOG_DIR = 'website/blog';
const MAX_DAYS = 3;
const MARKDOWN = /\.mdx?$/;
const POST = /^(\d{4})-(\d{2})-(\d{2})-(.+)\.mdx?$/;

const [base, flag] = process.argv.slice(2);
if (!base) {
  console.error('usage: blog-publish-date.mjs <base-ref> [--fix]');
  process.exit(2);
}
const fix = flag === '--fix';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });

// Front matter is read with regexes rather than @docusaurus/utils so CI can
// run this before installing packages.
function frontMatter(source) {
  const block = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  return {
    draft: /^draft:\s*true\s*(#.*)?$/m.test(block),
    hasDate: /^date:/m.test(block),
  };
}

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

const today = new Date().toISOString().slice(0, 10);
let failed = false;

for (const entry of readdirSync(BLOG_DIR, { withFileTypes: true })) {
  const file = entry.name;
  // Docusaurus also builds posts from folders, which this check can't date
  if (entry.isDirectory() && !file.startsWith('.')) {
    console.error(
      `${BLOG_DIR}/${file}: use a YYYY-MM-DD-slug.md file, not a post folder`,
    );
    failed = true;
    continue;
  }
  if (!MARKDOWN.test(file)) continue;
  if (publishedAtBase.has(renamedFrom.get(file) ?? file)) continue;
  const path = `${BLOG_DIR}/${file}`;
  const { draft, hasDate } = frontMatter(readFileSync(path, 'utf8'));
  if (draft) continue;

  // Only the filename dates a post, so --fix can rename it and its links
  const match = file.match(POST);
  if (!match || hasDate) {
    console.error(
      `${path}: name published posts YYYY-MM-DD-slug.md, without a \`date:\` front matter field`,
    );
    failed = true;
    continue;
  }
  const [, year, month, day, slug] = match;
  const postDate = `${year}-${month}-${day}`;
  const days = Math.abs(Date.parse(postDate) - Date.parse(today)) / 864e5;
  if (days <= MAX_DAYS) continue;

  if (fix) {
    const newFile = today + file.slice(today.length);
    // Not `git mv`: a new post may not be tracked yet
    if (existsSync(`${BLOG_DIR}/${newFile}`)) {
      console.error(`${path}: can't rename, ${newFile} already exists`);
      failed = true;
      continue;
    }
    renameSync(path, `${BLOG_DIR}/${newFile}`);
    git('add', '--', `${BLOG_DIR}/${newFile}`);
    git('rm', '--cached', '-q', '--ignore-unmatch', '--', path);
    const oldUrl = `/blog/${year}/${month}/${day}/${slug}`;
    const newUrl = oldUrl.replace(
      `${year}/${month}/${day}`,
      today.replaceAll('-', '/'),
    );
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
    console.log(
      `renamed ${file} -> ${newFile}; updated links in ${linking.length} file(s)`,
    );
  } else {
    console.error(
      `${path}: published with date ${postDate}, but today is ${today}. ` +
        `Run \`node website/scripts/blog-publish-date.mjs origin/master --fix\` to rename it and its links.`,
    );
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
