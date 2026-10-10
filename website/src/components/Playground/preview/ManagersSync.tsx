import { useController } from '@data-client/react';
import React, { useEffect, useSyncExternalStore } from 'react';

import type ManagerHost from './managers';
import { ErrorMessage } from './PreviewError';
import ErrorPanel from '../ErrorPanel';

/** Gives the host the store's controller, so new managers can carry its data
 * over. Render under MockResolver so that includes the simulated server. */
export function ManagersSync({ host }: { host: ManagerHost }) {
  const controller = useController();
  useEffect(() => {
    host.controller = controller;
  }, [host, controller]);
  return null;
}

/** What a user manager threw, while the preview keeps running without that step */
export function ManagerError({ host }: { host: ManagerHost }) {
  const error = useSyncExternalStore(
    host.subscribe,
    () => host.error,
    () => undefined,
  );
  if (error === undefined) return null;
  return (
    <ErrorPanel kind="manager">
      <ErrorMessage error={String(error)} />
    </ErrorPanel>
  );
}
