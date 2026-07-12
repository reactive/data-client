import { useScrollPositionBlocker } from '@docusaurus/theme-common/internal';
import useIsomorphicLayoutEffect from '@docusaurus/useIsomorphicLayoutEffect';
import React, { memo, useState } from 'react';

import CodeTabContext from './CodeTabContext';
import type { CodeTabValue } from './CodeTabContext';
import { useTabStorage } from '../../utils/tabStorage';

interface Props<V extends CodeTabValue[]> {
  values: V;
  groupId?: string | null;
  defaultValue: V[number]['value'];
  children: React.ReactNode;
  playgroundRef: React.RefObject<HTMLElement | null>;
}

function isTabValue<V extends CodeTabValue[]>(
  values: V,
  choice: string,
): choice is V[number]['value'] {
  return values.some(({ value }) => value === choice);
}

export function CodeProvider<V extends CodeTabValue[]>({
  defaultValue,
  groupId = null,
  values,
  playgroundRef,
  children,
}: Props<V>) {
  const [choice, setTabGroupChoice] = useTabStorage(groupId);
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const { blockElementScrollPositionUntilNextRender } =
    useScrollPositionBlocker();

  // Local state stays interactive if storage no-ops; sync like Docusaurus tabs.
  useIsomorphicLayoutEffect(() => {
    if (choice != null && isTabValue(values, choice)) {
      setSelectedValue(choice);
    }
  }, [choice, values]);

  const value = {
    selectedValue,
    values,
    setSelectedValue: (newTabValue: string) => {
      if (!isTabValue(values, newTabValue) || newTabValue === selectedValue) {
        return;
      }
      const el = playgroundRef.current;
      if (el) {
        blockElementScrollPositionUntilNextRender(el);
      }
      setSelectedValue(newTabValue);
      setTabGroupChoice(newTabValue);
    },
  };
  return (
    <CodeTabContext.Provider value={value}>{children}</CodeTabContext.Provider>
  );
}
export default memo(CodeProvider);
