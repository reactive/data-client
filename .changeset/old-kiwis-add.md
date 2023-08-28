---
'@data-client/react': minor
'@data-client/core': minor
---

Remove all 'receive' action names (use 'set' instead)

BREAKING CHANGE:
- remove ReceiveAction
- ReceiveTypes -> SetTypes
- remove Controller.receive Controller.receiveError
- NetworkManager.handleReceive -> handleSet