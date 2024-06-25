import {
  MemoCache,
  Schema,
  Denormalize,
  DenormalizeNullable,
} from '@data-client/normalizr';

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

it('[helper file in test folder]', () => {});
