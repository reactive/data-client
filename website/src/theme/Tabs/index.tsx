/**
 * Docusaurus's Tabs (theme-classic 3.10.2), with motion like native tabs: the
 * underline slides to the picked tab and the content slides in from its
 * side, as when swiping between tabs on Android.
 *
 * Changed from upstream: the indicator in `TabList`, the `<ViewTransition>`
 * in `TabContent`, and `useAnimatedTabs`. It is a fork, not a wrapper,
 * because upstream `Tabs` builds its own context value.
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ThemeClassNames } from '@docusaurus/theme-common';
import {
  useScrollPositionBlocker,
  useTabsContextValue,
  useTabs,
  sanitizeTabsChildren,
  TabsProvider,
} from '@docusaurus/theme-common/internal';
import useIsBrowser from '@docusaurus/useIsBrowser';
import type { Props } from '@theme/Tabs';
import clsx from 'clsx';
import React, {
  addTransitionType,
  startTransition,
  useEffect,
  useId,
  useState,
  ViewTransition,
  type ReactNode,
} from 'react';

import styles from './styles.module.css';

/** Transition types: which side the picked tab is on */
const NEXT = 'tab-next';
const PREV = 'tab-prev';

function TabList({ className }: { className?: string }) {
  const { selectedValue, selectValue, tabValues, block } = useTabs();
  const id = useId();

  const tabRefs: (HTMLLIElement | null)[] = [];
  const { blockElementScrollPositionUntilNextRender } =
    useScrollPositionBlocker();

  const handleTabChange = (
    event:
      | React.FocusEvent<HTMLLIElement>
      | React.MouseEvent<HTMLLIElement>
      | React.KeyboardEvent<HTMLLIElement>,
  ) => {
    const newTab = event.currentTarget;
    const newTabIndex = tabRefs.indexOf(newTab);
    const newTabValue = tabValues[newTabIndex]!.value;

    if (newTabValue !== selectedValue) {
      blockElementScrollPositionUntilNextRender(newTab);
      selectValue(newTabValue);
    }
  };

  const handleKeydown = (event: React.KeyboardEvent<HTMLLIElement>) => {
    let focusElement: HTMLLIElement | null = null;

    switch (event.key) {
      case 'Enter': {
        handleTabChange(event);
        break;
      }
      case 'ArrowRight': {
        const nextTab = tabRefs.indexOf(event.currentTarget) + 1;
        focusElement = tabRefs[nextTab] ?? tabRefs[0]!;
        break;
      }
      case 'ArrowLeft': {
        const prevTab = tabRefs.indexOf(event.currentTarget) - 1;
        focusElement = tabRefs[prevTab] ?? tabRefs[tabRefs.length - 1]!;
        break;
      }
      default:
        break;
    }

    focusElement?.focus();
  };

  return (
    <ul
      role="tablist"
      aria-orientation="horizontal"
      className={clsx(
        'tabs',
        {
          'tabs--block': block,
        },
        className,
      )}
    >
      {tabValues.map(({ value, label, attributes }) => (
        <li
          role="tab"
          tabIndex={selectedValue === value ? 0 : -1}
          aria-selected={selectedValue === value}
          key={value}
          ref={ref => {
            tabRefs.push(ref);
          }}
          onKeyDown={handleKeydown}
          onClick={handleTabChange}
          {...attributes}
          className={clsx(
            'tabs__item',
            styles.tabItem,
            attributes?.className as string,
            {
              'tabs__item--active': selectedValue === value,
            },
          )}
        >
          {label ?? value}
          {selectedValue === value && (
            // one underline per Tabs, so it glides from tab to tab
            <ViewTransition
              name={`tabs-indicator-${id}`}
              share={styles.indicator}
              default="none"
            >
              <span className={styles.indicator} />
            </ViewTransition>
          )}
        </li>
      ))}
    </ul>
  );
}

function TabContent({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      update={{ [NEXT]: styles.next, [PREV]: styles.prev, default: 'none' }}
      default="none"
    >
      <div className="margin-top--md">{children}</div>
    </ViewTransition>
  );
}

function TabsContainer({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div
      className={clsx(
        ThemeClassNames.tabs.container,
        // former name kept for backward compatibility
        // see https://github.com/facebook/docusaurus/pull/4086
        'tabs-container',
        styles.tabList,
      )}
    >
      <TabList
        // Surprising but historical
        // className is applied on TabList, not on TabsContainer
        className={className}
      />
      <TabContent>{children}</TabContent>
    </div>
  );
}

/**
 * Picking a tab is a transition, so it animates: `picked` shows it until
 * Docusaurus's own selection catches up. Docusaurus also stores the pick
 * (syncing the tab group), but storage updates are synchronous and would land
 * the pick at once, so that waits for an effect, which React runs once the
 * view transition is done.
 */
function useAnimatedTabs(props: Props) {
  const synced = useTabsContextValue(props);
  const { selectValue } = synced;
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => {
    if (picked === null) return;
    selectValue(picked);
    setPicked(null);
  }, [picked, selectValue]);
  const selectedValue = picked ?? synced.selectedValue;
  const indexOf = (value: string) =>
    synced.tabValues.findIndex(tab => tab.value === value);
  return {
    ...synced,
    selectedValue,
    selectValue: (value: string) =>
      startTransition(() => {
        addTransitionType(
          indexOf(value) > indexOf(selectedValue) ? NEXT : PREV,
        );
        setPicked(value);
      }),
  };
}

export default function Tabs(props: Props): ReactNode {
  const isBrowser = useIsBrowser();
  const value = useAnimatedTabs(props);
  return (
    <TabsProvider
      value={value}
      // Remount tabs after hydration
      // Temporary fix for https://github.com/facebook/docusaurus/issues/5653
      key={String(isBrowser)}
    >
      <TabsContainer className={props.className}>
        {sanitizeTabsChildren(props.children)}
      </TabsContainer>
    </TabsProvider>
  );
}
