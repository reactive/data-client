import type { State } from '@rest-hooks/core/types';

export default function selectMeta<R = any>(state: State<R>, fetchKey: string) {
  return state.meta[fetchKey];
}
