/// <reference types="jest" />

import type * as Monaco from 'monaco-editor';

import {
  allowTopLevelAwait,
  ignoreTopLevelAwaitWhereAllowed,
} from '../topLevelAwait';

function fakeMonaco() {
  const markers: Record<string, { code: unknown }[]> = {};
  let onChange: (uris: { path: string }[]) => void = () => undefined;
  const monaco = {
    editor: {
      onDidChangeMarkers: (listener: typeof onChange) => (onChange = listener),
      getModel: (uri: { path: string }) => ({ uri }),
      getModelMarkers: ({ resource }: { resource: { path: string } }) =>
        markers[resource.path] ?? [],
      setModelMarkers: (
        { uri }: { uri: { path: string } },
        _owner: string,
        kept: { code: unknown }[],
      ) => (markers[uri.path] = kept),
    },
  };
  ignoreTopLevelAwaitWhereAllowed(monaco as unknown as typeof Monaco);
  /** Codes left on `path` once the checker sets `codes` there */
  return (path: string, codes: unknown[]) => {
    markers[path] = codes.map(code => ({ code }));
    onChange([{ path }]);
    return markers[path].map(({ code }) => code);
  };
}

describe('ignoreTopLevelAwaitWhereAllowed', () => {
  it('drops TS1375 only in surfaces that allow top-level await', () => {
    const check = fakeMonaco();
    const stop = allowTopLevelAwait('1');
    expect(check('/1/Usage.ts', ['1375', { value: '1375' }, '2304'])).toEqual([
      '2304',
    ]);
    expect(check('/2/Usage.ts', ['1375'])).toEqual(['1375']);
    stop();
    expect(check('/1/Usage.ts', ['1375'])).toEqual(['1375']);
  });
});
