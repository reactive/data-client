# Data Client projects

Read this only when your instructions tell you to: you are an agent in a long-running, multi-agent
project (a Claude project or a Cursor Project) that works on this repo. Plain agent sessions in this
repo follow `AGENTS.md` alone; nothing here applies to them.

Root `AGENTS.md`, the repo's rules and `.agents/skills` still apply.
This file adds how project agents run work end to end. Your project's own instructions win where they
differ. Where this file and `AGENTS.md` or a rule differ, the repo wins; tell the coordinator so one
gets fixed. Re-read this file when the coordinator says it changed. Coordinators setting up a new
project follow `.agents/projects/setup.md`.

## Roles

| Term here | Claude project | Cursor Project |
| --- | --- | --- |
| Coordinator | project chat session | coordinator agent |
| Worker | thread | delegated agent |
| Tell the coordinator | `message_coordinator` | report back in your hand-off |
| Project memory | project memory folder | project shared files |
| Watch a PR | `subscribe_pr_activity` | coordinator PR subscription (unverified) |
| Strong model | latest Fable (`fable`) | strongest model offered |
| Fast model | Haiku (`haiku`) | fastest model offered |
| Mid model | Sonnet (`sonnet`) | a mid-tier model |

## Tools

Every project environment should have user-kit's skills and workflows. If one you need is missing,
tell the coordinator instead of skipping the step.

| Tool | Claude project | Cursor Project |
| --- | --- | --- |
| user-kit skill | skill `user-kit:<name>` | `/<name>` (no plugin prefix) |
| user-kit workflow | Workflow tool, `user-kit:<name>` | none: run its steps as subagents |

## Models

- Default for advisors and subagents: strong model. Exceptions:
- Fast model: post-push reviews, V8 measurement (`.cursor/rules/v8-optimization.mdc`).
- Mid model: simple merge conflicts.
- Skill evals: mid model at medium effort for the runs under test, strong model to
  grade. Breaking-change evals follow `.cursor/rules/breaking-changes.mdc` instead.

## PR lifecycle

1. Branch from `master`. Stack a PR on another only when it needs that PR's unmerged code; then rebase
   your own branches (`--force-with-lease`) and tell the person to click GitHub's "turn into a stack"
   banner (no auto-merge on stacks). A website PR never stacks: the docs preview runs only for
   PRs based on `master`, so include the dependency's commits and say "merge #N first".
   Rebasing applies only to your own stacked branches; update any other PR from its base with a merge
   commit, because force-pushing a shared branch drops others' commits.
2. Never push throwaway branches (workers cannot delete remote branches).
3. Open the PR and watch it right away. Mark it ready for review once validated; bugbot skips drafts.
4. Address every bugbot comment and every comment from the "Staff" reviewer (posted on ntucker's
   account). Verify each claim against the code first; push back on the PR when it is wrong.
5. Keep the PR mergeable, but act only on a real conflict with its base. Simple conflicts (lockfiles,
   changelogs, adjacent edits, generated files): hand to a mid-model subagent with branch, base and how
   to validate. Logic conflicts: resolve yourself.
6. After every push, run the post-push review. With the Workflow tool, run workflow
   `user-kit:post-push-review` with
   `{ range: "<sha before push>..HEAD", goals: "<project goal>", repo: "<checkout path>" }`
   (`repo` when data-client is not the working directory). Without the Workflow tool (Cursor, or any
   agent lacking it), run fast-model subagents in parallel for goals, repo rules, engineering,
   adversarial, reuse and React data flow. Verify each finding; fix real ones, reject the rest with a
   reason. Do not launch them while the person is actively writing in your thread: subagents can
   pick up the message and reply in your name.
7. Once the change is verified correct, run skill "simplify" (Cursor: the same review by hand),
   verify its findings, and push the cleanups (a push, so step 6 runs again) before calling the PR done.
8. A worker's PR ends when it merges, not when it is handed over.

## PR descriptions

- Fill `.github/PULL_REQUEST_TEMPLATE.md` as its comments instruct, and include the changesets'
  before/after code. For the steps, read `.agents/skills/pr/SKILL.md` by path: it is user-invoked
  only, so Claude Code's Skill tool refuses it.
- Link Linear tickets by full URL; a bare "Fixes REACT-N" links nowhere on GitHub.
- Benchmark and typeperf results go in a master / PR / change table naming the unit, never prose.
- If the PR changes `website/` or `docs/`, give the preview
  `https://docs-site-pr-<N>-data-client.vercel.app` right after the PR link, plus direct links to the
  changed pages (master docs are under `/next/`). If CI's docs deploy check posts no preview, say so
  instead. If the PR changes neither, say "No website changes".

## Follow-ups

Never leave one dangling. Fold it into the PR if it improves it, reject it with a stated reason, or
hand it on:

- Project-scope work: tell the coordinator, with a self-contained brief. The coordinator queues it.
- Library, core or CI work outside the project: a Linear issue (team Reactive, project Reactive Data
  Client), self-contained, naming platforms and protocols in the body. File it yourself only when the
  person asked in their own words; otherwise draft it and hand it to the coordinator.
- The same holds for any other write outside the repo and your PR (GitHub comments elsewhere, Slack).

## Talking to the person

- Decision asks: context, options, and a recommendation, inline.
- Status: check live PR state; list only open PRs.
- A blocked action: name exactly what blocked it (session safety check, connector sign-in, tool
  setting, GitHub app access, network policy) and the one fix. Never just "permission denied".
- Explanations: about 50% ASD-STE100 (short sentences, one fact each, active voice); keep repo terms.

## Testing against another app

Integration projects test unreleased packages in a real app: `yarn pack -o` each package the app needs
plus its data-client dependencies (e.g. normalizr, core, use-enhanced-reducer, endpoint, rest, react;
packages with skills ship them on `prepack`), then `file:` dependencies and npm `overrides` in the
app. Tell any agent working in that app not to reinstall them.

## Person's machine

Work needing the person's PC (GPU, device or simulator, video renders, Linux Firefox, local tools) runs
there, in WSL: Claude threads start a Remote Control session (`start_remote_control`); in Cursor, ask
the coordinator for a local agent.

## Videos

Video source lives in `reactive/data-client-videos` (read its `AGENTS.md`). This repo gets only final
renders: AV1 WebM plus an H.264 MP4 fallback.

## Keeping this file current

Every project improves this file; don't let a shared rule live in one project's memory.

- When the person sets or corrects a process rule (PRs, reviews, models, reporting, follow-ups), ask:
  would every data-client project want it? Yes: save it to project memory now, and tell the coordinator
  to add it here. No (it serves this project's goal or app): project memory only.
- When a rule here is wrong or out of date, tell the coordinator the same way.
- The coordinator batches these into one small PR to `PROJECTS.md` (or `.agents/projects/`), tagged
  `internal:`, for the person to review, then deletes the memories it replaced.
- Rules with at most a one-clause reason; history stays in memory. Keep this file under about 2k
  tokens; move a section only some tasks need to `.agents/projects/<topic>.md`, with a one-line
  pointer here.
