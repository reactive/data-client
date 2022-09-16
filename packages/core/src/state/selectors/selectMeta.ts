import type { State } from '../../types.js';

export default function selectMeta<R = any>(
  state: State<R>,
  fetchKey: string,
): State<R>['meta'][string] {
  return state.meta[fetchKey];
}
