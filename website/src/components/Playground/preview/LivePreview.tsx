import { LiveProvider } from 'react-live';

import Preview from './Preview';
import { ResetButton } from './PreviewError';
import PreviewWrapper from './PreviewWrapper';
import { useRenderCount } from './RenderCount';
import { previewScope } from './scope';
import transformCode from './transformCode';
import { usePlaygroundConsoleDemotion } from './usePlaygroundConsoleDemotion';
import { usePreviewReset } from './usePreviewReset';
import type { PreviewProps } from '../types';

export interface LivePreviewProps<T> extends PreviewProps<T> {
  code: string;
  renderCount: boolean;
}

export default function LivePreview<T>({
  code,
  groupId,
  defaultOpen,
  row,
  fixtures,
  getInitialInterceptorData,
  renderCount,
}: LivePreviewProps<T>) {
  usePlaygroundConsoleDemotion();
  const { onCommit, badge } = useRenderCount(renderCount);
  const { key, initialState, controller, reset, ...handlers } =
    usePreviewReset(code);

  return (
    <LiveProvider
      key={key}
      code={code}
      transformCode={transformCode}
      enableTypeScript
      noInline
      scope={previewScope}
    >
      <PreviewWrapper
        headerControls={
          <>
            {badge}
            <ResetButton onClick={reset} />
          </>
        }
      >
        <Preview
          groupId={groupId}
          defaultOpen={defaultOpen}
          row={row}
          fixtures={fixtures}
          getInitialInterceptorData={getInitialInterceptorData}
          onCommit={onCommit}
          initialState={initialState}
          controller={controller}
          onReset={reset}
          {...handlers}
        />
      </PreviewWrapper>
    </LiveProvider>
  );
}
