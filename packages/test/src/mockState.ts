import {
  FetchShape,
  Schema,
  reducer,
  createReceive,
  initialState,
  createReceiveError,
  ReceiveAction,
  EndpointInterface,
  ResolveType,
} from '@rest-hooks/core';

type Updater = (
  result: any,
  ...args: any
) => Record<string, (...args: any) => any>;

export interface SuccessFixtureEndpoint<
  E extends EndpointInterface & { update?: Updater } = EndpointInterface,
> {
  endpoint: E;
  args: Parameters<E>;
  response: ResolveType<E>;
  error?: false;
}

/** @deprecated */
export interface SuccessFixture {
  request: FetchShape<Schema, any>;
  params?: any;
  body?: any;
  result: object | string | number;
  error?: false;
}

export interface ErrorFixtureEndpoint<
  E extends EndpointInterface & { update?: Updater } = EndpointInterface,
> {
  endpoint: E;
  args: Parameters<E>;
  response: any;
  error: true;
}

/** @deprecated */
export interface ErrorFixture {
  request: FetchShape<Schema, any>;
  params?: any;
  body?: any;
  result: Error;
  error: true;
}

export type FixtureEndpoint = SuccessFixtureEndpoint | ErrorFixtureEndpoint;
export type Fixture = SuccessFixture | ErrorFixture | FixtureEndpoint;

export function actionFromFixture(fixture: Fixture) {
  let action: ReceiveAction;
  let key: string;

  // Endpoint path
  if ('endpoint' in fixture) {
    const { endpoint, args, response, error } = fixture;
    key = endpoint.key(...args);
    if (error === true) {
      action = createReceiveError(response, {
        errorExpiryLength: 10000000,
        schema: endpoint.schema,
        //args,
        key,
      });
    } else {
      action = createReceive(response, {
        dataExpiryLength: 10000000,
        type: 'read' as const,
        schema: endpoint.schema,
        update: (endpoint as any).update,
        args,
        key,
      });
    }
    // FetchShape path
  } else {
    const { request, params, body, result, error } = fixture;
    const { schema, getFetchKey, options } = request;
    const args = [params, body] as const;
    key = getFetchKey(params);
    if (error === true) {
      action = createReceiveError(result as Error, {
        errorExpiryLength: 10000000,
        ...options,
        schema,
        key,
      });
    } else {
      action = createReceive(result, {
        dataExpiryLength: 10000000,
        type: 'read' as const,
        ...options,
        args,
        schema,
        key,
      });
    }
  }

  return { key, action };
}

export default function mockInitialState(results: Fixture[]) {
  const mockState = results.reduce((acc, fixture) => {
    const { action } = actionFromFixture(fixture);
    return reducer(acc, action);
  }, initialState);
  return mockState;
}
