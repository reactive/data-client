---
'@data-client/react': patch
---

React Native: `DataProvider` tells the memo which store version committed

This keeps committed results cached on React Native while transitions and optimistic updates render other versions. Web builds do not change.
