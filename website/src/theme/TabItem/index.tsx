import { useTabs } from '@docusaurus/theme-common/internal';
import type { Props } from '@theme/TabItem';
import TabItem from '@theme-original/TabItem';
import React, { useContext } from 'react';

import { PlaygroundHiddenContext } from '../../components/Playground/hiddenContext';

/** An unselected tab's code and playgrounds wait until it shows
 * (PlaygroundHiddenContext) */
export default function TabItemWrapper(props: Props) {
  const { selectedValue } = useTabs();
  const inheritedHidden = useContext(PlaygroundHiddenContext);
  return (
    <PlaygroundHiddenContext.Provider
      value={inheritedHidden || props.value !== selectedValue}
    >
      <TabItem {...props} />
    </PlaygroundHiddenContext.Provider>
  );
}
