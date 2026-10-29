import { collapseFixture, createFixtureMap } from '@data-client/react/mock';
import { NetworkError, RestEndpoint, resource } from '@data-client/rest';

import type { FixtureOrInterceptor } from '../../types';

/** A request the code made, and the fixtures' answer */
export interface Exchange {
  input: string;
  init: RequestInit;
  status: number;
  /** Parsed JSON; undefined for an empty body */
  body?: unknown;
}

export interface Network {
  fixtures: readonly FixtureOrInterceptor[];
  /** `this` of the fixtures' `response()` and `fetchResponse()` */
  interceptorData: unknown;
  /** Called as the code calls an endpoint, in call order. The exchange
   * settles once the request is answered, or rejects when the endpoint fails
   * before sending it. */
  onCall(exchange: Promise<Exchange>): void;
}

/** The `@data-client/rest` names the code gets in place of the library's:
 * the same endpoints, except that requests go to `network`'s fixtures. The
 * endpoints still build each request themselves (url, getRequestInit,
 * getHeaders), so an exchange is what the code would send. */
export function networkScope(network: Network) {
  const RecordingEndpoint = recordingEndpoint(network);
  const recordingResource = (options: any) =>
    resource({ Endpoint: RecordingEndpoint, ...options });
  return {
    RestEndpoint: RecordingEndpoint,
    resource: recordingResource,
    createResource: recordingResource,
  };
}

/** On a recording endpoint's fetch: the fetch it wraps */
const SEND = Symbol('send');

function recordingEndpoint({ fixtures, interceptorData, onCall }: Network) {
  const answer = fixtureAnswerer(fixtures, interceptorData);

  return class RecordingEndpoint extends (RestEndpoint as new (
    options: any,
  ) => any) {
    constructor(options: any) {
      super(options);
      // extend() passes the wrapped fetch to its copy; wrap the original
      const send = this.fetch[SEND] ?? this.fetch;
      const call = function (this: any, ...args: any[]) {
        let resolve!: (exchange: Exchange) => void;
        let reject!: (error: unknown) => void;
        const exchange = new Promise<Exchange>((res, rej) => {
          resolve = res;
          reject = rej;
        });
        onCall(exchange);
        // a copy for this call alone, so its request is answered knowing
        // the call's args, as MockResolver answers
        const endpoint = this.extend({
          fetchResponse: async (input: string, init: RequestInit) => {
            const answered = await answer(this.key(...args), args, input, init);
            resolve({ input, init, ...answered });
            return toResponse(answered.status, answered.body);
          },
        });
        const sent: Promise<unknown> = send.apply(endpoint, args);
        // the exchange shows a failure, so the code needn't handle it
        sent.catch(reject);
        return sent;
      };
      this.fetch = Object.assign(call, { [SEND]: send });
    }
  };
}

/** Answers as MockResolver does: the exact fixture for the call's key, else
 * the first interceptor whose endpoint matches it. With no match the answer
 * is a 404, never a real request. */
function fixtureAnswerer(
  fixtures: readonly FixtureOrInterceptor[],
  interceptorData: unknown,
) {
  const [exact, interceptors] = createFixtureMap([...fixtures]);
  return async (
    key: string,
    args: unknown[],
    input: string,
    init: RequestInit,
  ): Promise<{ status: number; body?: unknown }> => {
    const fixture =
      exact.get(key) ??
      interceptors.find(interceptor => interceptor.endpoint.testKey(key));
    if (!fixture) return { status: 404 };
    const { response, error } = await collapseFixture(
      'fetchResponse' in fixture ?
        {
          endpoint: fixture.endpoint,
          response: () =>
            fixture.fetchResponse.call(interceptorData, input, init),
        }
      : fixture,
      args,
      interceptorData,
    );
    if (error) return errorAnswer(response);
    if (response == null) return { status: 204 };
    return { status: init.method === 'POST' ? 201 : 200, body: response };
  };
}

/** A fixture's error is a thrown object: its `status` is the answer's
 * status, the rest its body */
function errorAnswer(thrown: any) {
  if (thrown instanceof Error)
    return { status: 500, body: { message: thrown.message } };
  const { status = 500, ...body } = thrown ?? {};
  return { status, body };
}

/** Resolves or rejects as the endpoint's own fetchResponse() would */
function toResponse(status: number, body: unknown) {
  const response = new Response(
    body === undefined ? null : JSON.stringify(body),
    { status, headers: { 'content-type': 'application/json' } },
  );
  if (!response.ok) throw new NetworkError(response);
  return response;
}
