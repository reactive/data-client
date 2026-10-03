import React, { memo } from 'react';
import { LiveEditor } from 'react-live';

const MemoEditor = memo(LiveEditor);

export default function PlaygroundLiveEditor({
  onChange,
  code,
}: {
  onChange: (value: string) => void;
  code: string;
}) {
  return <MemoEditor onChange={onChange} code={code} />;
}
