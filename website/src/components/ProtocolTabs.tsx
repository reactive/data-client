import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import React from 'react';

export default function ProtocolTabs({ children }) {
  return (
    <Tabs
      defaultValue="rest"
      groupId="protocol"
      values={[
        { label: 'Rest', value: 'rest' },
        { label: 'GraphQL', value: 'gql' },
      ]}
    >
      <TabItem value="rest">{children[0]}</TabItem>
      <TabItem value="gql">{children[1]}</TabItem>
    </Tabs>
  );
}
