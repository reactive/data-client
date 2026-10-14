import React from 'react';

/** Up/down arrows, devtools' network mark: the requests and responses the
 * fixtures stand in for (StoreIcon's stroke) */
export default function NetworkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M7 20V4" />
      <path d="m3 8 4-4 4 4" />
      <path d="M17 4v16" />
      <path d="m21 16-4 4-4-4" />
    </svg>
  );
}
