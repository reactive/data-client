import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

interface Props {
  children: React.ReactNode;
}

export default function GenericsTabs({ children }: Props) {
  const [simpleType, genericType] = React.Children.toArray(children);
  return (
    <Tabs
      defaultValue="simple"
      groupId="with-generics"
      values={[
        { label: 'Type', value: 'simple' },
        { label: 'With Generics', value: 'generics' },
      ]}
    >
      <TabItem value="simple">{simpleType}</TabItem>
      <TabItem value="generics">{genericType}</TabItem>
    </Tabs>
  );
}
