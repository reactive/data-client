// The version under the navbar's logo, like react.dev's. build.sh copies it
// beside an old release's config, so it styles the logo itself rather than
// relying on that release's components or CSS.
export const VERSION_LABEL_ID = 'version-label';

/**
 * A head tag showing label (like v0.18, or next) under the navbar's 32px logo,
 * positioned absolutely so the logo doesn't move: centered on it, its text
 * 3px above the logo's bottom edge (top 50% + 9px, plus 4px of padding) so it
 * sits just under it. The padding widens the tap target that opens
 * versionMenu.client.ts's menu, and the right side's holds a 6x4px caret (a
 * conic-gradient, so no font or image); the left side's matches so the text
 * stays centered on the logo.
 */
export const versionLabel = (label: string) => ({
  tagName: 'style',
  attributes: { id: VERSION_LABEL_ID },
  innerHTML: `.navbar__brand { position: relative; } .navbar__brand::after { content: ${JSON.stringify(label)}; position: absolute; left: 16px; top: calc(50% + 9px); padding: 4px 18px; transform: translateX(-50%); background: conic-gradient(from -37deg at 50% 100%, currentColor 74deg, transparent 0) right 8px center / 6px 4px no-repeat; font-size: 0.625rem; line-height: 1; white-space: nowrap; opacity: 0.7; }`,
});
