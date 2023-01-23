import {
  actionTypes,
  ActionTypes,
  ControllerContext,
  useController,
} from '@rest-hooks/react';
import { useCallback, useMemo } from 'react';
import React from 'react';

import { Fixture, dispatchFixture } from './mockState.js';

type Props = {
  children: React.ReactNode;
  fixtures: Fixture[];
  silenceMissing: boolean;
};

/** Can be used to mock responses based on fixtures provided.
 *
 * <MockResolver fixtures={postFixtures[state]}><MyComponent /></MockResolver>
 *
 * Place below <CacheProvider /> and above any components you want to mock.
 */
export default function MockResolver({
  children,
  fixtures,
  silenceMissing,
}: Props) {
  const controller = useController();

  const fixtureMap = useMemo(() => {
    const map: Record<string, Fixture> = {};
    for (const fixture of fixtures) {
      const key = fixture.endpoint.key(...fixture.args);
      map[key] = fixture;
    }
    return map;
  }, [fixtures]);

  const dispatchInterceptor = useCallback(
    function (action: ActionTypes) {
      if (action.type === actionTypes.FETCH_TYPE) {
        const { key, resolve, reject } = action.meta;
        // TODO(breaking): remove support for Date type in 'Receive' action
        const createdAt =
          typeof action.meta.createdAt !== 'number'
            ? action.meta.createdAt.getTime()
            : action.meta.createdAt;
        if (Object.hasOwn(fixtureMap, key)) {
          const fixture = fixtureMap[key];
          // All updates must be async or React will complain about re-rendering in same pass
          setTimeout(() => {
            try {
              dispatchFixture(
                'endpoint' in action
                  ? {
                      ...fixture,
                      endpoint: action.endpoint as typeof fixture.endpoint,
                    }
                  : fixture,
                controller,
                createdAt,
              );

              // dispatch goes through user-code that can sometimes fail.
              // let's ensure we always complete the promise
            } finally {
              const complete = fixture.error ? reject : resolve;
              complete(fixture.response);
            }
          }, fixture.delay ?? 0);
          return Promise.resolve();
        }
        if (!silenceMissing) {
          // This is only a warn because sometimes this is intentional
          console.warn(
            `<MockResolver/> received a dispatch:
  ${JSON.stringify(action, undefined, 2)}
  for which there is no matching fixture.

  If you were expecting to see results, it is likely due to data not being found in fixtures.
  Double check your params and Endpoint match. For example:

  useResource(ArticleResource.list(), { maxResults: 10 });

  and

  {
    endpoint: ArticleResource.list(),
    args: [{ maxResults: 10 }],
    response: [],
  }`,
          );
        }
      } else if (action.type === actionTypes.SUBSCRIBE_TYPE) {
        const { key } = action.meta;
        if (Object.hasOwn(fixtureMap, key)) {
          return Promise.resolve();
        }
      }
      return controller.dispatch(action);
    },
    [controller, fixtureMap, silenceMissing],
  );
  const controllerInterceptor = useMemo(() => {
    return new (controller.constructor as any)({
      ...controller,
      dispatch: dispatchInterceptor,
    });
    /*TODO: this is better but we need to disallow destructuring with controller
    return Object.create(controller, {
      dispatch: { value: dispatchInterceptor },
    });*/
  }, [controller, dispatchInterceptor]);

  return (
    <ControllerContext.Provider value={controllerInterceptor}>
      {children}
    </ControllerContext.Provider>
  );
}

MockResolver.defaultProps = {
  silenceMissing: false,
};
