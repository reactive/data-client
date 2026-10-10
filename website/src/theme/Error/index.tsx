import type { WrapperProps } from '@docusaurus/types';
import type ErrorType from '@theme/Error';
import Error from '@theme-original/Error';
import React from 'react';

import { useReloadIfStaleDeploy } from '../../staleDeploy';

type Props = WrapperProps<typeof ErrorType>;

/** App-level crash page; reloads instead when a new deploy removed a chunk */
export default function ErrorWrapper(props: Props): React.ReactElement {
  useReloadIfStaleDeploy(props.error);
  return <Error {...props} />;
}
