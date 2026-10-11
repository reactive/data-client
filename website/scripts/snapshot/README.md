# Archived versions

dataclient.io documents the latest version only. When a breaking version ships, the docs it replaces
are frozen: the site is built once from the old version's last release tag and served at
`dataclient.io/<version>/` (for example `/0.18/docs/api/useSuspense`). Each archive builds with its
own lockfile, packages, config and editor types, so its playgrounds run, and its examples
type-check, as they did when that release's CI passed. Archives add nothing to the site's own builds.

- `build.sh <checkout> <version> <out.tar.gz>` builds an archive from a checkout of a release. It
  copies `docusaurus.snapshot.config.ts` beside that release's config, which moves it under
  `/<version>/`, drops its blog (the latest site has every post, and `vercel.json` redirects
  `/<version>/blog`), and adds a banner and navbar link back to the latest docs. The wrapper runs
  against old configs, so it only reads fields every release has.
- `.github/workflows/docs-snapshot.yml` runs it in a read-only job (the release's install and build
  run third-party code), then a second job uploads the archive to the `docs-v<version>` GitHub
  release and opens a PR adding the version and the archive's sha256 to
  `website/versionsArchived.json` (newest first). That PR is made with the workflow token, so CI only runs once someone pushes to it.
  `release.yml` calls the workflow when a breaking version (a 0.x minor, otherwise a major)
  publishes. To rebuild one, dispatch it with the version and, for a fix, a `docs/<version>` branch
  cut from the release tag as `ref`.
- `fetch.sh <build dir>` unpacks every listed archive into the built site, after checking its
  sha256. `site-preview.yml` runs
  it before uploading a build for deploy, so production and previews serve them.
- `src/theme/NavbarItem/VersionsNavbarItem.tsx` is the navbar's version dropdown. It reads an
  archive's sitemap (on hover, or when the mobile menu opens) to link to the same page in it, or
  that section's start when the archive lacks it.
