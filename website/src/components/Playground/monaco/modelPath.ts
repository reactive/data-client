import { useMemo } from 'react';

/**
 * Monaco models are shared page-wide, so each editor surface namespaces its
 * files as `/<numeric id>/<file path>`. Go-to-definition and import
 * completions (./navigation.ts) rely on this shape.
 */
const MODEL_ID_SEGMENT = /\/\d+\//;

export function modelPath(editorId: string, filePath: string) {
  return `/${editorId}/${filePath}`;
}

/** `/123/src/api.ts` → `/src/api.ts` (unchanged when there is no id segment) */
export function stripModelId(path: string) {
  const candidateId = MODEL_ID_SEGMENT.exec(path)?.[0] ?? '';
  return path.substring(candidateId.length - 1);
}

/** Stable per-mount id. Also runs during SSR, but the id only reaches Monaco (inside BrowserOnly), never markup, so randomness cannot cause hydration mismatches. */
export function useModelId() {
  return useMemo(
    () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(),
    [],
  );
}
