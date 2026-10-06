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
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';

const BLOG_DIR = 'website/blog';
const MAX_DAYS = 3;
const POST = /^(\d{4})-(\d{2})-(\d{2})-(.+)\.mdx?$/;
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---/;
const DRAFT = /^draft:\s*(true|True|TRUE)[^\S\r\n]*(#.*)?(\r?\n|$)/m;

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
const today = new Date().toISOString().slice(0, 10);
const urlDate = date => date.replaceAll('-', '/');

// Front matter is read with regexes rather than @docusaurus/utils so CI can
// run this before installing packages.
function frontMatter(source) {
  const block = source.match(FRONT_MATTER)?.[1] ?? '';
  return { draft: DRAFT.test(block), hasDate: /^date:/m.test(block) };
}

function publish(arg) {
  const file = basename(arg);
  const path = `${BLOG_DIR}/${file}`;
  const slug = file.match(POST)?.[4];
  if (!slug || !existsSync(path)) {
    throw new Error(`${arg}: expected ${BLOG_DIR}/YYYY-MM-DD-slug.md`);
  }
  const source = readFileSync(path, 'utf8');
  if (frontMatter(source).hasDate) {
    throw new Error(
      `${path}: remove its \`date:\` field; the filename dates it`,
    );
  }
  const newPath = `${BLOG_DIR}/${today}${file.slice(today.length)}`;
  if (newPath !== path && existsSync(newPath)) {
    throw new Error(`${path}: can't rename, ${newPath} already exists`);
  }
  writeFileSync(
    path,
    source.replace(FRONT_MATTER, block => block.replace(DRAFT, '')),
  );

  if (newPath !== path) {
    // Not `git mv`: a new post may not be tracked yet
    renameSync(path, newPath);
    rewriteLinks(
      `/blog/${urlDate(file.slice(0, 10))}/${slug}`,
      `/blog/${urlDate(today)}/${slug}`,
    );
    git('rm', '--cached', '-q', '--ignore-unmatch', '--', path);
  }
  // Stage after the rewrite so the commit gets the updated self-links
  git('add', '--', newPath);
  console.log(`published ${newPath}`);
}

function rewriteLinks(oldUrl, newUrl) {
  // Stop at the slug's end so siblings like `${slug}-notes` are untouched
  const oldUrlPattern = new RegExp(
    `${oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w.-])`,
    'g',
  );
  let linking = [];
  try {
    linking = git('grep', '--untracked', '-IlF', oldUrl)
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
  if (!linking.length) return;
  // Stage the rewrites so the commit has no broken links. Untracked files are
  // left for their author to add (`git add -u` rejects them on newer git)
  const tracked = git('ls-files', '-z', '--', ...linking)
    .split('\0')
    .filter(Boolean);
  if (tracked.length) git('add', '--', ...tracked);
}

function check(base) {
  let failed = false;
  const fail = message => {
    console.error(message);
    failed = true;
  };
  // Only added, modified or renamed posts can have gone from draft to published
  const changes = git('diff', '--name-status', '-M', base, '--', BLOG_DIR)
    .split('\n')
    .filter(Boolean)
    .map(line => line.split('\t'));
  for (const [status, from, to = from] of changes) {
    const file = to.slice(BLOG_DIR.length + 1);
    if (status === 'D' || file.startsWith('.') || !/\.mdx?$/.test(file)) {
      continue;
    }
    // Docusaurus also builds posts from folders, which this check can't date
    if (file.includes('/')) {
      fail(`${to}: use a YYYY-MM-DD-slug.md file, not a post folder`);
      continue;
    }
    const { draft, hasDate } = frontMatter(readFileSync(to, 'utf8'));
    if (draft) continue;
    if (status !== 'A' && !frontMatter(git('show', `${base}:${from}`)).draft) {
      continue;
    }

    if (!POST.test(file) || hasDate) {
      fail(
        `${to}: name published posts YYYY-MM-DD-slug.md, without a \`date:\` front matter field`,
      );
      continue;
    }
    const postDate = file.slice(0, 10);
    const days = Math.abs(Date.parse(postDate) - Date.parse(today)) / 864e5;
    if (days > MAX_DAYS) {
      fail(
        `${to}: published with date ${postDate}, but today is ${today}. ` +
          `Run \`yarn blog:publish ${to}\` to date it today and fix its links.`,
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
