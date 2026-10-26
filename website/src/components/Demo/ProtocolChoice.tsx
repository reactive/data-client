import { translate } from '@docusaurus/Translate';
import React, { useContext } from 'react';

import CodeTabContext from './CodeTabContext';
import styles from './styles.module.css';
import TabList from '../Playground/TabList';

/** A segmented control picking one of `values` (REST, GraphQL...) above a
 * playground: the homepage's demos, and PlaygroundTabs in the docs */
export function ProtocolSwitch({
  values,
  selectedValue,
  onSelect,
}: {
  values: readonly { value: string; label?: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  return (
    <TabList
      className={styles.segmented}
      label={translate({ id: 'demo.protocol', message: 'Protocol' })}
      tabs={values.map(({ value, label }) => ({
        key: value,
        label: label ?? value,
        selected: selectedValue === value,
        onSelect: () => onSelect(value),
      }))}
    />
  );
}

export default function ProtocolChoice() {
  const { selectedValue, setSelectedValue, values } =
    useContext(CodeTabContext);

  return (
    <ProtocolSwitch
      values={values}
      selectedValue={selectedValue}
      onSelect={setSelectedValue}
    />
  );
}
