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
//
// Usage: node scripts/check-npm-packages.mjs (run by the changeset:publish scripts)
import { execFileSync } from 'node:child_process';

const registry = (
  process.env.npm_config_registry || 'https://registry.npmjs.org'
).replace(/\/$/, '');

const names = execFileSync(
  'yarn',
  ['workspaces', 'list', '--no-private', '--json'],
  { encoding: 'utf8' },
)
  .trim()
  .split('\n')
  .map(line => JSON.parse(line).name);

async function getTag(name, tag) {
  const res = await fetch(`${registry}/${name.replace('/', '%2F')}/${tag}`);
  if (res.status === 404) return undefined;
  if (!res.ok)
    throw new Error(`${registry} answered ${res.status} for ${name}`);
  return res.json();
}

// All requests at once: the check adds well under a second to the publish
const status = await Promise.all(
  names.map(async name => {
    const [latest, beta] = await Promise.all([
      getTag(name, 'latest'),
      getTag(name, 'beta'),
    ]);
    if (!latest && !beta) return 'missing';
    return [latest, beta].some(v => v?._npmUser?.trustedPublisher) ? 'ok' : (
        'untrusted'
      );
  }),
);
const having = want => names.filter((_, i) => status[i] === want).join(', ');

// ::warning:: and ::error:: show as annotations on the run's summary page
if (having('untrusted')) {
  console.warn(
    `::warning title=Maybe no trusted publisher::CI has never published ${having('untrusted')}. If its publish fails with "No authentication configured", add reactive/data-client release.yml as its trusted publisher on npmjs.com.`,
  );
}
if (having('missing')) {
  console.error(
    `::error title=Package not on npm::CI can't publish the first version of ${having('missing')}. Publish it once by hand (cd packages/<name> && npm publish --access public), then add reactive/data-client release.yml as its trusted publisher on npmjs.com.`,
  );
  process.exit(1);
}
console.log(`All ${names.length} public packages exist on npm`);
