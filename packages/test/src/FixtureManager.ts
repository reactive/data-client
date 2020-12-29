import { MiddlewareAPI, Middleware } from '@rest-hooks/use-enhanced-reducer';
import { NetworkManager, actionTypes, ReceiveAction } from '@rest-hooks/core';
import type { Dispatch, Manager } from '@rest-hooks/core';

import { Fixture, actionFromFixture } from './mockState';

/** Resolves requests matching provided fixtures
 *
 */
export default class FixtureManager implements Manager {
  protected mockResults: { [key: string]: ReceiveAction } = {};
  protected declare middleware: Middleware;

  constructor(fixtures: Fixture[]) {
    for (const fixture of fixtures) {
      const { key, action } = actionFromFixture(fixture);
      this.mockResults[key] = action;
    }

    this.middleware = <R extends React.Reducer<any, any>>({
      dispatch,
      getState,
    }: MiddlewareAPI<R>) => {
      return (next: Dispatch<R>) => (
        action: React.ReducerAction<R>,
      ): Promise<void> => {
        switch (action.type) {
          case actionTypes.FETCH_TYPE: {
            const { key, resolve, reject } = action.meta;

            if (key in this.mockResults) {
              // All updates must be async or React will complain about re-rendering in same pass
              setTimeout(() => {
                const action: any = this.mockResults[key];
                dispatch(action);
                const complete = action.error ? reject : resolve;
                complete(action.payload);
              }, 0);
              return Promise.resolve();
            }
            console.warn(
              `FixtureManager received a dispatch:
        ${JSON.stringify(action, undefined, 2)}
        for which there is no matching fixture.

        If you were expecting to see results, it is likely due to data not being found in fixtures.
        Double check your params and Endpoint match. For example:

        useResource(ArticleResource.list(), { maxResults: 10 });

        and

        {
        request: ArticleResource.list(),
        params: { maxResults: 10 },
        result: [],
        }`,
            );
            return next(action);
          }
          default:
            return next(action);
        }
      };
    };
  }

  getMiddleware<T extends NetworkManager>(this: T) {
    return this.middleware;
  }

  cleanup() {}
}
