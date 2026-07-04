import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

interface Props {
  children: React.ReactNode;
}

export default function BeforeAfterTabs({ children }: Props) {
  const [before, after] = React.Children.toArray(children);
  return (
    <Tabs
      defaultValue="before"
      groupId="before-after"
      values={[
        { label: 'before', value: 'before' },
        { label: 'after', value: 'after' },
      ]}
    >
      <TabItem value="before">{before}</TabItem>
      <TabItem value="after">{after}</TabItem>
    </Tabs>
  );
}
