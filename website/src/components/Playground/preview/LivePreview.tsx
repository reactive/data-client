import { LiveProvider } from 'react-live';

import Preview from './Preview';
import PreviewWrapper from './PreviewWrapper';
import { previewScope } from './scope';
import transformCode from './transformCode';
import type { PreviewProps } from '../types';

export interface LivePreviewProps<T> extends PreviewProps<T> {
  code: string;
}

export default function LivePreview<T>({
  code,
  groupId,
  defaultOpen,
  row,
  fixtures,
  getInitialInterceptorData,
}: LivePreviewProps<T>) {
  return (
    <LiveProvider
      key="preview"
      code={code}
      transformCode={transformCode}
      enableTypeScript
      noInline
      scope={previewScope}
    >
      <PreviewWrapper>
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
