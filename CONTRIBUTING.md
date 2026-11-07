# Contributing to Reactive Data Client

## Getting Started

Use the `/initialize` skill to set up your development environment.

## Bug Reports

* Ensure your issue [has not already been reported][1]. It may already be fixed!
* Include the steps you carried out to produce the problem.
* Include the behavior you observed along with the behavior you expected, and
  why you expected it.
* Include any relevant stack traces or debugging output.
* Ensure you captured relevant [network inspector](https://developer.chrome.com/docs/devtools/network/) screenshots
* Ensure [Browser Devtools](https://dataclient.io/docs/getting-started/debugging) screenshots or state and action dumps

## Feature Requests

We welcome feedback with or without pull requests. If you have an idea for how
to improve the project, great! All we ask is that you take the time to write a
clear and concise explanation of what need you are trying to solve. If you have
thoughts on _how_ it can be solved, include those too!

The best way to see a feature added, however, is to submit a pull request.

If your idea requires design considerations, it's best to [start a discussion][4].

## Pull Requests

* Before creating your pull request, it's usually worth asking if the code
  you're planning on writing will actually be considered for merging. You can
  do this by [opening an issue][1] and asking. It may also help give the
  maintainers context for when the time comes to review your code.

* Ensure your [commit messages are well-written][2]. They are source material
  for the pull request description.

* Fill in the [pull request template](.github/PULL_REQUEST_TEMPLATE.md). Its
  comments explain what each section needs.

* Add tests for your feature. You should be able to look at other tests for
  examples. If you're unsure, don't hesitate to [open an issue][1] and ask!
  When you change code under `packages/`, run `yarn test:coverage` before you
  open the PR and make sure coverage doesn't decrease.

* Add a changeset for user-facing changes in published packages:
  * Use the `/changeset` skill to generate changesets and update docs.
  * If doing manually: run `yarn changeset` from repo root once per distinct change.

* If you changed package types, docs or skills, regenerate the committed
  outputs: merge master, run `yarn copy:websitetypes` and `yarn build:skills`,
  and commit the result. The `regenerate` check fails until they're up to
  date.

* Submit your pull request!

## Releasing (maintainers)

`.github/workflows/release.yml` publishes every release to npm. What starts it
decides the kind:

* **Stable:** merging changesets to master opens or updates the "Version
  Packages" PR. Merging that PR publishes under npm's `latest` tag and creates
  the GitHub releases.
* **Beta:** go to Actions, select Release, then Run workflow, and pick the branch
  (usually master). It publishes the pending changesets as a snapshot, like
  `0.19.0-beta-<datetime>-<sha>`, under npm's `beta` tag. It commits nothing,
  and fails if no changesets are pending. Install it with
  `npm install @data-client/react@beta`.

npm trusts only `release.yml` to publish (trusted publishing, with provenance),
so never publish from another workflow file. A maintenance branch publishes
through its own copy of `release.yml`, under `latest-<version>` once a newer
major ships; see [scripts/maintenance/README.md](scripts/maintenance/README.md).

## Support Requests

Support is available in our [discord channel][3]

[1]: https://github.com/reactive/data-client/issues
[2]: https://medium.com/brigade-engineering/the-secrets-to-great-commit-messages-106fc0a92a25
[3]: https://discord.gg/9aTc42GXWR
[4]: https://github.com/reactive/data-client/discussions/new?category=ideas