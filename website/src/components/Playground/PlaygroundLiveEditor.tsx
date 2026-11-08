import React, { memo } from 'react';
import { Editor } from 'react-live';

import useCodeTheme from './editor/useCodeTheme';

/** react-live's editor, in the colors Monaco will draw (useCodeTheme) */
function PlaygroundLiveEditor(props: {
  code: string;
  language: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return <Editor {...useCodeTheme(props.language)} {...props} />;
}
export default memo(PlaygroundLiveEditor);
