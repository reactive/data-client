import clsx from 'clsx';
import React, { useContext } from 'react';

import CodeTabContext from './CodeTabContext';
import styles from '../Playground/styles.module.css';

export default function PlaygroundHeaderControls() {
  const { selectedValue, setSelectedValue, values } =
    useContext(CodeTabContext);

  return (
    <div className={styles.tabs} role="tablist" aria-orientation="horizontal">
      {values.map(({ value, label }) => (
        <div
          role="tab"
          tabIndex={selectedValue === value ? 0 : -1}
          aria-selected={selectedValue === value}
          key={value}
          className={clsx(styles.tab, {
            [styles.selected]: selectedValue === value,
          })}
          onFocus={setSelectedValue}
          onClick={setSelectedValue}
          data-value={value}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
