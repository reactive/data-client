import { transpileModule, ModuleKind, ScriptTarget, JsxEmit } from 'typescript';

export function babelTransform(code) {
  const transformed = transpileModule(code.replaceAll(/^import.+$/gm, ''), {
    compilerOptions: {
      module: ModuleKind.ESNext,
      target: ScriptTarget.ES2017,
      jsx: JsxEmit.React,
      skipLibCheck: true,
    },
  });
  return transformed.outputText;
}
