import clsx from 'clsx';
import React from 'react';
import { LiveProvider } from 'react-live';

import Request from './Request';
import Response from './Response';
import styles from './Wrapper.module.css';
import { PlaygroundTextEdit } from '../Playground/PlaygroundTextEdit';
import playgroundstyles from '../Playground/styles.module.css';
import { useCode } from '../Playground/useCode';
import { useReactLiveTheme } from '../Playground/useReactLiveTheme';

export default function EndpointPlayground({
  input,
  init,
  response,
  status,
  children,
}: Props) {
  const { handleCodeChange, codes, codeTabs } = useCode(children);
  const realTheme = useReactLiveTheme();
  return (
    <div
      className={clsx(
        playgroundstyles.endpointPlayground,
        playgroundstyles.playgroundContainer,
        playgroundstyles.row,
      )}
    >
      <LiveProvider theme={realTheme} enableTypeScript={true}>
        <PlaygroundTextEdit
          fixtures={[]}
          row
          codeTabs={codeTabs}
          handleCodeChange={handleCodeChange}
          codes={codes}
          large={false}
          isPlayground={false}
        />
      </LiveProvider>

      <div className={clsx(styles.fixtureCol, playgroundstyles.previewWrapper)}>
        <Request input={input} init={init} />
        {status && response ?
          <Response status={status} response={response} />
        : null}
      </div>
    </div>
  );
}
interface Props {
  input: RequestInfo;
  init: RequestInit;
  response: JSON;
  status: number;
  children: React.ReactNode;
}
