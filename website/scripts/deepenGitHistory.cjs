'use strict';

/* eslint-disable no-undef */

/**
 * Vercel builds from a ~10 commit shallow clone, so Docusaurus would date every
 * page not touched in those commits to the oldest commit in the clone
 * ("Last updated"). Fetches more history first. Fails open: a failed fetch
 * only leaves the dates as they were.
 *
 * Invoked from docusaurus.config.ts. Does nothing outside Vercel builds.
 */

const { execFileSync } = require('child_process');

const DEPTH = '800';

function deepenGitHistory() {
  const {
    VERCEL,
    VERCEL_GIT_COMMIT_REF: ref,
    VERCEL_GIT_REPO_OWNER: owner,
    VERCEL_GIT_REPO_SLUG: slug,
  } = process.env;
  if (!VERCEL || !ref || !owner || !slug) return;
  const git = args =>
    execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 60_000,
    }).trim();
  try {
    if (git(['rev-parse', '--is-shallow-repository']) !== 'true') return;
    // Vercel's clone has no `origin` remote, so fetch the (public) repo by URL
    const url = `https://github.com/${owner}/${slug}.git`;
    git(['fetch', '-q', '--no-tags', `--deepen=${DEPTH}`, url, ref]);
    console.log(
      `Deepened git history by ${DEPTH} commits for last-update dates`,
    );
  } catch (e) {
    console.warn(
      `Could not deepen git history; last-update dates may be off (${e.message.split('\n')[0]})`,
    );
  }
}

module.exports = { deepenGitHistory };
