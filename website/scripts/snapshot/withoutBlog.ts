// A site whose blog is served by another one: an archive (the latest site's
// blog) or, while master is the next major, the current version's root (the
// blog at /next/). archive.client.ts sends its in-app /blog links to blogUrl,
// and vercel.json its page loads. Copied beside an old release's config by
// build.sh, so it reads only fields every release's config has.
type SiteConfig = {
  clientModules?: string[];
  presets?: unknown[];
  plugins?: unknown[];
  customFields?: Record<string, unknown>;
};

// blogUrl: the blog's path, with its locale
export default function withoutBlog<C extends SiteConfig>(
  config: C,
  blogUrl: string,
): C {
  return {
    ...config,
    customFields: { ...config.customFields, blogUrl },
    // Docusaurus can't ignore only the blog's links, so this ignores every
    // broken link. Master's builds keep the blog and still check them all;
    // releases were checked when they shipped.
    onBrokenLinks: 'ignore',
    clientModules: [
      ...(config.clientModules ?? []),
      require.resolve('./archive.client'),
    ],
    presets: config.presets?.map(preset =>
      Array.isArray(preset) && preset[0] === '@docusaurus/preset-classic' ?
        [preset[0], { ...preset[1], blog: false }]
      : preset,
    ),
    // Redirects to a post would fail the build without the blog
    plugins: config.plugins?.map(plugin =>
      (
        Array.isArray(plugin) &&
        plugin[0] === '@docusaurus/plugin-client-redirects'
      ) ?
        [
          plugin[0],
          {
            ...plugin[1],
            redirects: plugin[1].redirects?.filter(
              ({ to }: { to: string }) => !to.startsWith('/blog'),
            ),
          },
        ]
      : plugin,
    ),
  };
}
