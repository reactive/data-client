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
  label,
}: {
  values: readonly { value: string; label?: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
  /** Accessible name. The homepage's REST / GraphQL switch is "Protocol". */
  label?: string;
}) {
  return (
    <TabList
      className={styles.segmented}
      label={label ?? translate({ id: 'demo.protocol', message: 'Protocol' })}
      pill
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
