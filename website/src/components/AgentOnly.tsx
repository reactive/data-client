import type React from 'react';

/** Steps for agents reading a page's markdown (.md and llms.txt), where the
 * site's `<SiteOnly>` prose tells readers what to ask their agent. Hidden on
 * the site; skill references drop it too, since the skill gives these steps.
 * Keep headings out of it: the site's table of contents would still list them. */
export default function AgentOnly(_: { children: React.ReactNode }) {
  return null;
}
