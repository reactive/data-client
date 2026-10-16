// Jest stand-in for @docusaurus/theme-common/internal, whose ESM build Jest doesn't transform
export function useScrollPositionBlocker() {
  return { blockElementScrollPositionUntilNextRender: () => {} };
}
