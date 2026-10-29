import type * as Monaco from 'monaco-editor';

import { modelIdSegment, modelPath } from './modelPath';

/** TS1375: 'await' expressions are only allowed at the top level of a file
 * when that file is a module (a file without imports, TS's script) */
const TOP_LEVEL_AWAIT_IN_SCRIPT = '1375';
/** Monaco's TS checker writes its markers under the language id */
const MARKER_OWNER = 'typescript';

/** Editor surfaces (their model id segments) whose code runs as an async
 * function, as EndpointPlayground's does */
const asyncSurfaces = new Set<string>();

/** Lets the editor surface `id`'s files `await` at the top level, until the
 * returned function is called */
export function allowTopLevelAwait(id: string) {
  const surface = modelPath(id, '');
  asyncSurfaces.add(surface);
  return () => {
    asyncSurfaces.delete(surface);
  };
}

/** Drops TS1375 from the markers of files in surfaces that allow top-level
 * await, whichever checker wrote them (Monaco's, or ./siblingDiagnostics) */
export function ignoreTopLevelAwaitWhereAllowed(monaco: typeof Monaco) {
  monaco.editor.onDidChangeMarkers(uris => {
    for (const uri of uris) {
      const surface = modelIdSegment(uri.path);
      if (surface === undefined || !asyncSurfaces.has(surface)) continue;
      const model = monaco.editor.getModel(uri);
      if (!model) continue;
      const markers = monaco.editor.getModelMarkers({
        owner: MARKER_OWNER,
        resource: uri,
      });
      const kept = markers.filter(
        ({ code }) =>
          (typeof code === 'object' ? code.value : code) !==
          TOP_LEVEL_AWAIT_IN_SCRIPT,
      );
      // setting them fires this again, with nothing left to drop
      if (kept.length < markers.length)
        monaco.editor.setModelMarkers(model, MARKER_OWNER, kept);
    }
  });
}
