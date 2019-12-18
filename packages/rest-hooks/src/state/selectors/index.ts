import useDenormalized from './useDenormalized';

import { State } from '~/types';

export { useDenormalized };

export function selectMeta<R = any>(state: State<R>, fetchKey: string) {
  return state.meta[fetchKey];
}
