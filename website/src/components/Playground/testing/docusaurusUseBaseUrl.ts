// Jest stand-in for @docusaurus/useBaseUrl: the site is served from its root
export default function useBaseUrl(url: string) {
  return url;
}
