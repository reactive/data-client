// @docusaurus/Link wherever another site serves some posts (docusaurus.config.ts
// aliases it there): links to those posts go straight to that site's copy
// (postSite.ts), in the same tab, though Docusaurus opens absolute URLs in a
// new one.
import Link from '@docusaurus/core/lib/client/exports/Link';
import useBaseUrl from '@docusaurus/core/lib/client/exports/useBaseUrl';
import type { Props } from '@docusaurus/Link';
import React from 'react';

import { postSite } from './postSite';

export default React.forwardRef<HTMLAnchorElement, Props>(
  function PostSiteLink(props, ref) {
    // as Link resolves it: /blog/... gains baseUrl
    const resolved = useBaseUrl(props.to ?? props.href ?? '');
    const owner = postSite(resolved);
    return owner === resolved ?
        <Link {...props} ref={ref} />
      : <Link
          {...props}
          ref={ref}
          to={owner}
          href={undefined}
          target="_self"
          rel={undefined}
        />;
  },
);
