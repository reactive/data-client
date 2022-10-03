import {
  FetchShape,
  Schema,
  createReceive,
  initialState,
  createReceiveError,
  ReceiveAction,
  EndpointInterface,
  ResolveType,
  State,
  ActionTypes,
} from '@rest-hooks/core';
// this allows us to support versions with different exports
import * as RestHooks from '@rest-hooks/core';

type Updater = (
  result: any,
  ...args: any
) => Record<string, (...args: any) => any>;

export interface SuccessFixtureEndpoint<
  E extends EndpointInterface & { update?: Updater } = EndpointInterface,
> {
  endpoint: E;
  args: Parameters<E>;
  response: ResolveType<E> | ((...args: Parameters<E>) => ResolveType<E>);
  delay?: number;
  error?: false;
}

/** @deprecated */
export interface SuccessFixture {
  request: FetchShape<Schema, any>;
  params?: any;
  body?: any;
  result: object | string | number;
  error?: false;
  delay?: number;
}

export interface ErrorFixtureEndpoint<
  E extends EndpointInterface & { update?: Updater } = EndpointInterface,
> {
  endpoint: E;
  args: Parameters<E>;
  response: any;
  error: true;
  delay?: number;
}

/** @deprecated */
export interface ErrorFixture {
  request: FetchShape<Schema, any>;
  params?: any;
  body?: any;
  result: Error;
  error: true;
  delay?: number;
}

export type FixtureEndpoint = SuccessFixtureEndpoint | ErrorFixtureEndpoint;
export type Fixture = SuccessFixture | ErrorFixture | FixtureEndpoint;

export function actionFromFixture(fixture: SuccessFixture | ErrorFixture) {
  let action: ReceiveAction;

  const { request, params, body, result, error } = fixture;
  const { schema, getFetchKey, options } = request;
  const args = [params, body] as const;
  const key = getFetchKey(params);
  if (error === true) {
    action = createReceiveError(result as Error, {
      errorExpiryLength: options?.errorExpiryLength ?? 1000,
      ...options,
      schema,
      key,
    });
  } else {
    action = createReceive(result, {
      dataExpiryLength: options?.dataExpiryLength ?? 60000,
      type: 'read' as const,
      ...options,
      args,
      schema,
      key,
    });
  }

  return action;
}

export default function mockInitialState(fixtures: Fixture[]): State<unknown> {
  let reducer: (
    state: State<unknown> | undefined,
    action: ActionTypes,
  ) => State<unknown>;
  const actions: ReceiveAction[] = [];
  const dispatch = (action: any) => {
    actions.push(action);
    return Promise.resolve();
  };
  const controller = new RestHooks.Controller({ dispatch });
  // >=6.1 of Rest Hooks / >=3.1 of RH/core
  if ('createReducer' in RestHooks) {
    // `{...RestHooks}` blocks webpack from barfing during compilation if createReducer export isn't available
    reducer = { ...RestHooks }.createReducer(controller);
    // previous versions
  } else {
    reducer = (RestHooks as any).reducer;
  }

  fixtures.forEach(fixture => {
    if ('endpoint' in fixture) {
      dispatchFixture(fixture, controller);
    } else {
      actions.push(actionFromFixture(fixture));
    }
  });
  return actions.reduce(reducer, initialState);
}

export function dispatchFixture(
  fixture: FixtureEndpoint,
  controller: RestHooks.Controller,
  fetchedAt?: number,
) {
  const { endpoint, args, error } = fixture;
  let response = fixture.response;
  if (typeof fixture.response === 'function') {
    response = fixture.response(...args);
  }
  if (controller.resolve) {
    controller.resolve(endpoint, {
      args,
      response,
      error,
      fetchedAt: fetchedAt ?? Date.now(),
    });
  } else {
    if (error === true) {
      controller.receiveError(endpoint, ...args, response);
    } else {
      controller.receive(endpoint, ...args, response);
    }
  }
}
