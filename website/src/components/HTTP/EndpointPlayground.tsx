import clsx from 'clsx';
import React from 'react';

import Request from './Request';
import Response from './Response';
import styles from './Wrapper.module.css';
import { useCodeDocuments } from '../Playground/editor/codeModel';
import EditorShell from '../Playground/editor/EditorShell';
import EditorSurface from '../Playground/editor/EditorSurface';
import playgroundstyles from '../Playground/styles.module.css';

export default function EndpointPlayground({
  input,
  init,
  response,
  status,
  children,
}: Props) {
  const model = useCodeDocuments(children);

  return (
    <EditorShell>
      <div className={playgroundstyles.playgroundQueryContainer}>
        <div
          className={clsx(
            playgroundstyles.endpointPlayground,
            playgroundstyles.playgroundContainer,
            playgroundstyles.row,
          )}
        >
          <EditorSurface {...model} layout="row" variant="standalone" />
          <div
            className={clsx(styles.fixtureCol, playgroundstyles.previewWrapper)}
          >
            <Request input={input} init={init} />
            {status ?
              <Response status={status} response={response} />
            : null}
          </div>
        </div>
      </div>
    </EditorShell>
  );
}

interface Props {
  input: RequestInfo;
  init: RequestInit;
  response: JSON;
  status: number;
  children: React.ReactNode;
}
