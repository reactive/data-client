import React, { useContext, memo } from 'react';

import CodeProvider from './CodeProvider';
import HooksPlayground from '../HooksPlayground';
import CodeTabContext from './CodeTabContext';

// eslint-disable-next-line react/display-name
const DemoPlayground = memo(() => {
  const { selectedValue, values } = useContext(CodeTabContext);

  return (
    <>
      {values.map(({ value, code }) => (
        <HooksPlayground
          groupId="homepage-demo"
          row
          key={value}
          hidden={value !== selectedValue}
        >
          {code}
        </HooksPlayground>
      ))}
    </>
  );
});

interface Props<T extends string> {
  codes: { label: string; value: T; code: string }[];
  defaultValue: T;
}

export default function CodeEditor<T extends string>({
  codes,
  defaultValue,
}: Props<T>) {
  return (
    <CodeProvider defaultValue={defaultValue} groupId="protocol" values={codes}>
      <DemoPlayground />
    </CodeProvider>
  );
}
