import React from 'react';

// Runs on every React version CI installs: no version skip
describe('V1/legacy-react', () => {
  it('loads server/stream, and supported says whether React has use and useId', () => {
    let stream: typeof import('..') | undefined;
    expect(() => {
      stream = require('..');
    }).not.toThrow();
    const hasHooks =
      typeof (React as any).use === 'function' &&
      typeof (React as any).useId === 'function';
    expect(stream!.supported).toBe(hasHooks);
    expect(stream!.supported).toBe(Number(React.version.split('.')[0]) >= 19);
  });
});
