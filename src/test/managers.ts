import { act } from 'react-hooks-testing-library';

import { NetworkManager, FetchAction, ReceiveAction, State } from '..';

export class MockNetworkManager extends NetworkManager {
  handleFetch(
    action: FetchAction,
    dispatch: React.Dispatch<any>,
    getState: () => State<unknown>,
  ) {
    const mockDispatch: typeof dispatch = (v: any) => {
      act(() => {
        dispatch(v);
      });
    };
    return super.handleFetch(action, mockDispatch, getState);
  }
  handleReceive(action: ReceiveAction) {
    act(() => {
      super.handleReceive(action);
    });
  }
}
