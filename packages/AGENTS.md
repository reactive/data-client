## Changesets (release notes)

- **When to add**: Any user-facing change in a published package (`packages/*`) should include a changeset.
- **Command**: Run `yarn changeset` from repo root (run it once per distinct change).
- **Terse changelog text**:
  - **Keep it short**: 1–3 short lines describing the outcome (not implementation details).
  - **Minimal examples only**: If an example helps, prefer a tiny snippet (typically import + 1 call). Avoid long blocks.
  - **Breaking changes**: Include a tiny migration example using:
    - `#### before`
    - `#### after`
- **Split changesets by impact**:
  - If **multiple packages are affected in different ways**, create **separate changesets** so each package’s changelog is focused.
  - If the same change applies uniformly to multiple packages, a single changeset is fine.
