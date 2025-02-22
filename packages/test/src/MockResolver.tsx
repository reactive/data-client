'use client';
import { ControllerContext, useController } from '@data-client/react';
import { useMemo } from 'react';
import React from 'react';

import { MockController } from './MockController.js';
import { MockProps } from './mockTypes.js';

export interface MockResolverProps<T> extends MockProps<T> {
  children: React.ReactNode;
  silenceMissing?: boolean;
}

/** Can be used to mock responses based on fixtures provided.
 *
 * <MockResolver fixtures={postFixtures[state]}><MyComponent /></MockResolver>
 *
 * Place below <DataProvider /> and above any components you want to mock.
 */
export default function MockResolver<T = any>({
  children,
  fixtures,
  getInitialInterceptorData = () => ({}) as any,
}: MockResolverProps<T>) {
  const controller = useController();

  const controllerInterceptor = useMemo(() => {
    const MockedController = MockController(
      controller.constructor as any,
      fixtures ?
        {
          fixtures,
          getInitialInterceptorData,
        }
      : {},
    );
    const controllerInterceptor = new MockedController({
      ...controller,
      dispatch: controller['_dispatch'] ?? controller.dispatch,
    });
    return controllerInterceptor;
  }, [controller, fixtures, getInitialInterceptorData]);

  return (
    <ControllerContext.Provider value={controllerInterceptor}>
      {children}
    </ControllerContext.Provider>
  );
}
