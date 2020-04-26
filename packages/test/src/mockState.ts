import {
  ReadShape,
  Schema,
  reducer,
  __INTERNAL__,
  createReceive,
  actionTypes,
} from 'rest-hooks';
const { initialState } = __INTERNAL__;
const { RECEIVE_TYPE } = actionTypes;

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
    const dataExpiryLength = options?.dataExpiryLength
      ? options?.dataExpiryLength
      : 100000000;

    return reducer(
      acc,
      createReceive(
        result,
        { schema, key, options, responseType: RECEIVE_TYPE },
        { dataExpiryLength },
      ),
    );
  }, initialState);
  return mockState;
}
