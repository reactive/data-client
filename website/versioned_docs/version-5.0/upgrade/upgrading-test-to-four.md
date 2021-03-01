---
title: Upgrading @rest-hooks/test to 4
id: version-5.0-upgrading-test-to-four
original_id: upgrading-test-to-four
---

## Breaking Changes

- Requires node 10+
- No nested exports - only allowed usage:
  - `import { /* something */ } from '@rest-hooks/test';`
  - `import packageJson from '@rest-hooks/test/package.json';`

## Guide

1) Ensure you are using at least node version 10 or above

2) Search for `'@rest-hooks/test/` to find any imports
  that import from nested members.
