# Create Changesets and PR

## Overview
Generate changesets, update documentation, draft blog entries, and prepare PR description for user-facing changes.

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

4. **Update documentation**
   - Update primary docs in `docs/` for any changed public APIs
   - Search for all usages of changed APIs across `docs/`, `packages/*/README.md`, and root `README.md`
   - Update all found references to reflect new behavior, signatures, or deprecations
   - For new exports: add to relevant API reference pages

5. **Update release blog**
   - Find the latest draft blog post in `website/blog/` (has `draft: true` in frontmatter)
   - Add the change following `@website/blog/.cursor/rules/blog-posts.mdc`:
     - Place in appropriate conceptual category section
     - Include code example if applicable
     - Link to PR/commit and relevant docs
     - For breaking changes: add to summary's Breaking Changes section with anchor link

6. **Generate PR description**
   - Output a PR description for the user to copy/paste using @.github/PULL_REQUEST_TEMPLATE.md format
   - Fill in the sections based on the analyzed changes
   - Link related issues if known
   - Summarize motivation from changeset descriptions
   - Describe solution at a high level first (not implementation details)
   - Include any mermaid diagrams that might help convey key concepts, especially if one was present in a plan.md
   - Drop 'Open questions' section if no relevant content
   - Keep in mind you are a chat agent talking in markdown, so cannot start a markdown block without escaping the contents.

## Changeset Format
- **First line**: Action verb ("Add", "Fix", "Update", "Remove")
- **Breaking**: Prefix with `BREAKING CHANGE:` or `BREAKING:`
- **Body**: 1–3 lines describing outcome, not implementation
- **New exports**: Use "New exports:" with bullet list

## Code Examples in Changesets
- Fixes: `// Before: ... ❌` `// After: ... ✓`
- Breaking changes: Use `#### Before` and `#### After` headers
- Multiple use cases: Separate with brief labels

## Markdown Formatting
Follow `@.cursor/rules/markdown-formatting.mdc` for all markdown content including the PR desc.
