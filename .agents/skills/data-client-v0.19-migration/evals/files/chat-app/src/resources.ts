import { Entity, resource } from '@data-client/rest';

export class Message extends Entity {
  id = '';
  roomId = '';
  text = '';
}
export const MessageResource = resource({
  urlPrefix: 'https://chat.example.com',
  path: '/rooms/:roomId/messages/:id',
  schema: Message,
});
