---
paths:
  - "packages/**"
  - ".changeset/**"
  - "plans/next-breaking-release.md"
---
<!-- Generated from .cursor/rules/breaking-changes.mdc by `yarn build:agent-rules`. Edit the source. -->


# Breaking Change Strategy

Get users the fix now with a clean upgrade path; batch the actual break into a later release.

## Before shipping a change that could break

Check both:
- **User code**: subclasses, overrides, explicit annotations, and classes implementing exported interfaces.
- **Mixed versions**: `@data-client/rest`/`endpoint`/`graphql` aren't dependencies of `react`/`vue`/`core`, so users can pair a newer client with an older endpoint (and vice versa). Type checks in core against endpoint types must still accept older endpoint versions.

Requiring a matching version for a feature that is new in the same release is not breaking.

## When it would break

1. **Ship a compatible version**: a shim that keeps old code compiling and working (e.g. method-syntax declarations for parameter bivariance, a loose structural type instead of the strict interface, a deprecated alias).
2. **Prepare users**: in the changeset and the release's draft blog post, recommend the future-proof form now with a code example, so the later break is a no-op for them.
3. **Track the cleanup**: add an entry to [plans/next-breaking-release.md](../../plans/next-breaking-release.md) naming the shim to remove, what it breaks, and the migration.

Mark a change `BREAKING` (minor bump while under 1.0) only when no compatible version is reasonable. When a release is already breaking, work through `plans/next-breaking-release.md`, move each finished item into that release's blog migration guide, and delete it from the plan.

## Agents trained on the old behavior

Agents write the old behavior by default, and finding out from a type error or wrong result wastes tokens, so a breaking change (or changed default) must teach the new way before they write code:

- **Skills lead with the new form**: update every `.agents/skills` example and statement the change affects, including facts derived from the old behavior that never name the changed API (defaults, "returns undefined so check for it", "you don't need X"). State the new form as the default, not as a fix after an error.
- **Agent impact review**: once the change, changeset, docs and skills are drafted, run [agent-impact-review.md](../../.agents/skills/changeset/agent-impact-review.md) on a fast subagent (Haiku in Claude Code, the fastest model in Cursor or Codex), verify each finding, and apply the real ones.
- **Breaking-change evals**: add at least one eval per breaking changeset to the evals of the skill an agent would use (`.agents/skills/<skill>/evals/evals.json`), with `"changeset": "<changeset file name without .md>"`. Its prompt is a task agents really get, that never mentions the change, and its assertions fail on the old habit. When the review finds no such task (e.g. a dropped TypeScript version no agent would install), give the reason in [no-agent-impact.json](../../.agents/skills/changeset/no-agent-impact.json) instead of inventing a scenario. Run it on a fresh fast subagent given only the skill, not the diff: it must pass on the first try without running code. If it fails, fix the skill, not the eval.

`scripts/breaking-evals.mjs` (pre-push hook and the `agent-rules` CI check) fails while a pending `BREAKING` changeset has neither.
