import { act } from '@testing-library/react-hooks';

import { NetworkManager, FetchAction, ReceiveAction } from '..';

export class MockNetworkManager extends NetworkManager {
  handleFetch(action: FetchAction, dispatch: React.Dispatch<any>) {
    const mockDispatch: typeof dispatch = (v: any) => {
      act(() => {
        dispatch(v);
      });
    };
    return super.handleFetch(action, mockDispatch);
  }
  handleReceive(action: ReceiveAction) {
    act(() => {
      super.handleReceive(action);
    });
  }
}
