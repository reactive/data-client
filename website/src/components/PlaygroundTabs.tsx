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
import styles from './PlaygroundTabs.module.css';

/** Docusaurus `<Tabs>` with the homepage's segmented switch, for tabs that
 * each hold a playground or a standalone editor. Takes the same props and
 * `<TabItem>` children, so `groupId` choices stay in sync with every other
 * tab group. Unselected tabs' playgrounds stay mounted but run hidden
 * (HiddenContext, from theme/TabItem), so edits and each preview's store
 * survive switching back.
 * `label` names the switch; it defaults to "Protocol". */
export default function PlaygroundTabs({
  label,
  ...props
}: TabsProps & { label?: string }) {
  const isBrowser = useIsBrowser();
  const value = useTabsContextValue(props);
  const container = useRef<HTMLDivElement>(null);
  const { blockElementScrollPositionUntilNextRender } =
    useScrollPositionBlocker();

  return (
    // remount after hydration, as Docusaurus Tabs do (facebook/docusaurus#5653)
    <TabsProvider value={value} key={String(isBrowser)}>
      <div ref={container} className={styles.group} data-playground-group>
        <ProtocolSwitch
          label={label}
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
