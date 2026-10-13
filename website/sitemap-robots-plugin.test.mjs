import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);
const {
  appendSitemapLines,
  sitemapLines,
} = require('./sitemap-robots-plugin.js');

describe('appendSitemapLines', () => {
  const rules =
    'User-agent: *\nDisallow: /assets/js/*\nDisallow: /font/*\n\n# Sitemap lines are added at build time, one absolute URL per locale.\n';

  it('appends Sitemap lines after the crawl rules', () => {
    const lines = [
      'Sitemap: https://dataclient.io/sitemap.xml',
      'Sitemap: https://dataclient.io/es/sitemap.xml',
    ].join('\n');
    assert.equal(
      appendSitemapLines(rules, lines),
      `${rules}\nSitemap: https://dataclient.io/sitemap.xml\nSitemap: https://dataclient.io/es/sitemap.xml\n`,
    );
  });
});

describe('sitemapLines', () => {
  it('uses each locale url and baseUrl', () => {
    assert.equal(
      sitemapLines({
        en: { url: 'https://dataclient.io', baseUrl: '/' },
        es: { url: 'https://dataclient.io', baseUrl: '/es/' },
        'pt-BR': { url: 'https://dataclient.io', baseUrl: '/pt-BR/' },
        'zh-Hans': { url: 'https://dataclient.io', baseUrl: '/zh-Hans/' },
      }),
      [
        'Sitemap: https://dataclient.io/sitemap.xml',
        'Sitemap: https://dataclient.io/es/sitemap.xml',
        'Sitemap: https://dataclient.io/pt-BR/sitemap.xml',
        'Sitemap: https://dataclient.io/zh-Hans/sitemap.xml',
      ].join('\n'),
    );
  });

  it('keeps one line when a single-locale build repeats the base URL', () => {
    assert.equal(
      sitemapLines({
        en: { url: 'https://dataclient.io', baseUrl: '/next/' },
        es: { url: 'https://dataclient.io', baseUrl: '/next/' },
      }),
      'Sitemap: https://dataclient.io/next/sitemap.xml',
    );
  });
});
