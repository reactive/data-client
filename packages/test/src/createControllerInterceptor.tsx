import { actionTypes, ActionTypes, Controller } from '@rest-hooks/react';

import { collapseFixture } from './collapseFixture.js';
import type { Fixture, Interceptor } from './fixtureTypes.js';

export function createControllerInterceptor(
  controller: Controller,
  fixtureMap: Record<string, Fixture>,
  interceptors: Interceptor[],
  silenceMissing = false,
) {
  const dispatchInterceptor = function (action: ActionTypes) {
    if (action.type === actionTypes.FETCH_TYPE) {
      // eslint-disable-next-line prefer-const
      let { key, args } = action.meta;
      let fixture: Fixture | Interceptor | undefined;
      if (Object.hasOwn(fixtureMap, key)) {
        fixture = fixtureMap[key];
        if (!args) args = fixture.args;
        // exact matches take priority; now test ComputedFixture
      } else {
        for (const cfix of interceptors) {
          if (cfix.endpoint.testKey(key)) {
            fixture = cfix;
            break;
          }
        }
      }
      // we have a match
      if (fixture !== undefined) {
        const replacedAction: typeof action = {
          ...action,
        };
        const delayMs =
          typeof fixture.delay === 'function'
            ? fixture.delay(...(args as any))
            : fixture.delay ?? 0;

        replacedAction.payload = () =>
          new Promise((resolve, reject) => {
            if (fixture !== undefined) {
              // delayCollapse determines when the fixture function is 'collapsed' (aka 'run')
              // collapsed: https://en.wikipedia.org/wiki/Copenhagen_interpretation
              if (fixture.delayCollapse) {
                setTimeout(() => {
                  const result = collapseFixture(fixture as any, args as any);
                  const complete = result.error ? reject : resolve;
                  complete(result.response);
                }, delayMs);
              } else {
                const result = collapseFixture(fixture, args as any);
                const complete = result.error ? reject : resolve;
                setTimeout(() => {
                  complete(result.response);
                }, delayMs);
              }
            }
          });

        return controller.dispatch(replacedAction);
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
  };
  const controllerInterceptor = new (controller.constructor as any)({
    ...controller,
    dispatch: dispatchInterceptor,
  });
  /*TODO: this is better but we need to disallow destructuring with controller
    return Object.create(controller, {
      dispatch: { value: dispatchInterceptor },
    });*/
  return controllerInterceptor;
}
