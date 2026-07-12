import React, { useContext, memo, useRef, forwardRef } from 'react';
import type { ForwardedRef } from 'react';

import CodeProvider from './CodeProvider';
import CodeTabContext from './CodeTabContext';
import type { CodeTabValue } from './CodeTabContext';
import PlaygroundHeaderControls from './PlaygroundHeaderControls';
import HooksPlayground from '../HooksPlayground';

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/** Never rendered: parseCodeDocuments reads code + metadata from these elements' props. */
function PlaygroundCode({ children }: PlaygroundCodeProps) {
  return <code>{children}</code>;
}

const DemoPlayground = memo(
  forwardRef(function DemoPlayground(
    _props: object,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    const { selectedValue, values } = useContext(CodeTabContext);
    // One sandbox only — hidden siblings still mounted Monaco + DataProvider.
    const selected =
      values.find(value => value.value === selectedValue) ?? values[0];
    const {
      value,
      code,
      fixtures,
      getInitialInterceptorData,
      autoFocus = false,
    } = selected;

    return (
      <div ref={ref}>
        <HooksPlayground
          groupId="homepage-demo"
          row
          key={value}
          fixtures={fixtures}
          getInitialInterceptorData={getInitialInterceptorData}
          headerControls={<PlaygroundHeaderControls />}
        >
          {code.map(({ path, code: instanceCode, open }, i) => (
            <PlaygroundCode
              key={path}
              title={capitalizeFirstLetter(path)}
              path={`${value}/${path}.tsx`}
              collapsed={!open}
              autoFocus={autoFocus && code.length === i + 1}
            >
              {instanceCode}
            </PlaygroundCode>
          ))}
        </HooksPlayground>
      </div>
    );
  }),
);

interface PlaygroundCodeProps {
  children: string;
  title: string;
  path: string;
  collapsed: boolean;
  autoFocus?: boolean;
}

interface Props<T extends string> {
  codes: CodeTabValue[];
  defaultValue: T;
}

export default function CodeEditor<T extends string>({
  codes,
  defaultValue,
}: Props<T>) {
  const playgroundRef = useRef<HTMLDivElement>(null);

  return (
    <CodeProvider
      defaultValue={defaultValue}
      groupId="protocol"
      values={codes}
      playgroundRef={playgroundRef}
    >
      <DemoPlayground ref={playgroundRef} />
    </CodeProvider>
  );
}
