// Jest stand-in for @docusaurus/theme-common/internal, whose ESM build Jest doesn't transform
/** Elements a scroll blocker was asked to hold, in order */
export const blocked: HTMLElement[] = [];
// stable, like Docusaurus' own
const blockElementScrollPositionUntilNextRender = (el: HTMLElement) => {
  blocked.push(el);
};
export function useScrollPositionBlocker() {
  return { blockElementScrollPositionUntilNextRender };
}
