import { transpileModule, ModuleKind, ScriptTarget, JsxEmit } from 'typescript';

export default function typescriptTransform(code) {
  const transformed = transpileModule(
    code.replaceAll(/^(import.+$|export )/gm, ''),
    {
      compilerOptions: {
        module: ModuleKind.ESNext,
        target: ScriptTarget.ES2017,
        jsx: JsxEmit.React,
        skipLibCheck: true,
      },
    },
  );
  return transformed.outputText;
}
