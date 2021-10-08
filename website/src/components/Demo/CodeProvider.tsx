import React, { memo, useState } from 'react';
import useUserPreferencesContext from '@theme/hooks/useUserPreferencesContext';

import CodeTabContext from './CodeTabContext';

interface Props<V extends { label: string; value: string }[]> {
  values: V;
  groupId?: string | null;
  defaultValue: V[number]['value'];
  children: React.ReactNode;
}

export function CodeProvider<V extends { label: string; value: string }[]>({
  defaultValue,
  groupId = null,
  values,
  children,
}: Props<V>) {
  const { tabGroupChoices, setTabGroupChoices } = useUserPreferencesContext();
  const [selectedValue, setLocalSelectedValue] = useState(defaultValue);

  if (groupId != null) {
    const choice = tabGroupChoices[groupId];
    if (
      choice != null &&
      choice !== selectedValue &&
      values.find(({ value }) => value === choice)
    ) {
      setLocalSelectedValue(choice as any);
    }
  }

  const setSelectedValue = (selectedTabValue: string) => {
    setLocalSelectedValue(selectedTabValue);

    if (groupId != null) {
      setTabGroupChoices(groupId, selectedTabValue);
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
