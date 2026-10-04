import { usePrismTheme } from '@docusaurus/theme-common';
import { useMemo } from 'react';

export function useReactLiveTheme() {
  const prismTheme = usePrismTheme();
  const realTheme = useMemo(() => {
    return {
      ...prismTheme,
      plain: { ...prismTheme.plain, backgroundColor: 'transparent' },
    };
  }, [prismTheme]);
  return realTheme;
}
