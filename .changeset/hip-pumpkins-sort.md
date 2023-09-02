---
'@data-client/endpoint': patch
'@data-client/graphql': patch
'@data-client/rest': patch
---

Removed some forms of automatic entity validation

- Now allow missing schemas making it easier to declare partials
- Removed logic for certain keys found out of defaults

We are generally trying to be more lax and focus on catching
clearly wrong signals. A lot of help comes from network response
form detection.