import { useController } from '@data-client/react';

import { MessageResource } from '../resources';

export function useSendMessage(roomId: string) {
  const ctrl = useController();
  return (text: string) =>
    ctrl.fetch(MessageResource.create, { roomId }, { text });
}
