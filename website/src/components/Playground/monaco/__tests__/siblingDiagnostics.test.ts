/// <reference types="jest" />

import type * as Monaco from 'monaco-editor';

import { recheckSiblingsOnChange } from '../siblingDiagnostics';

function fakeModel(path: string, language = 'typescript') {
  const changeListeners: (() => void)[] = [];
  let version = 1;
  return {
    uri: { path, toString: () => `file://${path}` },
    getLanguageId: () => language,
    getVersionId: () => version,
    isDisposed: () => false,
    getPositionAt: (offset: number) => ({ lineNumber: 1, column: offset + 1 }),
    onDidChangeContent: (listener: () => void) =>
      changeListeners.push(listener),
    onWillDispose: jest.fn(),
    edit() {
      version++;
      changeListeners.forEach(listener => listener());
    },
  };
}

function fakeMonaco(
  models: ReturnType<typeof fakeModel>[],
  { suggestions = [] as unknown[], diagnosticsOptions = {}, fail = false } = {},
) {
  const markers: Record<string, unknown[]> = {};
  const checked: string[] = [];
  const worker = {
    getSyntacticDiagnostics: async () => [],
    getSemanticDiagnostics: async (fileName: string) => {
      checked.push(fileName);
      return [
        {
          category: 1,
          code: 2305,
          start: 7,
          length: 4,
          messageText: {
            messageText: 'Module has no exported member.',
            category: 1,
            code: 2305,
            next: [{ messageText: 'Did you mean?', category: 3, code: 1 }],
          },
        },
      ];
    },
    getSuggestionDiagnostics: async () => suggestions,
  };
  const monaco = {
    MarkerSeverity: { Hint: 1, Info: 2, Warning: 4, Error: 8 },
    MarkerTag: { Unnecessary: 1, Deprecated: 2 },
    Uri: { parse: (path: string) => path },
    editor: {
      getModels: () => models,
      getModel: (uri: string) =>
        models.find(model => model.uri.toString() === uri) ?? null,
      onDidCreateModel: jest.fn(),
      setModelMarkers: (
        model: ReturnType<typeof fakeModel>,
        owner: string,
        data: unknown[],
      ) => {
        markers[`${owner} ${model.uri.path}`] = data;
      },
    },
    typescript: {
      getTypeScriptWorker: async () => async () => {
        if (fail) throw new Error('Could not find source file');
        return worker;
      },
      typescriptDefaults: { getDiagnosticsOptions: () => diagnosticsOptions },
    },
  } as unknown as typeof Monaco;
  return { monaco, markers, checked };
}

describe('recheckSiblingsOnChange', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('once an edit settles, re-checks only the other TS files of that surface', async () => {
    const api = fakeModel('/1/api.ts');
    const usage = fakeModel('/1/usage.tsx');
    const styles = fakeModel('/1/styles.css', 'css');
    const otherSurface = fakeModel('/2/usage.tsx');
    const { monaco, markers, checked } = fakeMonaco([
      api,
      usage,
      styles,
      otherSurface,
    ]);
    recheckSiblingsOnChange(monaco);

    api.edit();
    jest.advanceTimersByTime(499);
    api.edit();
    jest.advanceTimersByTime(500);
    await jest.runAllTimersAsync();

    expect(checked).toEqual(['file:///1/usage.tsx']);
    expect(markers).toEqual({
      'typescript /1/usage.tsx': [
        {
          startLineNumber: 1,
          startColumn: 8,
          endLineNumber: 1,
          endColumn: 12,
          severity: 8,
          message: 'Module has no exported member.\n  Did you mean?',
          code: '2305',
          tags: [],
          relatedInformation: [],
        },
      ],
    });
  });

  test("leaves a sibling edited during the check to Monaco's own check", async () => {
    const api = fakeModel('/1/api.ts');
    const usage = fakeModel('/1/usage.tsx');
    const { monaco, markers } = fakeMonaco([api, usage]);
    recheckSiblingsOnChange(monaco);

    api.edit();
    jest.advanceTimersByTime(500);
    usage.edit();
    await jest.runAllTimersAsync();

    expect(markers['typescript /1/usage.tsx']).toBeUndefined();
    // usage's own edit re-checks api in turn
    expect(markers['typescript /1/api.ts']).toHaveLength(1);
  });

  test('keeps tags and related files open on the page, and drops ignored codes', async () => {
    const api = fakeModel('/1/api.ts');
    const usage = fakeModel('/1/usage.tsx');
    const { monaco, markers } = fakeMonaco([api, usage], {
      diagnosticsOptions: { diagnosticCodesToIgnore: [2305] },
      suggestions: [
        {
          category: 2,
          code: 6133,
          start: 0,
          length: 0,
          messageText: "'user' is declared but never read.",
          reportsUnnecessary: {},
          relatedInformation: [
            {
              category: 3,
              code: 1,
              start: 2,
              length: 1,
              messageText: 'Declared here.',
              file: { fileName: 'file:///1/api.ts' },
            },
            {
              category: 3,
              code: 1,
              start: 0,
              length: 1,
              messageText: 'In a lib.',
              file: { fileName: 'file:///node_modules/lib.d.ts' },
            },
          ],
        },
      ],
    });
    recheckSiblingsOnChange(monaco);

    api.edit();
    await jest.runAllTimersAsync();

    expect(markers['typescript /1/usage.tsx']).toEqual([
      {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 2,
        severity: 1,
        message: "'user' is declared but never read.",
        code: '6133',
        tags: [1],
        relatedInformation: [
          {
            resource: api.uri,
            startLineNumber: 1,
            startColumn: 3,
            endLineNumber: 1,
            endColumn: 4,
            message: 'Declared here.',
          },
        ],
      },
    ]);
  });

  test('a failed check writes no markers and does not reject', async () => {
    const api = fakeModel('/1/api.ts');
    const usage = fakeModel('/1/usage.tsx');
    const { monaco, markers } = fakeMonaco([api, usage], { fail: true });
    recheckSiblingsOnChange(monaco);

    api.edit();
    await jest.runAllTimersAsync();

    expect(markers).toEqual({});
  });
});
