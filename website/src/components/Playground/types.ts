import type { Fixture, Interceptor } from '@data-client/test';

export type FixtureOrInterceptor<T = any> = Fixture | Interceptor<T>;

export interface PreviewProps<T = any> {
  groupId: string;
  defaultOpen: 'y' | 'n';
  row: boolean;
  fixtures: FixtureOrInterceptor<T>[];
  getInitialInterceptorData?: () => T;
}
