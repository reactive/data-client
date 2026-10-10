/// <reference types="jest" />

import type * as Monaco from 'monaco-editor';

import { createMissingModels } from '../models';

// models.ts keeps the worker it learns for the page's lifetime, so every fake
// shares one worker and one log
let calls: string[] = [];
const getWorker = (...uris: string[]) => {
  calls.push(`sync ${uris.join(' ')}`);
  return Promise.resolve();
};

function fakeMonaco(existing: string[] = []) {
  const models = new Set(existing);
  return {
    Uri: { parse: (path: string) => path },
    editor: {
      getModel: (uri: string) => (models.has(uri) ? {} : null),
      createModel: (_code: string, language: string, uri: string) => {
        models.add(uri);
        calls.push(`create ${uri} ${language}`);
      },
    },
    typescript: { getTypeScriptWorker: async () => getWorker },
  } as unknown as typeof Monaco;
}

const files = [
  { path: '/1/StreamManager.tsx', code: "import './socket';", language: 'tsx' },
  { path: '/1/styles.css', code: '', language: 'css' },
  { path: '/1/socket.tsx', code: '', language: 'tsx' },
];

describe('createMissingModels', () => {
  beforeEach(() => {
    calls = [];
  });

  test('syncs every TS file to the worker before creating any model', async () => {
    // first call only learns the worker (it isn't registered before a TS model exists)
    createMissingModels(fakeMonaco(), files);
    expect(calls).toEqual([
      'create /1/StreamManager.tsx typescript',
      'create /1/styles.css css',
      'create /1/socket.tsx typescript',
    ]);
    await Promise.resolve();
    await Promise.resolve();

    calls = [];
    createMissingModels(fakeMonaco(['/1/styles.css']), files);
    expect(calls).toEqual([
      'sync /1/StreamManager.tsx /1/socket.tsx',
      'create /1/StreamManager.tsx typescript',
      'create /1/socket.tsx typescript',
    ]);
  });

  test('does nothing once every model exists', () => {
    createMissingModels(fakeMonaco(files.map(({ path }) => path)), files);
    expect(calls).toEqual([]);
  });
});
