import { useColorMode, usePrismTheme } from '@docusaurus/theme-common';
import { useMemo } from 'react';

export function useReactLiveTheme() {
  const prismTheme = usePrismTheme();
  const { colorMode } = useColorMode();
  const realTheme = useMemo(() => {
    if (colorMode === 'dark') {
      return {
        ...prismTheme,
        plain: { ...prismTheme.plain, backgroundColor: 'hsl(229, 20%, 15%)' },
      };
    }
    return prismTheme;
  }, [colorMode, prismTheme]);
  return realTheme;
}
