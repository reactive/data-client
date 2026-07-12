import { useStorageSlot } from '@docusaurus/theme-common';
import { useCallback } from 'react';

/** Persist a tab choice under `docusaurus.tab.${groupId}`. Pass the raw group id. */
export function useTabStorage(groupId: string | null | undefined) {
  const key = groupId ? `docusaurus.tab.${groupId}` : null;
  const [value, storageSlot] = useStorageSlot(key);

  const setValue = useCallback(
    (newValue: string) => {
      if (!key) {
        return;
      }
      storageSlot.set(newValue);
    },
    [key, storageSlot],
  );

  return [value, setValue] as const;
}
