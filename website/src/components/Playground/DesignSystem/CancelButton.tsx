import { translate } from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import React from 'react';

/** A row's remove button (styled as `cancel` in design-system.css); with no
 * `onClick` it is a hidden placeholder that keeps the row's shape */
export function CancelButton({ onClick }: { onClick?: () => void }) {
  const cancelSrc = useBaseUrl('/img/cancel.png');
  return (
    <button
      type="button"
      className="cancel"
      aria-label={translate({
        id: 'playground.cancelButton.label',
        message: 'Remove',
      })}
      disabled={!onClick}
      onClick={onClick}
    >
      <img src={cancelSrc} width="16" height="16" alt="" />
    </button>
  );
}
