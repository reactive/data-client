import React, { useContext } from 'react';

import CodeTabContext from './CodeTabContext';
import TabList from '../Playground/TabList';

export default function PlaygroundHeaderControls() {
  const { selectedValue, setSelectedValue, values } =
    useContext(CodeTabContext);

  return (
    <TabList
      tabs={values.map(({ value, label }) => ({
        key: value,
        label,
        selected: selectedValue === value,
        onSelect: () => setSelectedValue(value),
      }))}
    />
  );
}
