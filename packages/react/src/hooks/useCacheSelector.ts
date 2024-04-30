// import type { State } from '@data-client/core';
// import React, { useContext, useMemo } from 'react';

// import { StateContext, StoreContext } from '../context.js';

// const useCacheSelector: () => State<unknown> =
//   (
//     typeof window === 'undefined' &&
//     Object.hasOwn(React, 'useSyncExternalStore')
//   ) ?
//     () => {
//       const store = useContext(StoreContext);
//       const state = useContext(StateContext);
//       const syncState = React.useSyncExternalStore(
//         store.subscribe,
//         store.getState,
//         store.getState,
//       );
//       return store.uninitialized ? state : syncState;
//     }
//   : Object.hasOwn(React, 'use') ?
//     <T>(selector: (state: State<unknown>) => T): T => {
//       return useMemo(() => {
//         const state = React.use(StateContext);
//         return selector(state);
//       }, []);
//     }
//   : () => {
//       const state = useContext(StateContext);
//       return state;
//     };

// export default useCacheState;
