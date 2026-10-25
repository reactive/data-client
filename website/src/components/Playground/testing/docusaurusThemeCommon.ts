// Jest stand-in for @docusaurus/theme-common, whose ESM build Jest doesn't transform
import { useState } from 'react';

/** No Prism theme: react-live renders unstyled */
export function usePrismTheme() {
  return undefined;
}

/** A storage slot kept in state for the test */
export function useStorageSlot(key: string | null) {
  const [value, set] = useState<string | null>(null);
  return [
    key ? value : null,
    { set, del: () => set(null), listen: () => () => undefined },
  ] as const;
}

export function usePluralForm() {
  return {
    // English rules: "one|other"
    selectMessage: (count: number, messages: string) => {
      const forms = messages.split('|');
      return forms[Math.min(count === 1 ? 0 : 1, forms.length - 1)];
    },
  };
}
