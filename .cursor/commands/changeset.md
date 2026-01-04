# Create Changesets

## Overview
Generate release notes for user-facing changes in published packages.

## Steps
1. **Analyze changes**
   - Compare current branch to `master` to identify modified packages
   - Group changes by impact type (feature, fix, breaking)
   - Identify transitive dependencies that expose the change

2. **Determine affected packages**
   - Include directly modified packages
   - Add transitive dependents when interfaces/behaviors are exposed:
     - `@data-client/endpoint` → also select `@data-client/rest`, `@data-client/graphql`
     - `@data-client/core` or `@data-client/normalizr` → also select `@data-client/react`, `@data-client/vue`

3. **Run changesets**
   - Run `yarn changeset` once per distinct change
   - Select all affected packages (direct + transitive)
   - Choose appropriate version bump (patch/minor/major)
     - For packages under 1.0, use minor for breaking changes

## Changeset Format
- **First line**: Action verb ("Add", "Fix", "Update", "Remove")
- **Breaking**: Prefix with `BREAKING CHANGE:` or `BREAKING:`
- **Body**: 1–3 lines describing outcome, not implementation
- **New exports**: Use "New exports:" with bullet list
- **Documentation links**: Link concepts that have doc pages in @docs (e.g., `[Union](https://dataclient.io/rest/api/Union)`)

## Code Examples in Changesets
- Fixes: `// Before: ... ❌` `// After: ... ✓`
- Breaking changes: Use `#### Before` and `#### After` headers
- Multiple use cases: Separate with brief labels
