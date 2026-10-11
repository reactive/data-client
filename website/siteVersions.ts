// The site's versions (scripts/snapshot/README.md), checked as they're read so a
// bad listing fails the build instead of the deploy. The only reader of
// versionCurrent.json and versionsArchived.json in the site; workflows read
// them with jq.
import fs from 'fs';
import path from 'path';

/** Where a version's site lives: '' for the root, else '/<version>' */
export interface VersionTarget {
  version: string;
  root: string;
}

/** Read by VersionsNavbarItem (customFields.versions) */
export interface SiteVersions {
  /** Whether this site is the next, unreleased major */
  next: boolean;
  /** The other versions, newest first */
  others: VersionTarget[];
}

// A release line, which a breaking change starts: the minor for 0.x, else the
// major (scripts/maintenance/version-line.sh)
const LINE = /^(0\.\d+|[1-9]\d*)$/;

const read = (file: string) =>
  fs.existsSync(path.join(__dirname, file)) ?
    JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'))
  : undefined;

function check(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(`website/siteVersions.ts: ${message}`);
}

/**
 * The released version master is a major ahead of, present while
 * versionCurrent.json is (from scripts/maintenance/cut.sh): its docs serve at
 * the root, built from its maintenance branch.
 */
export const versionCurrent: { version: string; ref: string } | undefined =
  read('versionCurrent.json');
if (versionCurrent) {
  const { version, ref } = versionCurrent;
  check(LINE.test(version), `versionCurrent.json: ${version} isn't a line`);
  check(
    ref === `${version}.x`,
    `versionCurrent.json: ref must be ${version}.x`,
  );
}

/** Frozen builds served at /<version>/, from docs-snapshot.yml */
const versionsArchived: { version: string; sha256: string }[] =
  read('versionsArchived.json') ?? [];
for (const { version, sha256 } of versionsArchived) {
  check(LINE.test(version), `versionsArchived.json: ${version} isn't a line`);
  check(
    /^[0-9a-f]{64}$/.test(sha256),
    `versionsArchived.json: ${version}'s sha256`,
  );
  check(
    versionsArchived.filter(v => v.version === version).length === 1,
    `versionsArchived.json lists ${version} twice`,
  );
  check(
    version !== versionCurrent?.version,
    `${version} is both current and archived`,
  );
}

/**
 * @param currentSite where the current version's site is, when this site is
 * the next major: '' when it's this one's root
 */
export const siteVersions = (currentSite: string): SiteVersions => ({
  next: !!versionCurrent,
  others: [
    ...(versionCurrent ?
      [{ version: versionCurrent.version, root: currentSite }]
    : []),
    ...versionsArchived
      .map(({ version }) => ({ version, root: `/${version}` }))
      .sort((a, b) =>
        b.version.localeCompare(a.version, undefined, { numeric: true }),
      ),
  ],
});
