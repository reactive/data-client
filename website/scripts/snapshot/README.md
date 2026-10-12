# Archived versions

dataclient.io documents the latest version only. When a breaking version ships, the docs it replaces
are frozen: the site is built once from the old version's last release tag and served on its own
host, like react.dev's (for example `0.18.dataclient.io/docs/api/useSuspense`). Each archive builds with its
own lockfile, packages, config and editor types, so its playgrounds run, and its examples
type-check, as they did when that release's CI passed. Archives add nothing to the site's own builds.

- `build.sh <checkout> <version> <out.tar.gz>` builds an archive from a checkout of a release. It
  copies `docusaurus.snapshot.config.ts` beside that release's config, which sets its `url` to
  `https://<version>.dataclient.io`, drops its blog with `withoutBlog.ts` (the latest site has every
  post; `vercel.json` redirects the archive host's `/blog` page loads, and `rootBlog.client.ts` its
  in-app links), labels the version under the logo (`versionLabel.ts`, like the latest site's),
  adds the version menu (`versionMenu.client.ts`) in place of any version dropdown the release has,
  and adds a banner linking to the latest docs. The wrapper
  runs against old configs, so it only reads fields every release has.
- `.github/workflows/docs-snapshot.yml` runs it in a job with no write token or dependency cache,
  since the release's install and build run third-party code. A second job, which runs nothing from
  the release, uploads the archive to the `docs-v<version>` GitHub release, named by its sha256,
  and opens a PR listing the version and checksum in `website/versionsArchived.json`. The workflow token makes that PR, so its CI only runs once someone pushes to it.
  `release.yml` calls the workflow when a new release line (a 0.x minor, otherwise a major;
  `scripts/maintenance/version-line.sh`) first publishes a stable version, from the version's maintenance branch if `website/versionCurrent.json` names one. To
  rebuild one, dispatch it with the version and, for a fix, a branch with it (such as that
  maintenance branch) as `ref` (default: the newest tag, from `release-tag.sh`); the listed archive keeps serving until the new listing merges, which
  also deletes `versionCurrent.json` if it names that version.
- `fetch.sh <build dir>` unpacks every listed archive into the built site's `archives/<version>/`
  once its checksum matches, so a changed asset fails the deploy rather than shipping. The build reports that
  checksum itself, so it guards the asset after publishing, not what the build produced.
  `site-preview.yml` runs it before uploading a build for deploy. `vercel.json` rewrites each
  archive's host (`<version>.dataclient.io`) to its directory, except `/api` (the site's
  functions), and redirects that directory's own paths to the host. Vercel applies rewrites after its file check, where the root's pages would answer
  first, so `docs deploy` moves that route ahead of the check in `vercel build`'s output. Production
  deploys then add each listed host to the Vercel project as a domain (dataclient.io's DNS, on
  Cloudflare, already sends every subdomain to Vercel). The hostname scheme lives in `vercel.json`,
  `docusaurus.snapshot.config.ts` and that deploy step.
- The site reads `versionCurrent.json` and `versionsArchived.json` through `website/siteVersions.ts`,
  failing the build when one breaks an invariant: each version is a line, listed once, and not both
  current and archived; each sha256 is one; the current `ref` is `<version>.x`. It also gives the
  label under the logo (`siteLabel`): next, or the line of `packages/react`'s version.
- Hovering the logo, or tapping the version under it, opens a menu of every version's site at the
  same page (`versionMenu.client.ts`, plain DOM since archives add it to old releases' builds). The
  list is `siteVersions` in `siteVersions.ts`: the master build writes it to `site-versions.json`,
  `site-preview.yml` keeps that at the root (`vercel.json` lets the archive hosts read it), and
  every version's site fetches the root's, so frozen archives still list newer versions. Since
  archives can't change, only add fields to that list, and keep its path and CORS header. The
  wrapper replaces any copy of the menu a release lists with build.sh's, so menu fixes reach every
  version's site.

## Current and next

**Now:** `0.18.x` serves [dataclient.io](https://dataclient.io) and master serves
[dataclient.io/next](https://dataclient.io/next/) (`website/versionCurrent.json`). Update this line
when that file changes.

While master takes the next major's breaking changes, the root keeps the released version's docs
and master's serve at `/next/`. [`scripts/maintenance/cut.sh`](../../../scripts/maintenance/README.md)
starts this by cutting a `<version>.x` maintenance branch and adding `website/versionCurrent.json`
(`{ "version", "ref" }`) to master. While that file exists:

- `site-preview.yml`'s production and merge queue builds of master set `DOCS_NEXT=1`:
  `docusaurus.config.ts` builds at `/next/`. It still builds the blog, so its links are checked, but
  its News and Blog links go to the root's (`rootBlog.client.ts`). It shows an "unreleased" banner
  linking to the current version's docs (from a PR preview, built alone at its root, production's).
- Its `current` job builds the maintenance branch at the root with `SNAPSHOT_ROLE=current build.sh`
  (the wrapper keeps the blog and every
  static file), cached by the branch's commit so master's deploys rebuild it only when the branch
  changes, and `docs deploy` puts it beside `/next/` and the archives. `vercel.json` sends `/next/*`
  to the root whenever there is no next build (`docs deploy` drops that redirect while there is one,
  and fails if it's gone), and `/next/blog` to the root's blog.
- The release of the next major archives the current version from its branch, and the listing PR
  deletes `versionCurrent.json`, so master serves the root again.
