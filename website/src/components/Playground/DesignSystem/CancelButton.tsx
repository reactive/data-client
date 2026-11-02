import { translate } from '@docusaurus/Translate';
import React from 'react';

/** A row's remove button (styled as `cancel` in design-system.css); with no
 * `onClick` it is a hidden placeholder that keeps the row's shape. `label`
 * names what it removes ("Remove Ceramic mug") */
export function CancelButton({
  onClick,
  label,
}: {
  onClick?: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      className="cancel"
      aria-label={
        label ||
        translate({
          id: 'playground.cancelButton.label',
          message: 'Remove',
        })
      }
      disabled={!onClick}
      onClick={onClick}
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );
}
