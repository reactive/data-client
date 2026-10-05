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
  const ref = process.env.VERCEL_GIT_COMMIT_REF;
  if (!process.env.VERCEL || !ref) return;
  const git = args =>
    execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 60_000,
    }).trim();
  try {
    if (git(['rev-parse', '--is-shallow-repository']) !== 'true') return;
    git(['fetch', '-q', '--no-tags', `--deepen=${DEPTH}`, 'origin', ref]);
    console.log(
      `Deepened git history by ${DEPTH} commits for last-update dates`,
    );
  } catch {
    console.warn('Could not deepen git history; last-update dates may be off');
  }
}

module.exports = { deepenGitHistory };
