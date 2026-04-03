---
name: changeset
description: Create user-focused changesets (changelog entries) for semver bumps, release notes, breaking changes, and docs; prefer impact and code examples over implementation detail
disable-model-invocation: true
---

# Create Changesets

## Overview
Generate changesets, update documentation, draft blog entries, and update skills for user-facing changes.

## Steps
1. **Analyze changes**
   - Compare current branch to `master` to identify modified packages
   - Group changes by impact type (feature, fix, breaking)
   - Identify transitive dependencies that expose the change
   - Check for modified skills in `.cursor/skills/` and `packages/*/.cursor/skills/`

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
   - When writing the markdown body, follow **Changeset body quality** below (user-visible outcome, code examples when helpful, no internal implementation narrative)

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

6. **Update skills**
   - If code changes affect workflows described in existing skills, update those skills to match
   - If new APIs or patterns are introduced that agents should know about, add them to the relevant skill
   - Skill changes don't need changesets — they are development tooling, not published packages

## Writing perspective
All user-facing text (changesets, blog entries, docs) should be written from the library user's point of view. Answer: **what did the user see go wrong, and what works for them now?** Avoid internal names (conditional types, branch names, helper types like `SoftPathArgs`, file paths, PR numbers) unless the audience is maintainers reading a technical appendix — changeset bodies are for consumers reading the changelog.

## Changeset body quality
1. **Lead with impact** — One short title line, then 1–3 sentences on behavior: errors gone, typings improved, new capability, migration note.
2. **User vocabulary** — Name public APIs (`RestEndpoint`, `resource()`, hook names). Do not explain how the fix was implemented.
3. **When to add code** — Prefer a minimal example when the change is TypeScript-only or subtle: show the pattern that was broken and now works (subclass, `extend`, option object). Skip examples for trivial renames or obvious one-line fixes.
4. **Examples** — Realistic imports and types; omit unrelated options. For fixes, you can show one “now types correctly” snippet instead of a long before/after if the before state was “TypeScript error on …”.
5. **Breaking changes** — Still say what the user must do; use Before/After sections with code when the migration is non-obvious.

## Changeset format
- **First line**: Action verb ("Add", "Fix", "Update", "Remove")
- **Breaking**: Prefix with `BREAKING CHANGE:` or `BREAKING:`
- **Body**: User outcome first; implementation almost never belongs here
- **New exports**: Use "New exports:" with a bullet list

## Code examples in changesets
- **Fixes**: Optional `// Before:` / `// After:` comments in one block, or two small blocks — keep them copy-paste plausible
- **Breaking changes**: Use `#### Before` and `#### After` headers with complete snippets
- **Multiple scenarios**: Short intro line per scenario, or separate fenced blocks with a one-line label above each

## Markdown Formatting
Follow `@.cursor/rules/markdown-formatting.mdc` for all markdown content.
