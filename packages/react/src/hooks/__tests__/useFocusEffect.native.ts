import fs from 'fs';
import path from 'path';
import ts from 'typescript';

/** Runs useFocusEffect.native.ts with each `import()` calling `asyncRequire`
 * synchronously, like Expo's native bundles do */
function loadWith(asyncRequire: (name: string) => Promise<unknown>) {
  const source = fs
    .readFileSync(path.join(__dirname, '../useFocusEffect.native.ts'), 'utf8')
    .replace(/\bimport\(/g, 'asyncRequire(');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const module = { exports: {} as any };
  new Function('require', 'module', 'exports', 'asyncRequire', outputText)(
    require,
    module,
    module.exports,
    asyncRequire,
  );
  return module.exports;
}

describe('useFocusEffect.native module', () => {
  it('loads when importing @react-navigation/native throws synchronously', async () => {
    // Expo's native asyncRequire throws synchronously for a module the app does not have
    const asyncRequire = jest.fn(() => {
      throw new Error('Cannot find module');
    });
    expect(() => loadWith(asyncRequire)).not.toThrow();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(asyncRequire).toHaveBeenCalledWith('@react-navigation/native');
  });
});
