import {
  actionTypes,
  Controller,
  DataClientDispatch,
  GenericDispatch,
} from '@data-client/core';

import { collapseFixture } from './collapseFixture';
import { createFixtureMap } from './createFixtureMap';
import type { Fixture, Interceptor } from './fixtureTypes';

export interface MockProps<T = any> {
  fixtures?: (Fixture | Interceptor<T>)[];
  getInitialInterceptorData?: () => T;
}

export default function MockController<TBase extends typeof Controller, T>(
  Base: TBase,
  {
    fixtures = [],
    getInitialInterceptorData = () => ({}) as any,
  }: MockProps<T> = {},
): TBase {
  const [fixtureMap, interceptors] = createFixtureMap(fixtures);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return class MockedController<
    D extends GenericDispatch = DataClientDispatch,
  > extends Base<D> {
    // legacy compatibility (re-declaration)
    // TODO: drop when drop support for destructuring (0.14 and below)
    declare protected _dispatch: D;

    fixtureMap: Map<string, Fixture> = fixtureMap;
    interceptors: Interceptor<any>[] = interceptors;
    interceptorData: T = getInitialInterceptorData();

    constructor(...args: any[]) {
      super(...args);

      // legacy compatibility
      // TODO: drop when drop support for destructuring (0.14 and below)
      if (!this._dispatch) {
        this._dispatch = (args[0] as any).dispatch;
      }
    }

    // legacy compatibility - we need this to work with 0.14 and below as they do not have this setter
    // TODO: drop when drop support for destructuring (0.14 and below)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    set dispatch(dispatch: D) {
      this._dispatch = dispatch;
    }

    get dispatch(): D {
      return ((action: Parameters<D>[0]): Promise<void> => {
        // support legacy that has _TYPE suffix
        if (action.type === (actionTypes.FETCH ?? actionTypes.FETCH_TYPE)) {
          // eslint-disable-next-line prefer-const
          let { key, args } = action;
          let fixture: Fixture | Interceptor | undefined;
          if (this.fixtureMap.has(key)) {
            fixture = this.fixtureMap.get(key) as Fixture;
            if (!args) args = (fixture as any).args;
            // exact matches take priority; now test ComputedFixture
          } else {
            for (const cfix of this.interceptors) {
              if ((cfix.endpoint as any).testKey(key)) {
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
              typeof (fixture as any).delay === 'function' ?
                (fixture as any).delay(...(args as any))
              : ((fixture as any).delay ?? 0);

            if ('fetchResponse' in fixture) {
              const { fetchResponse } = fixture as any;
              fixture = {
                endpoint: fixture.endpoint,
                response(...args: any[]) {
                  const endpoint = (action.endpoint as any).extend({
                    fetchResponse: (input: RequestInfo, init: RequestInit) => {
                      const ret = fetchResponse.call(this, input, init);
                      return Promise.resolve(
                        new Response(JSON.stringify(ret), {
                          status: 200,
                          headers: new Headers({
                            'Content-Type': 'application/json',
                          }),
                        }),
                      );
                    },
                  });
                  return (endpoint as any)(...args);
                },
              } as any;
            }
            const fetch = async () => {
              if (!fixture) {
                throw new Error('No fixture found');
              }
              // delayCollapse determines when the fixture function is 'collapsed' (aka 'run')
              // collapsed: https://en.wikipedia.org/wiki/Copenhagen_interpretation
              if ((fixture as any).delayCollapse) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
              }
              const result = await collapseFixture(
                fixture as any,
                args as any,
                this.interceptorData,
              );
              if (!(fixture as any).delayCollapse && delayMs) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
              }
              if (result.error) {
                throw result.response;
              }
              return result.response;
            };
            if (typeof (replacedAction.endpoint as any).extend === 'function') {
              replacedAction.endpoint = (replacedAction.endpoint as any).extend(
                {
                  fetch,
                },
              );
            } else {
              // TODO: full testing of this
              replacedAction.endpoint = fetch as any;
              (replacedAction.endpoint as any).__proto__ = action.endpoint;
            }

            // TODO: make super.dispatch (once we drop support for destructuring)
            return this._dispatch(replacedAction);
          }
        }
        // TODO: make super.dispatch (once we drop support for destructuring)
        return this._dispatch(action);
      }) as any;
    }
  };
}
