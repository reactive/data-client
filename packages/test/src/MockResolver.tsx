import { ControllerContext, useController } from '@rest-hooks/react';
import { useCallback, useMemo } from 'react';
import React from 'react';

import { createControllerInterceptor } from './createControllerInterceptor.js';
import { createFixtureMap } from './createFixtureMap.js';
import type { Fixture, Interceptor } from './fixtureTypes.js';

type Props<T> = {
  children: React.ReactNode;
  readonly fixtures: (Fixture | Interceptor<T>)[];
  silenceMissing: boolean;
  getInitialInterceptorData: () => T;
};

/** Can be used to mock responses based on fixtures provided.
 *
 * <MockResolver fixtures={postFixtures[state]}><MyComponent /></MockResolver>
 *
 * Place below <CacheProvider /> and above any components you want to mock.
 */
export default function MockResolver<T = any>({
  children,
  fixtures,
  getInitialInterceptorData,
  silenceMissing,
}: Props<T>) {
  const controller = useController();

  const [fixtureMap, interceptors] = useMemo(
    () => createFixtureMap(fixtures),
    [fixtures],
  );

  const controllerInterceptor = useMemo(
    () =>
      createControllerInterceptor(
        controller,
        fixtureMap,
        interceptors,
        getInitialInterceptorData,
        silenceMissing,
      ),
    [
      interceptors,
      controller,
      fixtureMap,
      silenceMissing,
      getInitialInterceptorData,
    ],
  );

  return (
    <ControllerContext.Provider value={controllerInterceptor}>
      {children}
    </ControllerContext.Provider>
  );
}

MockResolver.defaultProps = {
  silenceMissing: false,
  getInitialInterceptorData: () => ({}),
};
