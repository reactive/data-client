// Jest stand-in for @docusaurus/useDocusaurusContext: the site's flags as
// docusaurus.config.ts sets them
export default function useDocusaurusContext() {
  return { siteConfig: { customFields: { widePlaygrounds: true } } };
}
