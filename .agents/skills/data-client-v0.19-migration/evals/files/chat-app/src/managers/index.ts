import { getDefaultManagers } from '@data-client/react';

import AuditNetworkManager from './AuditNetworkManager';
import LiveManager from './LiveManager';
import PresenceManager from './PresenceManager';

export const managers = [
  new LiveManager('wss://chat.example.com/live'),
  new PresenceManager(),
  ...getDefaultManagers({ networkManager: new AuditNetworkManager() }),
];
