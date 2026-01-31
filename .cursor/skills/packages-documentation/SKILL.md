---
name: packages-documentation
description: Guidelines for writing and formatting documentation for public library interfaces in packages
license: Apache 2.0
---
# Package Documentation Writing Guidelines

This guide covers how to write and format documentation for public library interfaces.

## Documentation Structure

The `/docs` folder is organized by package:
- `docs/core/` - Documentation for `@data-client/core` and `@data-client/react`
- `docs/rest/` - Documentation for `@data-client/rest`
- `docs/graphql/` - Documentation for `@data-client/graphql`

Each package documentation has subdirectories:
- `api/` - API reference documentation (one file per public class/function/hook)
- `guides/` - How-to guides and tutorials
- `concepts/` - Conceptual documentation
- `getting-started/` - Getting started guides

## Documentation File Naming

API documentation files should match the exported name:
- `useSuspense.ts` → `docs/core/api/useSuspense.md`
- `RestEndpoint.js` → `docs/rest/api/RestEndpoint.md`
- `Controller.ts` → `docs/core/api/Controller.md`
- `Entity.ts` → `docs/rest/api/Entity.md` (or `docs/core/api/Entity.md`)

## Documentation Format

All API documentation files should include:

1. **Frontmatter** with metadata:
```markdown
---
title: API Name
sidebar_label: Display Name
---
```

2. **Description** - What the API does

3. **Usage examples** - Code examples showing how to use it

4. **Parameters/Options** - Document all parameters, options, and return types

5. **Type information** - TypeScript types and examples

6. **Related APIs** - Links to related documentation

## Finding the Right Documentation File

1. **Identify the package**: Check which package the code belongs to (`packages/core`, `packages/rest`, etc.)
2. **Check exports**: Look at the package's `index.ts` or main entry point to see what's exported
3. **Match the name**: Find the corresponding file in `docs/{package}/api/`
4. **Check guides**: If it's a workflow change, also check `docs/{package}/guides/`

## Examples

### Example 1: Adding a new hook
- **File**: `packages/react/src/hooks/useNewFeature.ts`
- **Action**: Create `docs/core/api/useNewFeature.md` with usage examples and API reference

### Example 2: Changing a method signature
- **File**: `packages/rest/src/RestEndpoint.js` (changing `extend()` method)
- **Action**: Update `docs/rest/api/RestEndpoint.md` with new signature, migration notes, and updated examples

### Example 3: Deprecating an API
- **File**: `packages/core/src/SomeClass.ts` (deprecating `oldMethod()`)
- **Action**: 
  - Update `docs/core/api/SomeClass.md` with deprecation notice
  - Document the replacement API
  - Add migration guide if needed

### Example 4: Adding a new option
- **File**: `packages/rest/src/RestEndpoint.js` (adding `newOption` parameter)
- **Action**: Update `docs/rest/api/RestEndpoint.md` to document the new option with examples

## Checklist

Before completing changes to public APIs in `/packages`:

- [ ] Identified all affected public APIs (exports from package entry points)
- [ ] Located or created corresponding documentation files in `/docs/{package}/api/`
- [ ] Updated API reference documentation with changes
- [ ] Added/updated code examples
- [ ] Updated related guides if workflow changed
- [ ] Added migration notes for breaking changes
- [ ] Updated TypeScript examples in documentation
- [ ] Verified documentation builds correctly (if applicable)

## Important Notes

- **Public APIs** are anything exported from the package's main entry point (typically `index.ts` or `src/index.ts`)
- **Internal/private APIs** (prefixed with `_`, not exported, or marked as `@internal`) don't require documentation updates
- When in doubt, **err on the side of documenting** - it's better to have extra documentation than missing documentation
- Documentation should be updated **in the same commit or PR** as the code changes
