import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

interface Props {
  children: React.ReactNode;
}

export default function LanguageTabs({ children }: Props) {
  const [typescriptCode, javascriptCode] = React.Children.toArray(children);
  return (
    <Tabs
      defaultValue="ts"
      groupId="language"
      values={[
        { label: 'TypeScript', value: 'ts' },
        { label: 'JavaScript', value: 'js' },
      ]}
    >
      <TabItem value="ts">{typescriptCode}</TabItem>
      <TabItem value="js">{javascriptCode}</TabItem>
    </Tabs>
  );
}
