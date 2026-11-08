import { usePrismTheme } from '@docusaurus/theme-common';

import { isMonacoTokenized } from '../monaco/language';
import { codePrismTheme } from '../monaco/theme';
import { monacoPrism } from '../monaco/tokenize';

/** Prism's theme and tokenizer for a language: languages Monaco highlights
 * get Monaco's colors, so they look the same before and after Monaco takes
 * over; others get the site's Prism theme. */
export default function useCodeTheme(language: string) {
  const siteTheme = usePrismTheme();
  return isMonacoTokenized(language) ?
      { theme: codePrismTheme, prism: monacoPrism }
    : { theme: siteTheme, prism: undefined };
}
