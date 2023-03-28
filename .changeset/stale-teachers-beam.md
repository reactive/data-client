---
'@rest-hooks/legacy': major
'@rest-hooks/experimental': minor
'@rest-hooks/core': patch
'@rest-hooks/react': patch
'@rest-hooks/test': patch
---

- Core: Remove type dependency on React
- Test: add optional peerDep
- Legacy: @rest-hooks/endpoint added as peerDependency; useStatefulResource uses controller like useDLE
- Experimental: Import from correct packages
- React: Add ErrorTypes export
