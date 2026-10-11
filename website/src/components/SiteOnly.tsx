import React from 'react';

/** Content for readers of the site, such as how to install a skill.
 * `yarn build:skills` drops it from skill references. */
export default function SiteOnly({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
