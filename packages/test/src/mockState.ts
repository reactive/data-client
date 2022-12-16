import {
  EndpointInterface,
  ResolveType,
  ReceiveAction,
  State,
  ActionTypes,
  Controller,
  __INTERNAL__,
} from '@rest-hooks/react';

const { initialState, createReducer } = __INTERNAL__;

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

export interface ErrorFixtureEndpoint<
  E extends EndpointInterface & { update?: Updater } = EndpointInterface,
> {
  endpoint: E;
  args: Parameters<E>;
  response: any;
  error: true;
  delay?: number;
}

export type FixtureEndpoint = SuccessFixtureEndpoint | ErrorFixtureEndpoint;
export type SuccessFixture = SuccessFixtureEndpoint;
export type ErrorFixture = ErrorFixtureEndpoint;
export type Fixture = FixtureEndpoint;

export default function mockInitialState(fixtures: Fixture[]): State<unknown> {
  const actions: ReceiveAction[] = [];
  const dispatch = (action: any) => {
    actions.push(action);
    return Promise.resolve();
  };
  const controller = new Controller({ dispatch });
  const reducer: (
    state: State<unknown> | undefined,
    action: ActionTypes,
  ) => State<unknown> = createReducer(controller);

  fixtures.forEach(fixture => {
    dispatchFixture(fixture, controller);
  });
  return actions.reduce(reducer, initialState);
}

export function dispatchFixture(
  fixture: FixtureEndpoint,
  controller: Controller,
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
      controller.setError(endpoint, ...args, response);
    } else {
      controller.setResponse(endpoint, ...args, response);
    }
  }
}
