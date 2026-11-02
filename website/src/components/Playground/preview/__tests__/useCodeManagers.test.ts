/// <reference types="jest" />
import { renderHook } from '@testing-library/react';

import type { CodeDocument } from '../../editor/codeModel';
import { useCodeManagers } from '../useCodeManagers';

jest.mock('../scope', () => ({ previewScope: {} }));

const noop = () => undefined;

const files = (path: string, value: string): CodeDocument[] => [
  { path, value, collapsed: false, language: 'tsx' },
];

/** Runs `program` with `scope`, as react-live does */
function run(program: string, scope: Record<string, unknown>) {
  new Function(...Object.keys(scope), program)(...Object.values(scope));
}

describe('useCodeManagers', () => {
  it('locates lines in the files of the code that runs', () => {
    const { result, rerender } = renderHook(
      ({ documents }) => useCodeManagers(documents, noop),
      { initialProps: { documents: files('First.tsx', 'const a = 1;') } },
    );
    const { locate } = result.current;
    const seen: (string | undefined)[] = [];
    const runCode = (path: string, code: string) => {
      rerender({ documents: files(path, code) });
      run(result.current.transformCode(code), {
        ...result.current.scope,
        // what the code dispatches as it evaluates
        see: () => seen.push(locate(2)?.path),
      });
    };
    runCode('First.tsx', 'const a = 1;');
    expect(locate(1)?.path).toBe('First.tsx');

    // code evaluating maps into its own files
    // its imports gone, though the program opens on their line
    runCode('Second.tsx', "import { a } from './a';\nsee();");
    expect(seen).toEqual(['Second.tsx']);
    expect(locate(1)?.path).toBe('Second.tsx');

    // an edit that throws keeps running the code before it
    expect(() => runCode('Broken.tsx', 'throw new Error();')).toThrow();
    expect(locate(1)?.path).toBe('Second.tsx');
  });

  it('keeps the transform while the files are equal', () => {
    const { result, rerender } = renderHook(
      ({ documents }) => useCodeManagers(documents, noop),
      { initialProps: { documents: files('Demo.tsx', 'const a = 1;') } },
    );
    const { transformCode } = result.current;
    // react-live re-runs the code when its transform changes
    rerender({ documents: files('Demo.tsx', 'const a = 1;') });
    expect(result.current.transformCode).toBe(transformCode);
  });
});
