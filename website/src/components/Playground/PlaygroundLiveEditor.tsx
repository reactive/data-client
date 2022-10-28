import React, { memo } from 'react';
import { LiveEditor } from 'react-live';

const MemoEditor = memo(LiveEditor);

export default function PlaygroundLiveEditor({ onChange, code }) {
  //const isBrowser = useIsBrowser(); we used to key Editor on this; but I'm not sure why
  return <MemoEditor onChange={onChange} code={code} />;
}
