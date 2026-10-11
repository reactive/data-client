# Maintenance branches

master normally holds the latest version: it releases (`release.yml`) and serves dataclient.io. When
master takes the next major's first breaking change, the current version moves to a maintenance
branch, `<version>.x` (for example `0.18.x`). That branch releases the current version's fixes, and
its docs serve at the root while master's serve at `/next/`
([website/scripts/snapshot/README.md](../../website/scripts/snapshot/README.md#current-and-next)).

## Cutting one

Run `scripts/maintenance/cut.sh <version> [ref]` from a checkout with push access. `ref` defaults to
the version's newest `@data-client/react` tag; pass the last master commit before the breaking
change to keep what merged since. The script:

- cuts `<version>.x` from `ref`, then on it:
  - points `.changeset/config.json`'s `baseBranch`, `release.yml`'s push trigger and
    `site-preview.yml`'s pull_request trigger at the branch, so its PRs get a site preview, and
    publishes with `publish.sh`, which uses npm's `latest` tag until the next major ships and
    `latest-<version>` after, so `latest` stays on the newest major;
  - points its pages' edit links and its GitHub release tags at the branch, and drops
    `versionCurrent.json` (a release tag predates its archive listing PR deleting it);
  - adds `maintenance.yml`, which redeploys the docs (dispatching master's `site-preview.yml`) and
    opens a PR cherry-picking each push onto master, skipping its version bumps. A pick that doesn't
    apply leaves a warning to port it by hand. The workflow token opens it, so push a commit (or
    close and reopen) to run its CI.
- pushes `next-<version>`, adding `website/versionCurrent.json` to master. Merge its PR to switch
  the docs over.

The branch adds a workflow, so it's pushed with your credentials: the Actions token can't. Set up
its branch protection the way master's is.

## Working on it

Open fixes, for packages or docs, as PRs against `<version>.x`, with a changeset as usual. Its
`release.yml` opens a Version Packages PR there; merging it publishes. Each merge is ported to master
by `maintenance.yml`. CircleCI, `release.yml` and `site-preview.yml`'s PR build run on the branch:
the other Actions workflows it has are from the release it was cut from and run only for master.

Publish blog posts here too: the root's blog is this branch's, so a post runs the version that's
current when it's published, at the URL it keeps. A post about the next major stays a draft on
master until that release.

## When the next major ships

The release archives the current version's docs from its branch at `/<version>/` and opens a PR
listing it, which also deletes `website/versionCurrent.json`. Once that merges, master serves the
root again. The branch can stay for later fixes: they publish under `latest-<version>`, and a docs
fix there reaches the archive by dispatching `docs-snapshot.yml` with the branch as `ref`.
