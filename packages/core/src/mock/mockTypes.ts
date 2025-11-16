import type { Fixture, Interceptor } from './fixtureTypes.js';

export interface MockProps<T = any> {
  readonly fixtures?: (Fixture | Interceptor<T>)[];
  getInitialInterceptorData?: () => T;
}
