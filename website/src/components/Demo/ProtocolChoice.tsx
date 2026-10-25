import { translate } from '@docusaurus/Translate';
import React, { useContext } from 'react';

import CodeTabContext from './CodeTabContext';
import styles from './styles.module.css';
import TabList from '../Playground/TabList';

/** REST or GraphQL: a segmented control above the homepage's playgrounds */
export default function ProtocolChoice() {
  const { selectedValue, setSelectedValue, values } =
    useContext(CodeTabContext);

  return (
    <TabList
      className={styles.segmented}
      label={translate({ id: 'demo.protocol', message: 'Protocol' })}
      tabs={values.map(({ value, label }) => ({
        key: value,
        label,
        selected: selectedValue === value,
        onSelect: () => setSelectedValue(value),
      }))}
    />
  );
}
