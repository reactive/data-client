import { denormalize } from './denormalize.js';
import type { Schema } from '../interface.js';
import type { Denormalize, DenormalizeNullable } from '../types.js';

export const denormalizeSimple = <S extends Schema>(
  input: any,
  schema: S | undefined,
  entities: any,
):
  | [denormalized: Denormalize<S>, deleted: false]
  | [denormalized: DenormalizeNullable<S>, deleted: true]
  | [denormalized: DenormalizeNullable<S>, deleted: boolean] => {
  return [denormalize(input, schema, entities), false] as any;
};
