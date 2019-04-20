import { act } from 'react-hooks-testing-library';

import NetworkManager from '../state/NetworkManager';
import { FetchAction, ReceiveAction } from '../types';

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
