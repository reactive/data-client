import { State } from '@rest-hooks/core/types';
import useDenormalized from '@rest-hooks/core/state/selectors/useDenormalized';

export { useDenormalized };

export function selectMeta<R = any>(state: State<R>, fetchKey: string) {
  return state.meta[fetchKey];
}
