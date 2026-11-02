/// <reference types="jest" />
import { renderHook } from '@testing-library/react';

import type { CodeDocument } from '../../editor/codeModel';
import { useCodeManagers } from '../useCodeManagers';

jest.mock('../scope', () => ({ previewScope: {} }));

const files = (value: string): CodeDocument[] => [
  { path: 'Demo.tsx', value, collapsed: false, language: 'tsx' },
];

/** Runs `program` with `scope`, as react-live does */
function run(program: string, scope: Record<string, unknown>) {
  new Function(...Object.keys(scope), program.slice(1, -1))(
    ...Object.values(scope),
  );
}

describe('useCodeManagers', () => {
  it('keeps the files of the code that last ran to its end', () => {
    const first = files('const a = 1;');
    const { result, rerender } = renderHook(
      ({ documents }) => useCodeManagers(documents, () => {}),
      { initialProps: { documents: first } },
    );
    run(result.current.transformCode('const a = 1;'), result.current.scope);
    expect(result.current.ran.current).toBe(first);

    // an edit that throws keeps running the code before it
    const broken = files('\n\nthrow new Error();');
    rerender({ documents: broken });
    const program = result.current.transformCode('\n\nthrow new Error();');
    expect(() => run(program, result.current.scope)).toThrow();
    expect(result.current.ran.current).toBe(first);

    const fixed = files('\n\nconst b = 2;');
    rerender({ documents: fixed });
    run(result.current.transformCode('\n\nconst b = 2;'), result.current.scope);
    expect(result.current.ran.current).toBe(fixed);
  });
});
