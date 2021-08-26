import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import React from 'react';

export default function LanguageTabs({ children }) {
  return (
    <Tabs
      defaultValue="ts"
      groupId="language"
      values={[
        { label: 'TypeScript', value: 'ts' },
        { label: 'JavaScript', value: 'js' },
      ]}
    >
      <TabItem value="ts">{children[0]}</TabItem>
      <TabItem value="js">{children[1]}</TabItem>
    </Tabs>
  );
}
