import { usePrismTheme } from '@docusaurus/theme-common';
import React, { memo } from 'react';
import { Editor } from 'react-live';

/** react-live's editor in the site's Prism theme */
function PlaygroundLiveEditor(props: {
  code: string;
  language: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  const theme = usePrismTheme();
  return <Editor theme={theme} {...props} />;
}
export default memo(PlaygroundLiveEditor);
