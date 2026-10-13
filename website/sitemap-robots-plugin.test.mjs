import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);
const { sitemapUrls, robotsWithSitemaps } = require('./sitemap-robots-plugin.js');

const locales = ['en', 'es', 'pt-BR', 'zh-Hans'];

describe('sitemapUrls', () => {
  it('lists every locale at the site root', () => {
    assert.deepEqual(
      sitemapUrls({
        url: 'https://dataclient.io',
        baseUrl: '/',
        locales,
        defaultLocale: 'en',
      }),
      [
        'https://dataclient.io/sitemap.xml',
        'https://dataclient.io/es/sitemap.xml',
        'https://dataclient.io/pt-BR/sitemap.xml',
        'https://dataclient.io/zh-Hans/sitemap.xml',
      ],
    );
  });

  it('keeps a /next/ build on its own base URL', () => {
    assert.deepEqual(
      sitemapUrls({
        url: 'https://dataclient.io',
        baseUrl: '/next/',
        locales: ['en', 'es'],
        defaultLocale: 'en',
      }),
      [
        'https://dataclient.io/next/sitemap.xml',
        'https://dataclient.io/next/es/sitemap.xml',
      ],
    );
  });

  it('uses an archived host rather than the latest site', () => {
    assert.deepEqual(
      sitemapUrls({
        url: 'https://0.18.dataclient.io',
        baseUrl: '/',
        locales: ['en', 'es'],
        defaultLocale: 'en',
      }),
      [
        'https://0.18.dataclient.io/sitemap.xml',
        'https://0.18.dataclient.io/es/sitemap.xml',
      ],
    );
  });
});

describe('robotsWithSitemaps', () => {
  const rules = 'User-agent: *\nDisallow: /assets/js/*\nDisallow: /font/*\n';

  it('appends one Sitemap line per URL and keeps the crawl rules', () => {
    assert.equal(
      robotsWithSitemaps(rules, [
        'https://dataclient.io/sitemap.xml',
        'https://dataclient.io/es/sitemap.xml',
      ]),
      `${rules}\nSitemap: https://dataclient.io/sitemap.xml\nSitemap: https://dataclient.io/es/sitemap.xml\n`,
    );
  });

  it('replaces Sitemap lines already in the file', () => {
    assert.equal(
      robotsWithSitemaps(
        `${rules}\nSitemap: https://example.com/sitemap.xml\n`,
        ['https://dataclient.io/sitemap.xml'],
      ),
      `${rules}\nSitemap: https://dataclient.io/sitemap.xml\n`,
    );
  });
});
