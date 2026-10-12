// The version under the navbar's logo, like react.dev's. build.sh copies it
// beside an old release's config, so it styles the logo itself rather than
// relying on that release's components or CSS.
export const VERSION_LABEL_ID = 'version-label';

/**
 * A head tag showing label (like v0.18, or next) under the navbar's 32px
 * logo, centered on it without moving it. Its padding widens the tap target
 * that opens versionMenu.client.ts's menu, which adds a caret there on hover or focus.
 */
export const versionLabel = (label: string) => ({
  tagName: 'style',
  attributes: { id: VERSION_LABEL_ID },
  innerHTML: `.navbar__brand { position: relative; } .navbar__brand::after { content: ${JSON.stringify(label)}; position: absolute; left: 16px; top: calc(50% + 9px); padding: 4px 18px; transform: translateX(-50%); font-size: 0.625rem; line-height: 1; white-space: nowrap; opacity: 0.7; }`,
});
