import React from 'react';
import { LiveProvider } from 'react-live';

import { previewScope } from './scope';
import { usePlaygroundConsoleDemotion } from './usePlaygroundConsoleDemotion';
import type { DemoViewport } from '../../DemoVideo/types';
import Preview from '../Preview';
import PreviewWrapper from '../PreviewWrapper';
import transformCode from '../transformCode';
import type { PreviewProps } from '../types';

export interface LivePreviewProps<T> extends PreviewProps<T> {
  code: string;
  viewport?: DemoViewport;
  headerControls?: React.ReactNode;
}

export default function LivePreview<T>({
  code,
  groupId,
  defaultOpen,
  row,
  fixtures,
  getInitialInterceptorData,
  viewport,
  headerControls,
}: LivePreviewProps<T>) {
  usePlaygroundConsoleDemotion();

  return (
    <LiveProvider
      key="preview"
      code={code}
      transformCode={transformCode}
      enableTypeScript
      noInline
      scope={previewScope}
    >
      <PreviewWrapper headerControls={headerControls} viewport={viewport}>
        <Preview
          groupId={groupId}
          defaultOpen={defaultOpen}
          row={row}
          fixtures={fixtures}
          getInitialInterceptorData={getInitialInterceptorData}
        />
      </PreviewWrapper>
    </LiveProvider>
  );
}
