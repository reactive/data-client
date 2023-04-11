import { denormalize } from './denormalize.js';
import type { Denormalize, DenormalizeNullable } from './types.js';
import type { Schema } from '../../../../interface.js';

export const denormalizeSimple = <S extends Schema>(
  input: any,
  schema: S | undefined,
  entities: any,
):
  | [denormalized: Denormalize<S>, found: true, deleted: false]
  | [denormalized: DenormalizeNullable<S>, found: boolean, deleted: true]
  | [denormalized: DenormalizeNullable<S>, found: false, deleted: boolean] => {
  return [denormalize(input, schema, entities), true, false] as any;
};
it('[helper file in test folder]', () => {});
