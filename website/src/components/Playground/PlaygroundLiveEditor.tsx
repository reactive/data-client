import { usePrismTheme } from '@docusaurus/theme-common';
import React, { memo } from 'react';
import { Editor } from 'react-live';

import { codePrismTheme } from './monaco/theme';
import { isMonacoTokenized, monacoPrism } from './monaco/tokenize';

/**
 * react-live's editor. TypeScript gets Monaco's tokens and colors, so it
 * looks the same before and after Monaco takes over; other languages get
 * the site's Prism theme.
 */
function PlaygroundLiveEditor(props: {
  code: string;
  language: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  const siteTheme = usePrismTheme();
  return isMonacoTokenized(props.language) ?
      <Editor theme={codePrismTheme} prism={monacoPrism} {...props} />
    : <Editor theme={siteTheme} {...props} />;
}
export default memo(PlaygroundLiveEditor);
