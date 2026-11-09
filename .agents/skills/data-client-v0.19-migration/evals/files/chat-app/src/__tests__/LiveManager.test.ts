import { useController } from '@data-client/react';
import { renderDataHook } from '@data-client/test';

import LiveManager from '../managers/LiveManager';

afterEach(() => {
  renderDataHook.cleanup();
});

class FakeSocket {
  sent: string[] = [];
  onmessage?: (event: { data: string }) => void;
  send(data: string) {
    this.sent.push(data);
  }
  close() {}
}

it('stores messages pushed by the server', () => {
  const socket = new FakeSocket();
  (globalThis as any).WebSocket = jest.fn(() => socket);
  const { result } = renderDataHook(() => useController(), {
    managers: [new LiveManager('wss://test')],
  });
  socket.onmessage?.({
    data: JSON.stringify({ id: 'm1', roomId: 'r1', text: 'hi' }),
  });
  expect(result.current).toBeDefined();
});
