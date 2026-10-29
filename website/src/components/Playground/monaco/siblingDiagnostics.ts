import type * as Monaco from 'monaco-editor';

import { isSameSurface } from './modelPath';

/** Monaco's own wait after an edit before it re-checks the edited file */
const SETTLE_MS = 500;
/** Monaco's TS checker writes its markers under the language id */
const MARKER_OWNER = 'typescript';

/**
 * Monaco re-checks only the file that changed, so the files that import it
 * keep stale squiggles (a fixed error stays, a new one doesn't show) until
 * they are edited too. Once an edit settles, this re-checks the other TS files
 * of the same editor surface (see ./modelPath.ts) and replaces their markers
 * the way Monaco's checker does for the edited file. All of them, not only
 * direct importers, since types also flow through re-exports.
 */
export function recheckSiblingsOnChange(monaco: typeof Monaco) {
  const watch = (model: Monaco.editor.ITextModel) => {
    if (!isTypeScript(model)) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    model.onDidChangeContent(() => {
      clearTimeout(timer);
      timer = setTimeout(
        () =>
          // a sibling disposed mid-check (its demo unmounted) fails in the
          // worker; nothing is left to mark
          recheckSiblings(monaco, model).catch(() => undefined),
        SETTLE_MS,
      );
    });
    model.onWillDispose(() => clearTimeout(timer));
  };
  monaco.editor.getModels().forEach(watch);
  monaco.editor.onDidCreateModel(watch);
}

async function recheckSiblings(
  monaco: typeof Monaco,
  changed: Monaco.editor.ITextModel,
) {
  const siblings = monaco.editor
    .getModels()
    .filter(
      model =>
        model !== changed &&
        isTypeScript(model) &&
        isSameSurface(changed.uri.path, model.uri.path),
    )
    .map(model => ({ model, version: model.getVersionId() }));
  if (!siblings.length) return;
  const getWorker = await monaco.typescript.getTypeScriptWorker();
  const worker = await getWorker(
    changed.uri,
    ...siblings.map(({ model }) => model.uri),
  );
  const options = monaco.typescript.typescriptDefaults.getDiagnosticsOptions();
  await Promise.all(
    siblings.map(sibling => recheck(monaco, worker, options, sibling)),
  );
}

async function recheck(
  monaco: typeof Monaco,
  worker: Monaco.typescript.TypeScriptWorker,
  {
    noSyntaxValidation,
    noSemanticValidation,
    noSuggestionDiagnostics,
    diagnosticCodesToIgnore = [],
  }: Monaco.typescript.DiagnosticsOptions,
  { model, version }: { model: Monaco.editor.ITextModel; version: number },
) {
  const fileName = model.uri.toString();
  const diagnostics = (
    await Promise.all([
      noSyntaxValidation ? [] : worker.getSyntacticDiagnostics(fileName),
      noSemanticValidation ? [] : worker.getSemanticDiagnostics(fileName),
      noSuggestionDiagnostics ? [] : worker.getSuggestionDiagnostics(fileName),
    ])
  )
    .flat()
    .filter(({ code }) => !diagnosticCodesToIgnore.includes(code));
  // edited meanwhile: Monaco's own check of that edit is the newer one
  if (model.isDisposed() || model.getVersionId() !== version) return;
  monaco.editor.setModelMarkers(
    model,
    MARKER_OWNER,
    diagnostics.map(diagnostic => toMarker(monaco, model, diagnostic)),
  );
}

function isTypeScript(model: Monaco.editor.ITextModel) {
  return model.getLanguageId() === 'typescript';
}

/** Mirrors Monaco's own conversion (DiagnosticsAdapter in its TS language features, 0.57) */
function toMarker(
  monaco: typeof Monaco,
  model: Monaco.editor.ITextModel,
  diagnostic: Monaco.typescript.Diagnostic,
): Monaco.editor.IMarkerData {
  const tags: Monaco.MarkerTag[] = [];
  if (diagnostic.reportsUnnecessary) tags.push(monaco.MarkerTag.Unnecessary);
  if (diagnostic.reportsDeprecated) tags.push(monaco.MarkerTag.Deprecated);
  return {
    ...toRange(model, diagnostic),
    severity: toSeverity(monaco, diagnostic.category),
    message: flattenMessage(diagnostic.messageText),
    code: diagnostic.code.toString(),
    tags,
    // only the ones in files open on the page; lib files have no model here
    relatedInformation: (diagnostic.relatedInformation ?? []).flatMap(info => {
      const resource =
        info.file ?
          monaco.editor.getModel(monaco.Uri.parse(info.file.fileName))
        : model;
      if (!resource) return [];
      return [
        {
          resource: resource.uri,
          ...toRange(resource, info),
          message: flattenMessage(info.messageText),
        },
      ];
    }),
  };
}

function toRange(
  model: Monaco.editor.ITextModel,
  { start = 0, length }: Monaco.typescript.DiagnosticRelatedInformation,
) {
  const { lineNumber: startLineNumber, column: startColumn } =
    model.getPositionAt(start);
  const { lineNumber: endLineNumber, column: endColumn } = model.getPositionAt(
    start + (length || 1),
  );
  return { startLineNumber, startColumn, endLineNumber, endColumn };
}

function toSeverity(
  monaco: typeof Monaco,
  category: Monaco.typescript.Diagnostic['category'],
) {
  // TypeScript's DiagnosticCategory: Warning 0, Error 1, Suggestion 2, Message 3
  switch (category) {
    case 1:
      return monaco.MarkerSeverity.Error;
    case 0:
      return monaco.MarkerSeverity.Warning;
    case 3:
      return monaco.MarkerSeverity.Info;
    default:
      return monaco.MarkerSeverity.Hint;
  }
}

type MessageChain = Exclude<
  Monaco.typescript.Diagnostic['messageText'],
  string
>;

/** TypeScript's flattenDiagnosticMessageText with '\n' */
function flattenMessage(message: string | MessageChain, indent = 0): string {
  if (typeof message === 'string') return message;
  const head = indent ? '\n' + '  '.repeat(indent) : '';
  return (
    head +
    message.messageText +
    (message.next ?? []).map(next => flattenMessage(next, indent + 1)).join('')
  );
}
