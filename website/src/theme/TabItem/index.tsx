import { useTabs } from '@docusaurus/theme-common/internal';
import type { Props } from '@theme/TabItem';
import TabItem from '@theme-original/TabItem';
import React from 'react';

import { HiddenProvider } from '../../components/Playground/hiddenContext';

/** An unselected tab is hidden (HiddenContext): its playgrounds pause until
 * it shows, and its code blocks draw once the page is idle. Not latched, so
 * a playground pauses again when its tab is unselected. */
export default function TabItemWrapper(props: Props) {
  const { selectedValue } = useTabs();
  return (
    <HiddenProvider hidden={props.value !== selectedValue}>
      <TabItem {...props} />
    </HiddenProvider>
  );
}
