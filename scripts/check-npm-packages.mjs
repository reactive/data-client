#!/usr/bin/env node
// Fails before a publish when a public workspace doesn't exist on npm yet.
// release.yml publishes with npm trusted publishing (OIDC, no token), which
// can only publish new versions of a package that already trusts that
// workflow. Otherwise the publish fails with "No authentication configured
// for request", and yarn then aborts the remaining packages.
//
// npm doesn't show a package's trusted publisher config without a login, so
// packages whose `latest` and `beta` were both published by hand only get a
// warning: CI may never have published them.
//
// To add a new package, a maintainer publishes it once by hand, then on
// npmjs.com > package > Settings > Trusted publishing adds GitHub Actions:
// reactive/data-client, workflow release.yml, no environment.

import { execFileSync } from 'node:child_process';

const registry = 'https://registry.npmjs.org';

const names = execFileSync(
  'yarn',
  ['workspaces', 'list', '--no-private', '--json'],
  { encoding: 'utf8' },
)
  .trim()
  .split('\n')
  .map(line => JSON.parse(line).name);

async function getTag(name, tag) {
  const res = await fetch(`${registry}/${name.replace('/', '%2F')}/${tag}`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`${registry} answered ${res.status}`);
  return res.json();
}

// One request per package and tag, all at once: well under a second
const results = await Promise.all(
  names.map(async name => {
    try {
      const [latest, beta] = await Promise.all([
        getTag(name, 'latest'),
        getTag(name, 'beta'),
      ]);
      if (!latest && !beta) return [name, 'missing'];
      const trusted = [latest, beta].some(v => v?._npmUser?.trustedPublisher);
      return [name, trusted ? 'ok' : 'untrusted'];
    } catch (e) {
      // Only a 404 proves a package is missing. If npm is down or slow, let
      // the publish run: it reports its own errors
      console.warn(`::warning title=npm check skipped::${name}: ${e.message}`);
      return [name, 'unchecked'];
    }
  }),
);
const byState = Object.groupBy(results, ([, state]) => state);
const list = state => byState[state]?.map(([name]) => name).join(', ');
const missing = list('missing');
const untrusted = list('untrusted');

// ::warning:: and ::error:: show as annotations on the run's summary page
if (untrusted) {
  console.warn(
    `::warning title=Maybe no trusted publisher::CI has never published ${untrusted}. If its publish fails with "No authentication configured", add reactive/data-client release.yml as its trusted publisher on npmjs.com.`,
  );
}
if (missing) {
  console.error(
    `::error title=Package not on npm::CI can't publish the first version of ${missing}. Publish it once by hand (cd packages/<name> && npm publish --access public), then add reactive/data-client release.yml as its trusted publisher on npmjs.com.`,
  );
  process.exit(1);
}
if (!byState.unchecked)
  console.log(`All ${names.length} public packages exist on npm`);
