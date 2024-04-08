import {
  MemoCache,
  Schema,
  Denormalize,
  DenormalizeNullable,
} from '@data-client/normalizr';

export class SimpleMemoCache {
  private memo = new MemoCache();

  denormalize = <S extends Schema>(
    input: any,
    schema: S | undefined,
    entities: any,
    args: any[] = [],
  ): Denormalize<S> | DenormalizeNullable<S> | symbol =>
    this.memo.denormalize(input, schema, entities, args).data as any;
}

export default SimpleMemoCache;

it('[helper file in test folder]', () => {});
