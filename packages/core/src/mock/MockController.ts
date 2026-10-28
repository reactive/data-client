import {
  actionTypes,
  Controller,
  DataClientDispatch,
  GenericDispatch,
} from '../index.js';
import { collapseFixture } from './collapseFixture.js';
import { createFixtureMap } from './createFixtureMap.js';
import type { Fixture, Interceptor } from './fixtureTypes.js';
import { MockProps } from './mockTypes.js';

export function MockController<
  TBase extends new (...args: any[]) => Controller<any>,
  T,
>(
  Base: TBase,
  {
    fixtures = [],
    getInitialInterceptorData = () => ({}) as any,
  }: MockProps<T>,
): TBase {
  const [fixtureMap, interceptors] = createFixtureMap(fixtures);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return class MockedController<
    D extends GenericDispatch = DataClientDispatch,
  > extends (Base as typeof Controller)<D> {
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
            if (!args) args = fixture.args;
            // exact matches take priority; now test ComputedFixture
          } else {
            for (const cfix of this.interceptors) {
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
              typeof fixture.delay === 'function' ?
                fixture.delay(...(args as any))
              : (fixture.delay ?? 0);

            if ('fetchResponse' in fixture) {
              const { fetchResponse } = fixture;
              fixture = {
                endpoint: fixture.endpoint,
                response(...args) {
                  const endpoint = (action.endpoint as any).extend({
                    fetchResponse: async (
                      input: RequestInfo,
                      init: RequestInit,
                    ) => {
                      const ret = await fetchResponse.call(this, input, init);
                      return new Response(JSON.stringify(ret), {
                        status: 200,
                        headers: new Headers({
                          'Content-Type': 'application/json',
                        }),
                      });
                    },
                  });
                  return (endpoint as any)(...args);
                },
              };
            }
            // like fetch(), an aborted signal rejects even while the fixture waits
            const signal: AbortSignal | undefined = (action.endpoint as any)
              .signal;
            const fetch = async () => {
              if (!fixture) {
                throw new Error('No fixture found');
              }
              // delayCollapse determines when the fixture function is 'collapsed' (aka 'run')
              // collapsed: https://en.wikipedia.org/wiki/Copenhagen_interpretation
              if (fixture.delayCollapse) {
                await wait(delayMs, signal);
              }
              const result = await collapseFixture(
                fixture as any,
                args as any,
                this.interceptorData,
              );
              if (!fixture.delayCollapse && delayMs) {
                await wait(delayMs, signal);
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

/** Resolves after `ms`, or rejects with the signal's AbortError once aborted */
function wait(ms: number, signal?: AbortSignal) {
  if (!signal) return new Promise<void>(resolve => setTimeout(resolve, ms));
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      // AbortSignal polyfills (React Native's) may not set reason
      reject(
        signal.reason ??
          Object.assign(new Error('The operation was aborted.'), {
            name: 'AbortError',
          }),
      );
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, ms);
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
}
