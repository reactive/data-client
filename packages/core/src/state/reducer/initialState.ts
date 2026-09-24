import type { State } from '../../types.js';

export const initialState: State<unknown> = {
  entities: {},
  endpoints: {},
  indexes: {},
  meta: {},
  entitiesMeta: {},
  optimistic: [],
  lastReset: 0,
};
