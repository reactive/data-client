#!/usr/bin/env node
// Fails before a publish when a public workspace doesn't exist on npm yet.
// release.yml publishes with npm trusted publishing (OIDC, no token), which
// can only publish new versions of a package that already trusts that
// workflow. A new package's first publish fails with "No authentication
// configured for request", and yarn then aborts the remaining packages.
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

const missing = [];
for (const name of names) {
  const res = await fetch(`${registry}/${name.replace('/', '%2F')}`, {
    method: 'HEAD',
  });
  if (res.status === 404) missing.push(name);
  else if (!res.ok)
    throw new Error(`${registry} answered ${res.status} for ${name}`);
}

if (missing.length) {
  console.error(
    `Not on npm yet: ${missing.join(', ')}
CI can't publish a package's first version. Publish each once by hand
(cd packages/<name> && npm publish --access public), then add
reactive/data-client release.yml as its trusted publisher on npmjs.com.`,
  );
  process.exit(1);
}
console.log(`All ${names.length} public packages exist on npm`);
