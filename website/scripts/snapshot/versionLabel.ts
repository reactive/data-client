// The version beside the navbar's logo, like react.dev's. build.sh copies it
// beside an old release's config, so it styles the logo itself rather than
// relying on that release's components or CSS.
export const VERSION_LABEL_ID = 'version-label';

/** A head tag showing label (like v0.18, or next) after the navbar's logo */
export const versionLabel = (label: string) => ({
  tagName: 'style',
  attributes: { id: VERSION_LABEL_ID },
  innerHTML: `.navbar__brand::after { content: ${JSON.stringify(label)}; margin-left: 0.5rem; font-size: 0.75rem; opacity: 0.7; }`,
});
