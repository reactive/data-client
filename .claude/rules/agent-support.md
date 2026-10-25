---
paths:
  - ".claude-plugin/**"
  - ".cursor-plugin/**"
  - ".agents/skills/.cursor-plugin/**"
  - "packages/core/agents/**"
  - "docs/core/getting-started/agent-skills.md"
  - "website/src/components/SkillTabs.tsx"
---
<!-- Generated from .cursor/rules/agent-support.mdc by `yarn build:agent-rules`. Edit the source. -->


# Agent support priorities

Support agent hosts in this order:

1. **Claude Code** (CLI, desktop, projects) and **Cursor** (IDE, CLI, cloud agents, projects): must work out of the box.
2. **Codex**: supported; fix gaps when found.
3. **Everything else**: best effort through the shared `.agents/skills` and `AGENTS.md` conventions; never at tier 1's expense.
