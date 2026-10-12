// The version under the navbar's logo, like react.dev's. build.sh copies it
// beside an old release's config, so it styles the logo itself rather than
// relying on that release's components or CSS.
export const VERSION_LABEL_ID = 'version-label';

/**
 * A head tag showing label (like v0.18, or next) under the navbar's 32px logo,
 * positioned absolutely so the logo doesn't move: centered on it, just under
 * its bottom edge, with margin reset since the site's CSS margins the brand's
 * ::after
 */
export const versionLabel = (label: string) => ({
  tagName: 'style',
  attributes: { id: VERSION_LABEL_ID },
  innerHTML: `.navbar__brand { position: relative; } .navbar__brand::after { content: ${JSON.stringify(label)}; position: absolute; left: 16px; top: calc(50% + 13px); transform: translateX(-50%); margin: 0; font-size: 0.625rem; line-height: 1; white-space: nowrap; opacity: 0.7; }`,
});
