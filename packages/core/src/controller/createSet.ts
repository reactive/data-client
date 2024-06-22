import type {
  Denormalize,
  Queryable,
  SchemaArgs,
} from '@data-client/normalizr';

import ensurePojo from './ensurePojo.js';
import { SET_TYPE } from '../actionTypes.js';
import type { SetAction, SetMeta } from '../types.js';

export default function createSet<S extends Queryable>(
  schema: S,
  {
    args,
    fetchedAt,
    value,
  }: {
    args: readonly [...SchemaArgs<S>];
    value: {} | ((previousValue: Denormalize<S>) => {});
    fetchedAt?: number;
  },
): SetAction<S> {
  const expiryLength: number = 60000;
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'development' && expiryLength < 0) {
    throw new Error('Negative expiry length are not allowed.');
  }
  const now = Date.now();
  const meta: SetMeta = {
    args: args.map(ensurePojo),
    fetchedAt: fetchedAt ?? now,
    date: now,
    expiresAt: now + expiryLength,
  };

  const action: SetAction<S> = {
    type: SET_TYPE,
    value,
    schema,
    meta,
  };
  return action;
}
