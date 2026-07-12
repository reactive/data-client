import { IDenormalizeDelegate, Visit } from '../interface.js';

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
    const key = keys[i];
    const value = delegate.visit(schema[key], input[key], input, key);
    if (value === undefined) {
      delete object[key];
    } else {
      object[key] = value;
    }
  }
  return object;
};

export function denormalize(
  schema: any,
  input: {},
  delegate: IDenormalizeDelegate,
): any {
  // value-representation aware path (plain or ImmutableJS input, decided by
  // the active policy). Capability check supports delegates from older
  // @data-client/normalizr versions, which lack unvisitObject.
  if (delegate.unvisitObject) {
    return delegate.unvisitObject(schema, input);
  }

  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    // ImmutableJS Map/Record inputs are only supported via the /imm entries.
    // Detect here (dev only — stripped from production) to fail loudly
    // instead of silently producing corrupt output from spreading a Map.
    if (
      input &&
      typeof (input as any).hasOwnProperty === 'function' &&
      (Object.hasOwnProperty.call(input, '__ownerID') ||
        ((input as any)._map &&
          Object.hasOwnProperty.call((input as any)._map, '__ownerID')))
    ) {
      throw new Error(
        `Immutable input is not supported by the default denormalize.
Use @data-client/normalizr/imm entries (denormalize or MemoCache with its MemoPolicy) for ImmutableJS state.
See https://github.com/reactive/data-client/blob/master/packages/normalizr/README.md#immutablejs`,
      );
    }
  }

  const object: Record<string, any> = { ...input };
  const keys = Object.keys(schema);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const item = delegate.unvisit(schema[key], object[key]);
    if (object[key] !== undefined) {
      object[key] = item;
    }
    if (typeof item === 'symbol') {
      return item;
    }
  }
  return object;
}

export function objectQueryKey(
  schema: any,
  args: readonly any[],
  unvisit: (schema: any, args: any) => any,
) {
  const resultObject: any = {};
  const keys = Object.keys(schema);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    resultObject[k] = unvisit(schema[k], args);
  }
  return resultObject;
}
/**
 * Represents objects with statically known members
 * @see https://dataclient.io/rest/api/Object
 */
export default class ObjectSchema {
  protected schema: any;

  constructor(definition: Record<string, any>) {
    this.define(definition);
  }

  define(definition: Record<string, any>) {
    this.schema = Object.keys(definition).reduce((entitySchema, key) => {
      const schema = definition[key];
      return { ...entitySchema, [key]: schema };
    }, this.schema || {});
  }

  normalize(
    ...args: readonly [
      input: any,
      parent: any,
      key: any,
      delegate: { visit: Visit },
    ]
  ) {
    return normalize(this.schema, ...args);
  }

  denormalize(input: {}, delegate: IDenormalizeDelegate): any {
    return denormalize(this.schema, input, delegate);
  }

  queryKey(args: any, unvisit: any) {
    return objectQueryKey(this.schema, args, unvisit);
  }
}
