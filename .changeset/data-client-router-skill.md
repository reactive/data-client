---
'@data-client/core': patch
---

Ship a `data-client` agent skill that routes "use Data Client" to setup

Asking your coding agent to use Data Client in an app without it now reaches the setup skill, which installs the packages and adds the provider. In apps that have it, the skill points your agent at the skill for the task.
