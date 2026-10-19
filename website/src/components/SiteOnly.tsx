import React from 'react';

/** Content for readers of the site, such as how to install a skill.
 * Skill references and llms.txt drop it: agents read those. */
export default function SiteOnly({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
