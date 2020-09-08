import {
  ReadShape,
  Schema,
  reducer,
  createReceive,
  initialState,
  createReceiveError,
  ReceiveAction,
} from '@rest-hooks/core';

export interface SuccessFixture {
  request: ReadShape<Schema, object>;
  params: object;
  result: object | string | number;
  error?: false;
}

export interface ErrorFixture {
  request: ReadShape<Schema, object>;
  params: object;
  result: Error;
  error: true;
}

export type Fixture = SuccessFixture | ErrorFixture;

export default function mockInitialState<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void = Readonly<object> | undefined
>(results: Fixture[]) {
  const mockState = results.reduce(
    (acc, { request, params, result, error }) => {
      const { schema, getFetchKey, options } = request;
      const key = getFetchKey(params);
      let action: ReceiveAction;
      if (error === true) {
        action = createReceiveError(result as Error, {
          schema,
          key,
          errorExpiryLength: options?.errorExpiryLength ?? 10000000,
        });
      } else {
        action = createReceive(result, {
          schema,
          key,
          dataExpiryLength: options?.dataExpiryLength ?? 10000000,
          type: 'read' as const,
        });
      }

      return reducer(acc, action);
    },
    initialState,
  );
  return mockState;
}
