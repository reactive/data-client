import { useState } from 'react';

/** Tap (or click) toggles which item shows its exact-numbers tooltip, so touch screens get what hover gives desktop */
export default function usePerfTip(activeClassName: string) {
  const [active, setActive] = useState<string>();
  return (key: string, className = '') => ({
    tabIndex: 0,
    className: active === key ? `${className} ${activeClassName}` : className,
    onClick: () => setActive(current => (current === key ? undefined : key)),
    onBlur: () => setActive(current => (current === key ? undefined : current)),
  });
}
