import { usePrismTheme } from '@docusaurus/theme-common';
import React, { memo } from 'react';
import { Editor } from 'react-live';

import { codePrismTheme } from './monaco/theme';
import { isMonacoTokenized, monacoPrism } from './monaco/tokenize';

/**
 * react-live's editor. Languages Monaco highlights get Monaco's colors, so
 * they look the same before and after Monaco takes over; others get the
 * site's Prism theme.
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
