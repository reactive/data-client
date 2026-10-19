import { usePrismTheme } from '@docusaurus/theme-common';
import React, { memo } from 'react';
import { Editor } from 'react-live';

function PlaygroundLiveEditor({
  onChange,
  code,
  language,
}: {
  onChange: (value: string) => void;
  code: string;
  language: string;
}) {
  const theme = usePrismTheme();
  return (
    <Editor theme={theme} language={language} code={code} onChange={onChange} />
  );
}
export default memo(PlaygroundLiveEditor);
