/// <reference types="jest" />

import { modelPath, stripModelId } from '../modelPath';

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
});
