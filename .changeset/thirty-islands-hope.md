---
'@data-client/endpoint': patch
---

Fix: schema.All() polymorphic handling of Invalidated entities

In case an Entity is invalidated, schema.All will continue to properly
filter it out of its list.