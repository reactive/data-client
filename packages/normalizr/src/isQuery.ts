import type { Schema, QueryInterface } from './interface.js';

export function isQuery(schema: Schema): schema is QueryInterface {
  return schema !== null && (schema as any).process !== undefined;
}
