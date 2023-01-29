import { useScrollPositionBlocker } from '@docusaurus/theme-common/internal';
import React, { memo, useState } from 'react';

import CodeTabContext from './CodeTabContext';
import { useTabStorage } from '../../utils/tabStorage';

interface Props<V extends { label: string; value: string }[]> {
  values: V;
  groupId?: string | null;
  defaultValue: V[number]['value'];
  children: React.ReactNode;
  playgroundRef: React.RefObject<HTMLElement>;
}

export function CodeProvider<V extends { label: string; value: string }[]>({
  defaultValue,
  groupId = null,
  values,
  playgroundRef,
  children,
}: Props<V>) {
  const [choice, setTabGroupChoice] = useTabStorage(
    `docusaurus.tab.${groupId}`,
  );
  const [selectedValue, setLocalSelectedValue] = useState(defaultValue);
  const { blockElementScrollPositionUntilNextRender } =
    useScrollPositionBlocker();

  if (
    choice != null &&
    choice !== selectedValue &&
    values.find(({ value }) => value === choice)
  ) {
    setLocalSelectedValue(choice as any);
  }

  const setSelectedValue = (
    event: React.FocusEvent<HTMLLIElement> | React.MouseEvent<HTMLLIElement>,
  ) => {
    const newTab = event.currentTarget;
    const newTabValue = newTab.getAttribute('value');

    if (newTabValue !== selectedValue) {
      blockElementScrollPositionUntilNextRender(playgroundRef.current);
      setLocalSelectedValue(newTabValue);

      if (groupId != null) {
        setTabGroupChoice(`${newTabValue}`);
      }
    }
  };

  const value = {
    selectedValue,
    values,
    setSelectedValue,
  };
  return (
    <CodeTabContext.Provider value={value}>{children}</CodeTabContext.Provider>
  );
}
export default memo(CodeProvider);
