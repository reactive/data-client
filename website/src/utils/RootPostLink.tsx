// @docusaurus/Link on /next/ (docusaurus.config.ts aliases it there): links to
// posts from before the cut go straight to the root's copy (rootPost.ts), in
// the same tab, though Docusaurus opens absolute URLs in a new one.
import Link from '@docusaurus/core/lib/client/exports/Link';
import useBaseUrl from '@docusaurus/core/lib/client/exports/useBaseUrl';
import type { Props } from '@docusaurus/Link';
import React from 'react';

import { rootPost } from './rootPost';

export default React.forwardRef<HTMLAnchorElement, Props>(
  function RootPostLink(props, ref) {
    // as Link resolves it: /blog/... gains baseUrl
    const resolved = useBaseUrl(props.to ?? props.href ?? '');
    const root = rootPost(resolved);
    return root === resolved ?
        <Link {...props} ref={ref} />
      : <Link
          {...props}
          ref={ref}
          to={root}
          href={undefined}
          target="_self"
          rel={undefined}
        />;
  },
);
