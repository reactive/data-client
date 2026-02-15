# Contributing to Reactive Data Client

## Getting Started

Use the `/initialize` Cursor skill to set up your development environment.

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

* Ensure your [commit messages are well-written][2]. This can double as your
  pull request message, so it pays to take the time to write a clear message.

* Add tests for your feature. You should be able to look at other tests for
  examples. If you're unsure, don't hesitate to [open an issue][1] and ask!

* Add a changeset for user-facing changes in published packages:
  * Use the `/changeset` Cursor skill to generate changesets, update docs, and prepare a PR description.
  * If doing manually: run `yarn changeset` from repo root once per distinct change.

* Submit your pull request!

## Support Requests

Support is available in our [discord channel][3]

[1]: https://github.com/reactive/data-client/issues
[2]: https://medium.com/brigade-engineering/the-secrets-to-great-commit-messages-106fc0a92a25
[3]: https://discord.gg/9aTc42GXWR
[4]: https://github.com/reactive/data-client/discussions/new?category=ideas