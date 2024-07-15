---
'@data-client/endpoint': patch
'@data-client/rest': patch
'@data-client/graphql': patch
---

Collections now work with polymorhpic schemas like Union

Collections.key on polymorphic types lists their possible Entity keys: `[PushEvent;PullRequestEvent]`