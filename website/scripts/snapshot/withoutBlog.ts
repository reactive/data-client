// An archive leaves the blog to the root's: vercel.json and archive.client.ts
// send its /blog links there, so they only look broken here. build.sh copies
// it beside an old release's config, so it reads only fields every release's
// config has.
type SiteConfig = {
  clientModules?: string[];
  presets?: unknown[];
  plugins?: unknown[];
};

export default function withoutBlog<C extends SiteConfig>(config: C): C {
  return {
    ...config,
    // Docusaurus can't ignore only the blog's links, so this ignores every
    // broken link; archives were checked when they released.
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
