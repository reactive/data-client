import { useStorageSlot } from '@docusaurus/theme-common';
import { useCallback } from 'react';

export function useTabStorage(groupId: string) {
  const key = getStorageKey(groupId);
  const [value, storageSlot] = useStorageSlot(key);

  const setValue = useCallback(
    (newValue: string) => {
      if (!key) {
        return; // no-op
      }
      storageSlot.set(newValue);
    },
    [key, storageSlot],
  );

  return [value, setValue] as const;
}

const getStorageKey = (groupId: string) => `docusaurus.tab.${groupId}`;
