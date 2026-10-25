import {
  sanitizeTabsChildren,
  TabsProvider,
  useScrollPositionBlocker,
  useTabsContextValue,
  type TabsProps,
} from '@docusaurus/theme-common/internal';
import useIsBrowser from '@docusaurus/useIsBrowser';
import React, { useRef } from 'react';

import { ProtocolSwitch } from './Demo/ProtocolChoice';

/** Docusaurus `<Tabs>` with the homepage's segmented switch, for tabs that
 * each hold a playground. Takes the same props and `<TabItem>` children, so
 * `groupId` choices stay in sync with every other tab group */
export default function PlaygroundTabs(props: TabsProps) {
  const isBrowser = useIsBrowser();
  const value = useTabsContextValue(props);
  const container = useRef<HTMLDivElement>(null);
  const { blockElementScrollPositionUntilNextRender } =
    useScrollPositionBlocker();

  return (
    // remount after hydration, as Docusaurus Tabs do (facebook/docusaurus#5653)
    <TabsProvider value={value} key={String(isBrowser)}>
      <div ref={container}>
        <ProtocolSwitch
          values={value.tabValues}
          selectedValue={value.selectedValue}
          onSelect={newValue => {
            if (newValue === value.selectedValue) return;
            if (container.current)
              blockElementScrollPositionUntilNextRender(container.current);
            value.selectValue(newValue);
          }}
        />
        {sanitizeTabsChildren(props.children)}
      </div>
    </TabsProvider>
  );
}
