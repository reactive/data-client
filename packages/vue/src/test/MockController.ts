import type { Controller } from '@data-client/core';

import type { Fixture, Interceptor } from './fixtureTypes.js';

export interface MockProps<T = any> {
  fixtures?: (Fixture | Interceptor<T>)[];
  getInitialInterceptorData?: () => T;
}

// For now, we'll just return the base controller
// The fixture handling is done through mockInitialState
export default function MockController<T = any>(
  BaseController: typeof Controller,
  options: MockProps<T> = {},
) {
  return BaseController;
}
