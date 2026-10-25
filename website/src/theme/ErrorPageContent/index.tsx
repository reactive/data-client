import type { WrapperProps } from '@docusaurus/types';
import type ErrorPageContentType from '@theme/ErrorPageContent';
import ErrorPageContent from '@theme-original/ErrorPageContent';
import React from 'react';

import { useReloadIfStaleDeploy } from '../../staleDeploy';

type Props = WrapperProps<typeof ErrorPageContentType>;

/** In-layout crash page; reloads instead when a new deploy removed a chunk */
export default function ErrorPageContentWrapper(
  props: Props,
): React.ReactElement {
  useReloadIfStaleDeploy(props.error);
  return <ErrorPageContent {...props} />;
}
