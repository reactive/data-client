# After the next release

Edits that can only land once the `@data-client/*` packages carrying them are published, such as standalone examples, which install from npm (see "Release bumps" in `examples/AGENTS.md`). Make each in the PR that bumps those examples to the release, then delete its entry. Renovate's grouped "all non-major dependencies" PR doesn't include them, so push them onto that PR before merging it.

Each entry names the changeset, the files, and the new form to write.
