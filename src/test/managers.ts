import { act } from '@testing-library/react-hooks';
import { NetworkManager, FetchAction, ReceiveAction, Dispatch } from '..';

export class MockNetworkManager extends NetworkManager {
  handleFetch(action: FetchAction, dispatch: Dispatch<any>) {
    const mockDispatch: typeof dispatch = (v: any) => {
      act(() => {
        dispatch(v);
      });
      return Promise.resolve();
    };
    return super.handleFetch(action, mockDispatch);
  }
  handleReceive(action: ReceiveAction) {
    act(() => {
      super.handleReceive(action);
    });
  }
}
