# Agent impact review

Prompt for a fast subagent (Claude Code: Agent tool, `model: "haiku"`; Cursor or Codex: a subagent
on their fastest model) that reviews a breaking change for agents trained on the old behavior. Run it after the change, its
changeset, docs and skill edits are drafted, so it double-checks them. Fill in `<changeset>`, paste
everything below the line as the prompt, then verify each finding yourself before acting on it.

---

You are reviewing a breaking change to the `@data-client` libraries in this repository for its impact on
coding agents. Agents were trained on the old behavior, and they read this repo's skills
(`.agents/skills/*/SKILL.md` and `references/`) and the docs (`docs/`, rendered at dataclient.io) to work
with the library. You only read and report; do not edit files or post messages to anyone.

The change: `.changeset/<changeset>.md`. Read it, then read the code change, committed or not, with
`git diff $(git merge-base origin/master HEAD) -- packages` plus any new files `git status --short packages`
lists, to see exactly what behaved differently before.

Report, with a `file:line` for every claim:

1. **Old habits**: what an agent that knows the previous behavior will write or assume now, and what goes
   wrong (type error, runtime error, silently wrong data, extra network calls or renders). Include habits
   one step removed from the API that changed: patterns built on the old behavior, such as a workaround
   the change makes unnecessary or a guard that now never runs.
2. **Stale direct mentions**: every place in `.agents/skills/`, `docs/`, `packages/*/README.md`,
   `README.md`, `examples/` and `website/blog/` (draft posts only) that still shows or describes the old
   behavior. Grep for the changed names, options and return values. A generated reference
   (`references/*.md` with a generated header) is fixed in the `docs/` page it comes from, so name that page.
3. **Contradicted derived facts**: statements that never name the changed API but are true only because
   of the old behavior. Examples: "X returns undefined, so check for it" after X starts throwing; a table
   of defaults; "you don't need Y because Z does it"; ordering, timing or re-render claims; a test recipe
   that relied on the old behavior; two skills or docs that now disagree with each other. Read the
   `SKILL.md` of every skill whose `description` covers the area, not only files that grep matches.
4. **Skill updates**: for each skill whose agents would hit an old habit, the smallest edit to its
   `SKILL.md` that makes the right way the first thing an agent writes (not a note to fix it after an
   error). Only what an agent needs to get this right up front; no history of the change.
5. **Eval prompts**: one or two realistic tasks, in the style of `.agents/skills/*/evals/evals.json`, that
   an agent relying on the old behavior would get wrong. Each has a prompt that never mentions the change
   or the old behavior, and assertions that fail on the old habit and pass on the new form. Only propose
   tasks agents are actually given; if none would hit the old behavior, say "no realistic task" and why.

Say "none found" for a section with nothing in it. Keep each finding to a line or two.
