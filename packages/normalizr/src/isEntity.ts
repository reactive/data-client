import type { Schema, EntityInterface } from './interface.js';

export function isEntity(schema: Schema): schema is EntityInterface {
  return schema !== null && (schema as any).pk !== undefined;
}
