// The site's versions (scripts/snapshot/README.md), checked as they're read so a
// bad listing fails the build instead of the deploy. The site's config and
// pages read versionCurrent.json and versionsArchived.json only through this;
// scripts and workflows read their fields with jq.
import fs from 'fs';
import path from 'path';

export interface VersionTarget {
  version: string;
  /** Its site: '' for this site's root, else an origin */
  root: string;
}

/** Read by VersionsNavbarItem (customFields.versions) */
export interface SiteVersions {
  /** Whether this site documents the next, unreleased major */
  unreleased: boolean;
  /** The other versions, newest first */
  others: VersionTarget[];
}

// A release line, which a breaking change starts: the minor for 0.x, else the
// major. Matches is_line in scripts/maintenance/version-line.sh
const LINE = /^(0\.\d+|[1-9]\d*)$/;

/** Where an archived version serves, like https://0.18.dataclient.io */
export const archiveOrigin = (version: string) =>
  `https://${version}.dataclient.io`;

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

/** Frozen builds, each served at its archiveOrigin, from docs-snapshot.yml */
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

/** The line a version belongs to. Matches line in version-line.sh */
const lineOf = (version: string) => {
  const [major, minor] = version.split('-')[0].split('.');
  return major === '0' ? `0.${minor}` : major;
};

/** This site's version, beside its logo: next while master is a major ahead */
const packageVersion = read('../packages/react/package.json')?.version;
check(
  typeof packageVersion === 'string',
  "packages/react/package.json: version isn't a string",
);
const packageLine = lineOf(packageVersion);
check(
  LINE.test(packageLine),
  `packages/react/package.json: ${packageVersion} has no line`,
);
export const siteLabel = versionCurrent ? 'next' : `v${packageLine}`;

/**
 * @param currentOrigin where the current version's site is, when this site is
 * the next major: production's, or undefined when it's this site's root
 */
export const siteVersions = (currentOrigin?: string): SiteVersions => ({
  unreleased: !!versionCurrent,
  others: [
    ...(versionCurrent ?
      [{ version: versionCurrent.version, root: currentOrigin ?? '' }]
    : []),
    ...versionsArchived
      .map(({ version }) => ({ version, root: archiveOrigin(version) }))
      .sort((a, b) =>
        b.version.localeCompare(a.version, undefined, { numeric: true }),
      ),
  ],
});
