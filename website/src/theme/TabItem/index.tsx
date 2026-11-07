import { useTabs } from '@docusaurus/theme-common/internal';
import type { Props } from '@theme/TabItem';
import TabItem from '@theme-original/TabItem';
import React from 'react';

import { HiddenProvider } from '../../components/Playground/hiddenContext';

/** An unselected tab's code and playgrounds wait until it shows
 * (HiddenContext). Not latched: a playground there pauses while hidden. */
export default function TabItemWrapper(props: Props) {
  const { selectedValue } = useTabs();
  return (
    <HiddenProvider hidden={props.value !== selectedValue}>
      <TabItem {...props} />
    </HiddenProvider>
  );
}
