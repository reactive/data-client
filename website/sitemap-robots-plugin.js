/* global module, require */
/**
 * Docusaurus writes one sitemap.xml per locale and never links them. Crawlers
 * only read the host's /robots.txt, which is this build's default-locale copy,
 * so that file lists every locale's sitemap.
 *
 * Each URL is the locale's own `url` + `baseUrl` (already localized, and
 * already the /next/ or archive host for that build). Other locales' copies
 * of robots.txt are not the host file, so they are left alone.
 */
const fs = require('fs/promises');
const path = require('path');

/** Crawl rules, then the Sitemap lines. Existing lines are left in place. */
function appendSitemapLines(body, lines) {
  return `${body.trimEnd()}\n\n${lines}\n`;
}

/**
 * One Sitemap line per locale. A single `docusaurus build --locale en` turns
 * off base URL localization, so every localeConfig.baseUrl is `/` (or
 * `/next/`) and the URLs repeat; those copies are one sitemap.
 */
function sitemapLines(localeConfigs) {
  return [
    ...new Set(
      Object.values(localeConfigs).map(
        ({ url, baseUrl }) => `Sitemap: ${url}${baseUrl}sitemap.xml`,
      ),
    ),
  ].join('\n');
}

module.exports = function sitemapRobotsPlugin(context) {
  return {
    name: 'sitemap-robots',
    async postBuild({ outDir, siteConfig }) {
      const { currentLocale, defaultLocale, localeConfigs } = context.i18n;
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
        appendSitemapLines(body, sitemapLines(localeConfigs)),
      );
    },
  };
};

module.exports.appendSitemapLines = appendSitemapLines;
module.exports.sitemapLines = sitemapLines;
