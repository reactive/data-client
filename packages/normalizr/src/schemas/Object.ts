import type { IDenormalizeDelegate, Visit } from '../interface.js';

export const normalize = (
  schema: any,
  input: any,
  parent: any,
  key: any,
  delegate: { visit: Visit },
) => {
  const object = { ...input };
  const keys = Object.keys(schema);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const localSchema = schema[k];
    const value = delegate.visit(localSchema, input[k], input, k);
    if (value === undefined) {
      delete object[k];
    } else {
      object[k] = value;
    }
  }
  return object;
};

export const denormalize = (
  schema: any,
  input: {},
  delegate: IDenormalizeDelegate,
): any => {
  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    // ImmutableJS Map/Record inputs are only supported via the /imm entries.
    // Detect here (dev only — stripped from production) to fail loudly
    // instead of silently producing corrupt output from spreading a Map.
    if (
      input &&
      typeof (input as any).hasOwnProperty === 'function' &&
      Object.hasOwnProperty.call(input, '__ownerID')
    ) {
      throw new Error(
        `Immutable input is not supported by the default denormalize.
Use @data-client/normalizr/imm entries (denormalize or MemoCache with its MemoPolicy) for ImmutableJS state.
See https://github.com/reactive/data-client/blob/master/packages/normalizr/README.md#immutablejs`,
      );
    }
  }

  const object: any = { ...input };
  const keys = Object.keys(schema);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const item = delegate.unvisit(schema[k], object[k]);
    if (typeof item === 'symbol') {
      // propagate the exact symbol so identity checks (INVALID) work across
      // package boundaries
      return item;
    }
    if (object[k] !== undefined) {
      object[k] = item;
    }
  }
  return object;
};

export function queryKey(
  schema: any,
  args: readonly any[],
  unvisit: any,
  delegate: any,
) {
  const resultObject: any = {};
  for (const k of Object.keys(schema)) {
    resultObject[k] = unvisit(schema[k], args, delegate);
  }
  return resultObject;
}
