/* global module, require */
/**
 * Docusaurus writes one sitemap.xml per locale and never links them. Crawlers
 * only read the host's /robots.txt, which is this build's default-locale copy,
 * so that file lists every locale's sitemap with an absolute URL.
 *
 * URLs follow siteConfig.url and baseUrl: a root build lists
 * https://dataclient.io/<locale>/sitemap.xml, a /next/ build lists its own,
 * and an archived host lists that host. Other locales' robots.txt copies are
 * not the host file, so they are left alone.
 */
const fs = require('fs/promises');
const path = require('path');

/** Absolute sitemap URL for each locale, default locale first as given */
function sitemapUrls({ url, baseUrl, locales, defaultLocale }) {
  const root = `${url.replace(/\/+$/, '')}${baseUrl}`.replace(/\/+$/, '');
  return locales.map(
    locale =>
      `${locale === defaultLocale ? root : `${root}/${locale}`}/sitemap.xml`,
  );
}

/** `body` with any Sitemap lines replaced by `urls` */
function robotsWithSitemaps(body, urls) {
  const kept = body
    .split('\n')
    .filter(line => !/^\s*Sitemap:/i.test(line))
    .join('\n')
    .trimEnd();
  const lines = urls.map(sitemapUrl => `Sitemap: ${sitemapUrl}`).join('\n');
  return kept ? `${kept}\n\n${lines}\n` : `${lines}\n`;
}

module.exports = function sitemapRobotsPlugin(context) {
  return {
    name: 'sitemap-robots',
    async postBuild({ outDir, siteConfig }) {
      const { currentLocale, defaultLocale, locales } = context.i18n;
      if (currentLocale !== defaultLocale || siteConfig.noIndex) return;
      const robotsPath = path.join(outDir, 'robots.txt');
      let body = '';
      try {
        body = await fs.readFile(robotsPath, 'utf8');
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
      await fs.writeFile(
        robotsPath,
        robotsWithSitemaps(
          body,
          sitemapUrls({
            url: siteConfig.url,
            baseUrl: siteConfig.baseUrl,
            locales,
            defaultLocale,
          }),
        ),
      );
    },
  };
};

module.exports.sitemapUrls = sitemapUrls;
module.exports.robotsWithSitemaps = robotsWithSitemaps;
