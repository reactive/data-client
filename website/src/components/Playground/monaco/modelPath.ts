import { useMemo } from 'react';

/**
 * Monaco models are shared page-wide, so each editor surface namespaces its
 * files as `/<numeric id>/<file path>`. Go-to-definition and import
 * completions (./navigation.ts) rely on this shape.
 */
const MODEL_ID_ROOT = /^\/\d+\//;

export function modelPath(editorId: string, filePath: string) {
  return `/${editorId}/${filePath}`;
}

/** `/123/src/api.ts` → `/src/api.ts` (unchanged when there is no id segment) */
export function stripModelId(path: string) {
  return path.replace(MODEL_ID_ROOT, '/');
}

/** `/123/src/api.ts` → `/123/` (undefined when there is no id segment) */
function modelIdSegment(path: string) {
  return MODEL_ID_ROOT.exec(path)?.[0];
}

/**
 * Other files in the same editor surface as `currentPath`, id stripped:
 * import completions should not offer files from other playgrounds on the page.
 */
export function siblingFilePaths(
  currentPath: string,
  modelPaths: readonly string[],
): string[] {
  const id = modelIdSegment(currentPath);
  if (!id) return [];
  return modelPaths
    .filter(path => path !== currentPath && modelIdSegment(path) === id)
    .map(stripModelId);
}

/** Stable per-mount id. Also runs during SSR, but the id only reaches Monaco (inside BrowserOnly), never markup, so randomness cannot cause hydration mismatches. */
export function useModelId() {
  return useMemo(
    () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(),
    [],
  );
}
