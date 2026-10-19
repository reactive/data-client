---
paths:
  - "**/*.md"
  - "**/*.mdc"
  - "**/*.mdx"
---
<!-- Generated from .cursor/rules/markdown-formatting.mdc by `yarn build:agent-rules`. Edit the source. -->


# Markdown Formatting

## Documentation Links

Link API concepts that have corresponding doc pages:

- **External doc links**: `[Union](https://dataclient.io/rest/api/Union)`
- **Internal doc links**: Use site paths like `[Controller](/docs/api/Controller)` or `[Entity](/rest/api/Entity)`
- **Package links**: `[@data-client/rest](www.npmjs.com/package/@data-client/rest)`

## Repository Links

- **PR links**: `[#1234](https://github.com/reactive/data-client/pull/1234)`
- **Commit links**: ``[`abc123`](https://github.com/reactive/data-client/commit/abc123)``

## Code References

- Use backticks for inline code: function names, class names, file paths, package names
- Use fenced code blocks with language tags for multi-line code examples

## Terminal Commands vs Agent Prompts

Readers must see at a glance whether a snippet goes in their terminal or their coding agent's chat. The fence language decides it, on the site and in llms.txt:

- **Terminal**: ` ```bash ` (also `sh`/`shell`). The site puts an uncopied `$` before each command and explains it on hover or tap ("Run in your terminal"), so don't type `$` yourself or add `title="bash"`. Comments (`#`) and `\` continuation lines get no `$`.
- **Agent chat**: ` ```prompt ` for anything typed into the agent: prompts, skills (`/data-client-setup`), and agent slash commands (Cursor's `/add-plugin`). The site renders it as the sparkle chip (`AgentPrompt`), which copies on click and explains itself on hover or tap. Add `title="Cursor"` when only one agent understands it. Never put agent input in a `bash` block; agent CLIs run from a shell (`claude plugin install`, `codex plugin add`) stay `bash`.
- **Framed**, where the page has room (getting-started steps that alternate terminal and agent): add `framed` to the fence meta (` ```bash framed `, ` ```prompt framed `) or the `framed` prop (`<SkillTabs framed />`, `<AgentPrompt framed />`). Shell blocks get a "Terminal" header and prompts a full-width chat box with an "Agent chat" header. Elsewhere leave it off.
- **Prose** says where before the block ("in your agent's chat:"), and never leaves a skill or slash command inline as the only instruction, like "Then run skill `/data-client-setup`".
- **Components**: `<CodeBlock className="language-bash">` for shell (PkgTabs, SkillTabs); `<AgentPrompt prompt="..." title="Cursor" />` for agent input, such as an agent's tab in SkillTabs.
- **READMEs** use the same fences; GitHub and npm show ` ```prompt ` unhighlighted, so the lead-in sentence carries the meaning there.
