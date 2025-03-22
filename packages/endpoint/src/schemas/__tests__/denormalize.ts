import {
  MemoCache,
  Schema,
  Denormalize,
  DenormalizeNullable,
} from '@data-client/normalizr';
import { Map } from 'immutable';

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

it('[helper file in test folder]', () => {});
