/// <reference types="jest" />

import fs from 'fs';
import path from 'path';
import ts from 'typescript';

import { modelPath } from '../modelPath';

/** A model's file name, as Monaco's worker gets it */
const uri = (id: string, file: string) => `file://${modelPath(id, file)}`;

/** The language service host Monaco's TypeScriptWorker is, over `files`
 * (each a model) */
class FakeWorker {
  declare _languageService: ts.LanguageService;
  constructor(readonly files: Record<string, string>) {
    this._languageService = ts.createLanguageService(this as any);
  }

  _extraLibs = {};

  _ctx = {
    getMirrorModels: () =>
      Object.keys(this.files).map(uri => ({ uri: { toString: () => uri } })),
  };

  getScriptFileNames = () => Object.keys(this.files);
  getScriptVersion = () => '1';
  getScriptSnapshot = (name: string) =>
    name in this.files ?
      ts.ScriptSnapshot.fromString(this.files[name])
    : undefined;

  getCompilationSettings = () => ({ noLib: true, strict: true });
  getCurrentDirectory = () => '';
  getDefaultLibFileName = () => 'lib.d.ts';
  fileExists = (name: string) => name in this.files;
  readFile = (name: string) => this.files[name];
}

function surfaceWorker(files: Record<string, string>) {
  const self: any = { ts };
  const source = fs.readFileSync(
    path.join(__dirname, '../surfaceWorker.js'),
    'utf8',
  );
  new Function('self', source)(self);
  const Worker = self.customTSWorkerFactory(FakeWorker);
  // Monaco passes (ctx, createData); here FakeWorker's files
  const worker = new Worker(files);
  return (file: string) =>
    worker._languageService
      .getSemanticDiagnostics(file)
      .map((d: ts.Diagnostic) =>
        ts.flattenDiagnosticMessageText(d.messageText, ''),
      );
}

describe('surfaceWorker', () => {
  it("checks each playground's scripts apart from other playgrounds'", () => {
    const check = surfaceWorker({
      [uri('1', 'api.ts')]: 'const getTodo = 1;',
      [uri('1', 'Usage.ts')]: 'const todo: number = getTodo;',
      [uri('2', 'process.ts')]: "const getTodo = 'other';",
    });
    expect(check(uri('1', 'Usage.ts'))).toEqual([]);
    expect(check(uri('2', 'process.ts'))).toEqual([]);
  });

  it('checks a model outside any playground on its own', () => {
    const check = surfaceWorker({
      'file:///original.ts': 'class User {}',
      'file:///modified.ts': 'class User {}',
    });
    expect(check('file:///original.ts')).toEqual([]);
    expect(check('file:///modified.ts')).toEqual([]);
  });

  it('keeps names shared within one playground', () => {
    const check = surfaceWorker({
      [uri('1', 'a.ts')]: 'const getTodo = 1;',
      [uri('1', 'b.ts')]: 'const getTodo = 2;',
    });
    expect(check(uri('1', 'b.ts'))).toEqual([
      "Cannot redeclare block-scoped variable 'getTodo'.",
    ]);
  });
});
