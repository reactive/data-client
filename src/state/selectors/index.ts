import { State } from '~/types';
import useSchemaSelect from './useSchemaSelect';
import useDenormalized from './useDenormalized';

export { useSchemaSelect, useDenormalized };

export function selectMeta<R = any>(state: State<R>, fetchKey: string) {
  return state.meta[fetchKey];
}
