import type React from 'react';

/** Steps for agents reading a page's markdown (.md and llms.txt), where the
 * site's `<SiteOnly>` prose tells readers what to ask their agent. Hidden on
 * the site; skill references drop it too, since the skill gives these steps.
 * The site's remark plugin (remarkFramework) removes it before the table of
 * contents is built, so it can hold headings and partials. */
export default function AgentOnly(_: { children: React.ReactNode }) {
  return null;
}
