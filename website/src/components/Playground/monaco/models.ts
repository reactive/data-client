import type * as Monaco from 'monaco-editor';

import { extensionToMonacoLanguage } from './language';

let typeScriptWorker: ((...uris: Monaco.Uri[]) => Promise<unknown>) | undefined;
let typeScriptWorkerRequested = false;

/**
 * Creates the models of an editor surface's files that don't have one yet.
 * Call it as each editor mounts; the surface's first editor creates them all.
 *
 * Monaco type-checks a model as soon as it's created, against only the files
 * already synced to the TS worker, and doesn't re-check it when a file it
 * imports arrives later. So importing a later tab would read as a missing
 * module (TS2307) until the importing file is edited. To prevent that, every
 * model is created in one pass, after asking the TS worker for all of them.
 * Each worker request waits on a round trip that the worker answers in order,
 * so that first request syncs every file before any new model is checked.
 * Keep the request and the model creation in the same synchronous pass.
 */
export function createMissingModels(
  monaco: typeof Monaco,
  files: readonly { path: string; code: string; language: string }[],
) {
  const models = files.map(({ path, code, language }) => ({
    uri: monaco.Uri.parse(path),
    code,
    language: extensionToMonacoLanguage(language),
  }));
  const missing = models.filter(({ uri }) => !monaco.editor.getModel(uri));
  if (!missing.length) return;

  const typeScriptUris = models
    .filter(({ language }) => language === 'typescript')
    .map(({ uri }) => uri);
  if (typeScriptUris.length) void typeScriptWorker?.(...typeScriptUris);
  for (const { uri, code, language } of missing) {
    monaco.editor.createModel(code, language, uri);
  }
  // The first TypeScript model registers the TS worker asynchronously, so the
  // first surface has no worker to ask. Monaco starts checking only once that
  // registration finishes, after this pass's models all exist, and re-checks
  // every model when extra libs change (./setup.ts adds the type libs).
  if (!typeScriptWorkerRequested && typeScriptUris.length) {
    typeScriptWorkerRequested = true;
    void monaco.typescript.getTypeScriptWorker().then(getWorker => {
      typeScriptWorker = getWorker;
    });
  }
}
