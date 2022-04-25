import type { State } from '../../types.js';

export default function selectMeta<R = any>(state: State<R>, fetchKey: string) {
  return state.meta[fetchKey];
}
