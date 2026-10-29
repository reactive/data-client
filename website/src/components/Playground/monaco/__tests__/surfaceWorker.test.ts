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
    this.models = Object.entries(files).map(([name, text]) => ({
      uri: { toString: () => name },
      version: 1,
      getValue: () => text,
    }));
    this._languageService = ts.createLanguageService(this as any);
  }

  _extraLibs = {};

  _ctx = {
    getMirrorModels: () => this.models,
  };

  declare models: { uri: object; version: number; getValue(): string }[];

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

function surfaceWorker(
  files: Record<string, string>,
  createLanguageService = ts.createLanguageService,
) {
  const self: any = { ts: { ...ts, createLanguageService } };
  const source = fs.readFileSync(
    path.join(__dirname, '../surfaceWorker.js'),
    'utf8',
  );
  new Function('self', source)(self);
  const Worker = self.customTSWorkerFactory(FakeWorker);
  // Monaco passes (ctx, createData); here FakeWorker's files
  const worker = new Worker(files);
  const check = (file: string): string[] =>
    worker._languageService
      .getSemanticDiagnostics(file)
      .map((d: ts.Diagnostic) =>
        ts.flattenDiagnosticMessageText(d.messageText, ''),
      );
  return Object.assign(check, { worker });
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

  it("keeps a playground's modules apart from other playgrounds' scripts", () => {
    const check = surfaceWorker({
      [uri('1', 'api.ts')]: 'const getTodo = 1;',
      [uri('2', 'Usage.ts')]: 'export const todo = getTodo;',
    });
    expect(check(uri('2', 'Usage.ts'))).toEqual([
      "Cannot find name 'getTodo'.",
    ]);
  });

  it('frees the program of a playground that went away', () => {
    const services: ts.LanguageService[] = [];
    const check = surfaceWorker(
      {
        [uri('1', 'api.ts')]: 'const getTodo = 1;',
        [uri('2', 'Usage.ts')]: 'export const todo = 1;',
      },
      (...args) => {
        const service = ts.createLanguageService(...args);
        service.dispose = jest.fn(service.dispose);
        services.push(service);
        return service;
      },
    );
    check(uri('1', 'api.ts'));
    check(uri('2', 'Usage.ts'));
    check.worker.models.shift();
    check(uri('2', 'Usage.ts'));
    // playground 1's program is freed; the modules' program stays
    expect(
      services.map(service => (service.dispose as jest.Mock).mock.calls.length),
    ).toEqual([1, 0]);
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
