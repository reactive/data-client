import { describe, it, expect } from '@jest/globals';

import { Controller, actionTypes } from '../index';

describe('@data-client/vue', () => {
  it('should export basic types from core', () => {
    expect(Controller).toBeDefined();
    expect(actionTypes).toBeDefined();
  });
});
