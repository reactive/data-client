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
  - drops master's pending changesets, listing them: they're the next major's and release from
    master, so the branch versions only its own fixes. A `ref` past the last release keeps their
    code, so re-add any the branch's next release should list;
  - adds `maintenance.yml`, which redeploys the docs (dispatching master's `site-preview.yml`) and
    opens a PR cherry-picking each push onto master, skipping its version bumps and commits with a
    `Maintenance-only: <why>` line. A pick that doesn't apply leaves a warning to port it by
    hand. The workflow token opens it, so push a commit (or close and reopen) to run its CI.
- pushes `next-<version>`, adding `website/versionCurrent.json` to master. Merge its PR to switch
  the docs over.

The branch adds a workflow, so it's pushed with your credentials: the Actions token can't. Set up
its branch protection the way master's is.

## Working on it

Open fixes, for packages or docs, as PRs against `<version>.x`, with a changeset as usual. Its
`release.yml` opens a Version Packages PR there; merging it publishes. Each merge is ported to master
by `maintenance.yml`, unless its commit message has a `Maintenance-only: <why>` line (for a fix
master doesn't need; keep it in the squash message when merging a PR). CircleCI, `release.yml` and
`site-preview.yml`'s PR build run on the branch: the other Actions workflows it has are from the
release it was cut from and run only for master.

### Website fixes

Site fixes go the other way too: the root serves this branch's site, so a fix to it merged on
master would never reach the root. While `website/versionCurrent.json` exists, master's
`website-port.yml` opens a PR to the branch cherry-picking each pushed commit whose files all sit
under `website/src/` or `website/static/`, except the editor types (generated from the packages)
and the demos' code (written against the version's API); a commit that also touches docs, the blog,
translations, configs or packages (all versioned) is skipped. Each pick gets a
`Maintenance-only: ported from master (<sha>)` line, so `maintenance.yml` doesn't port it back;
keep it in the squash message. A pick that doesn't apply leaves a warning to port it by hand.

The PR gets auto-merge, so it merges once the branch's required checks pass, and its merge rebuilds
the root through `maintenance.yml`. That needs the port app's token: pushes, PRs and merges made
with the workflow token start no workflows, so CI wouldn't run on the PR and the merge wouldn't
redeploy. To set it up, once per repository:

1. Create a GitHub App owned by the organization, with no webhook and repository permissions
   Contents and Pull requests (read and write), and install it on this repository.
2. Add its client ID as the `PORT_APP_CLIENT_ID` Actions variable and a private key as the
   `PORT_APP_PRIVATE_KEY` Actions secret.
3. Protect the branch the way master is, so the port waits for its checks.

Without the app, the workflow uses its own token: the PR runs no CI until a push (or close and
reopen), an unprotected branch merges it at once, and the workflow dispatches `site-preview.yml`
itself to rebuild the root.

Publish blog posts here too: the root's blog is this branch's, so a post runs the version that's
current when it's published, at the URL it keeps. A post about the next major stays a draft on
master until that release.

## When the next major ships

The release archives the current version's docs from its branch at `<version>.dataclient.io` and opens a PR
listing it, which also deletes `website/versionCurrent.json`. Once that merges, master serves the
root again. The branch can stay for later fixes: they publish under `latest-<version>`, and a docs
fix there reaches the archive by dispatching `docs-snapshot.yml` with the branch as `ref`.
