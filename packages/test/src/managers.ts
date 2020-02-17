import { act } from '@testing-library/react-hooks';
import {
  NetworkManager,
  FetchAction,
  ReceiveAction,
  Dispatch,
  PollingSubscription,
} from 'rest-hooks';

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

export class MockPollingSubscription extends PollingSubscription {
  /** Trigger request for latest resource */
  protected update() {
    act(() => {
      super.update();
    });
  }
}
