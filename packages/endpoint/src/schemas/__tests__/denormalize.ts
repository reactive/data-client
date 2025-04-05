import {
  MemoCache,
  Schema,
  Denormalize,
  DenormalizeNullable,
} from '@data-client/normalizr';
import { fromJS, Map } from 'immutable';

export class SimpleMemoCache {
  private memo = new MemoCache();

  denormalize = <S extends Schema>(
    schema: S | undefined,
    input: any,
    entities: any,
    args: any[] = [],
  ): Denormalize<S> | DenormalizeNullable<S> | symbol =>
    this.memo.denormalize(schema, input, entities, args).data as any;
}

export default SimpleMemoCache;

export function fromJSEntities(entities: {
  [k: string]: { [k: string]: any };
}) {
  return Map(entities).map(v => Map(v));
}

export function fromJSState(state: {
  entities: {
    [k: string]: { [k: string]: any };
  };
  indexes: {
    [k: string]: { [k: string]: { [field: string]: string } };
  };
}) {
  return {
    entities: fromJSEntities(state.entities),
    indexes: fromJS(state.indexes),
  };
}

it('[helper file in test folder]', () => {});
