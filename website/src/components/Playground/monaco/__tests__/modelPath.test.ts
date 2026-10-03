/// <reference types="jest" />

import { renderHook } from '@testing-library/react';

import {
  modelPath,
  siblingFilePaths,
  stripModelId,
  useModelId,
} from '../modelPath';

describe('model paths', () => {
  test('round-trips a namespaced file path', () => {
    expect(modelPath('123', 'src/api.ts')).toBe('/123/src/api.ts');
    expect(stripModelId(modelPath('123', 'src/api.ts'))).toBe('/src/api.ts');
  });

  test('leaves paths without an id segment unchanged', () => {
    expect(stripModelId('/node_modules/react/index.d.ts')).toBe(
      '/node_modules/react/index.d.ts',
    );
  });

  test('siblingFilePaths lists only other files in the same editor', () => {
    expect(
      siblingFilePaths('/1/index.tsx', [
        '/1/index.tsx',
        '/1/api.ts',
        '/2/other.ts',
        '/12/near-miss.ts',
        '/node_modules/react/index.d.ts',
      ]),
    ).toEqual(['/api.ts']);
  });

  test('useModelId is numeric and stable across renders', () => {
    const { result, rerender } = renderHook(() => useModelId());
    const first = result.current;
    expect(first).toMatch(/^\d+$/);
    expect(stripModelId(modelPath(first, 'a.ts'))).toBe('/a.ts');
    rerender();
    expect(result.current).toBe(first);
  });
});
