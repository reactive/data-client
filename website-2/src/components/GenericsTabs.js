import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import React from 'react';

export default function GenericsTabs({ children }) {
  return (
    <Tabs
      defaultValue="simple"
      groupId="with-generics"
      values={[
        { label: 'Type', value: 'simple' },
        { label: 'With Generics', value: 'generics' },
      ]}
    >
      <TabItem value="simple">{children[0]}</TabItem>
      <TabItem value="generics">{children[1]}</TabItem>
    </Tabs>
  );
}
