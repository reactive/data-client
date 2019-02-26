import React, { ReactNode, useEffect } from 'react';
import { StateContext, DispatchContext } from '../context';
import masterReducer, { initialState } from '../../state/reducer';
import NetworkManager from '../../state/NetworkManager';
import createEnhancedReducerHook from './middleware';

interface ProviderProps {
  children: ReactNode;
  manager?: NetworkManager;
}
/** Controller managing state of the REST cache and coordinating network requests. */
export default function RestProvider({ children, manager = new NetworkManager() }: ProviderProps) {
  // TODO: option to use redux
  const useEnhancedReducer = createEnhancedReducerHook(
    manager.getMiddleware()
  );
  const [state, dispatch] = useEnhancedReducer(masterReducer, initialState);

  // if we change out the manager we need to make sure all its
  // promises are not hanging
  useEffect(() => {
    return () => {
      manager.cleanup();
    };
  }, [manager]);

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </DispatchContext.Provider>
  );
}
