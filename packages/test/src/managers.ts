import { NetworkManager } from '@rest-hooks/core';
import type { ReceiveAction } from '@rest-hooks/core';
import { PollingSubscription } from 'rest-hooks';
import { act } from '@testing-library/react-hooks';

export class MockNetworkManager extends NetworkManager {
  handleFetch(
    ...[action, dispatch, ...rest]: Parameters<NetworkManager['handleFetch']>
  ) {
    const mockDispatch: typeof dispatch = (v: any) => {
      act(() => {
        dispatch(v);
      });
      return Promise.resolve();
    };
    return super.handleFetch(action, mockDispatch, ...rest);
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
