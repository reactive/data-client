import { usePrismTheme } from '@docusaurus/theme-common';
import React from 'react';
import { Editor } from 'react-live';

export default function PlaygroundLiveEditor({
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
