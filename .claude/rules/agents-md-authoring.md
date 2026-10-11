---
paths:
  - "**/AGENTS.md"
---
<!-- Generated from .cursor/rules/agents-md-authoring.mdc by `yarn build:agent-rules`. Edit the source. -->


# Authoring AGENTS.md

AGENTS.md is read into context every time an agent works in the package/directory. Every line costs tokens and competes with the conversation. Treat it like a SKILL.md.

## Default assumption

The agent is smart and will read the source. Only include what it cannot derive in seconds from `ls`, `Read`, or running tests.

## Include

- **Hard correctness constraints** consumers depend on (referential equality, identity-keyed caches, storage-shape-as-API). One line of statement + one line of consequence.
- **Non-obvious gotchas** with concrete numbers (e.g. "adding an optional field to `EntityPath` regressed `getSmallResponse` 5–10%").
- **APIs the agent must call** that aren't discoverable from types alone — pointer to function + one-line contract.
- **Workflow specifics** the agent will get wrong without help (test methodology, benchmark thermal-noise rules, build-artifact ordering).

## Exclude

- **Architecture overviews / file maps** — `Glob` and `Read` cover this.
- **Anything in a parent AGENTS.md** — root `AGENTS.md` is always loaded; do not restate Jest project names, build commands, file naming conventions, monorepo structure, etc. Reference the parent only when adding a *consequence* not in the parent.
- **Verbose motivation paragraphs** — state the constraint, not why constraints exist in general.
- **Code blocks that the agent can write itself** from a one-line rule.
- **Time-sensitive notes** ("as of 2024…", "the new design will…").

## Format

- Telegraphic bullets and short sentences. No preamble.
- Group by concern (Correctness / Performance / Workflow), not by file.
- Backtick file paths and API names.
- Target ≤100 lines for most packages; larger only with strong justification.

## Verification

Before saving, scan the parent (and root) `AGENTS.md` and remove any duplicate facts. If a section reads like a tutorial or general explanation, cut it.
