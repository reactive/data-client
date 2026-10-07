import clsx from 'clsx';
import React, { memo } from 'react';

import styles from '../styles.module.css';
import type SchemaRegistry from './store/schemaRegistry';
import StorePanel from './store/StorePanel';

function StoreInspector({
  toggle,
  selectedValue,
  registry,
}: {
  selectedValue: 'y' | 'n';
  toggle: React.MouseEventHandler<HTMLDivElement>;
  registry: SchemaRegistry;
}) {
  const isSelected = selectedValue === 'y';
  return (
    <>
      <StoreToggle onClick={toggle} open={isSelected} />
      {isSelected ?
        <StorePanel registry={registry} />
      : null}
    </>
  );
}
export default memo(StoreInspector);

/** Toggle row; also rendered (inert) by the preview loading fallback in ../index.tsx */
export function StoreToggle({
  onClick,
  open = true,
}: {
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  open?: boolean;
}) {
  return (
    <div className={styles.debugToggle} onClick={onClick}>
      Store
      <span
        className={clsx(
          styles.arrow,
          open ? styles.right : styles.left,
          styles.vertical,
        )}
      >
        ▶
      </span>
    </div>
  );
}
