import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import React from 'react';

export default function BeforeAfterTabs({ children }) {
  return (
    <Tabs
      defaultValue="before"
      groupId="before-after"
      values={[
        { label: 'before', value: 'before' },
        { label: 'after', value: 'after' },
      ]}
    >
      <TabItem value="before">{children[0]}</TabItem>
      <TabItem value="after">{children[1]}</TabItem>
    </Tabs>
  );
}
