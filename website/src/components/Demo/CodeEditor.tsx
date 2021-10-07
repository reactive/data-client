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

interface Props {
  codes: { label: string; value: string; code: string }[];
}

export default function CodeEditor({ codes }: Props) {
  return (
    <CodeProvider
      defaultValue={codes[0].value}
      groupId="protocol"
      values={codes}
    >
      <DemoPlayground />
    </CodeProvider>
  );
}
