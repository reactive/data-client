import {
  ReadShape,
  Schema,
  reducer,
  __INTERNAL__,
  createReceive,
} from 'rest-hooks';
const { initialState } = __INTERNAL__;

export interface Fixture {
  request: ReadShape<Schema, object>;
  params: object;
  result: object | string | number;
}

export default function mockInitialState<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void = Readonly<object> | undefined
>(results: Fixture[]) {
  const mockState = results.reduce((acc, { request, params, result }) => {
    const { schema, getFetchKey, options } = request;
    const key = getFetchKey(params);

    return reducer(
      acc,
      createReceive(result, {
        schema,
        key,
        dataExpiryLength: options?.dataExpiryLength ?? 10000000,
        type: 'read' as const,
      }),
    );
  }, initialState);
  return mockState;
}
