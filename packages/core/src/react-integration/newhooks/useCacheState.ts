import { useContext } from 'react';

import { StateContext } from '../context.js';

export default function useCacheState() {
  return useContext(StateContext);
}
