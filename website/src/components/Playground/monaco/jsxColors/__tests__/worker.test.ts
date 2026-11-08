/// <reference types="jest" />

import fs from 'fs';
import path from 'path';
import ts from 'typescript';

import { JSX_ATTRIBUTE, JSX_TAG, JSX_TEXT } from '../spans';

/** Monaco's TypeScriptWorker, as far as getJsxSpans uses it, over one file */
class FakeWorker {
  _languageService: ts.LanguageService;
  constructor(
    readonly name: string,
    readonly text: string,
  ) {
    this._languageService = ts.createLanguageService({
      getScriptFileNames: () => [name],
      getScriptVersion: () => '1',
      getScriptSnapshot: file =>
        file === name ? ts.ScriptSnapshot.fromString(text) : undefined,
      getCompilationSettings: () => ({ noLib: true }),
      getCurrentDirectory: () => '',
      getDefaultLibFileName: () => 'lib.d.ts',
      fileExists: file => file === name,
      readFile: file => (file === name ? text : undefined),
    });
  }

  _getScriptText = (file: string) =>
    file === this.name ? this.text : undefined;
}

test("gives JSX's tag names, attribute names and text", () => {
  const self: any = {};
  new Function(
    'self',
    fs.readFileSync(path.join(__dirname, '../worker.js'), 'utf8'),
  )(self);
  const Worker = self.withJsxSpans(FakeWorker);
  const worker = new Worker('file:///a.tsx', 'x = <A b="c">hi</A>;');
  // start, length, kind
  expect(worker.getJsxSpans('file:///a.tsx')).toEqual([
    ...[5, 1, JSX_TAG],
    ...[7, 1, JSX_ATTRIBUTE],
    ...[13, 2, JSX_TEXT],
    ...[17, 1, JSX_TAG],
  ]);
  expect(worker.getJsxSpans('file:///missing.tsx')).toEqual([]);
});
