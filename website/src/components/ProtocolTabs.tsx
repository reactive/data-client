import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React, { type ReactNode } from 'react';

export default function ProtocolTabs({
  children,
}: {
  children: [ReactNode, ReactNode];
}) {
  return (
    <Tabs
      defaultValue="rest"
      groupId="protocol"
      values={[
        { label: 'REST', value: 'rest' },
        { label: 'GraphQL', value: 'graphql' },
      ]}
    >
      <TabItem value="rest">{children[0]}</TabItem>
      <TabItem value="graphql">{children[1]}</TabItem>
    </Tabs>
  );
}
