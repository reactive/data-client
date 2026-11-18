// An archive serves the posts published while it was the latest version, so
// their docs links and playgrounds match them, but only the latest site has
// the blog's lists and feeds: postSite.client.ts sends in-app routes to any
// other blog page there (blogHome), as vercel.json does page loads. build.sh
// copies it beside an old release's config, so it reads only fields every
// release's config has.
type SiteConfig = {
  url: string;
  clientModules?: string[];
  customFields?: Record<string, unknown>;
  presets?: unknown[];
};

// The blog's lists below a locale's root, which only the latest site serves
const LISTS = [
  'blog',
  'blog/page/**',
  'blog/tags/**',
  'blog/archive',
  'blog/authors/**',
];

export default function archiveBlog<C extends SiteConfig>(config: C): C {
  return {
    ...config,
    clientModules: [
      ...(config.clientModules ?? []),
      require.resolve('./postSite.client'),
    ],
    // every release's config has the production url
    customFields: { ...config.customFields, blogHome: config.url },
    presets: config.presets?.map(preset => {
      if (!Array.isArray(preset) || preset[0] !== '@docusaurus/preset-classic')
        return preset;
      const options = preset[1] ?? {};
      return [
        preset[0],
        {
          ...options,
          blog: options.blog && {
            ...options.blog,
            feedOptions: { type: null },
          },
          sitemap: {
            ...options.sitemap,
            ignorePatterns: [
              ...(options.sitemap?.ignorePatterns ?? []),
              ...LISTS.flatMap(list => [`/${list}`, `/*/${list}`]),
            ],
          },
        },
      ];
    }),
  };
}
