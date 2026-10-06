import CodeBlock from '@theme/CodeBlock';
import type { ReactNode } from 'react';

import { parseCodeDocuments } from './Playground/editor/codeModel';
import providerSetup, {
  type Platform,
} from '../../framework-docs/providerSetup.mjs';

/**
 * App setup file that renders DataProvider (React) or DataClientPlugin (Vue),
 * passing `managers` when given.
 * Used by docs/core/shared/_provider_managers.mdx and _installation.mdx
 *
 * @param imports names imported from `@data-client/react` or `@data-client/vue`
 * @param children optional code block defining `managers`
 */
export default function ProviderSetupCode({
  platform,
  imports,
  children,
}: {
  platform: Platform;
  imports?: string[];
  children?: ReactNode;
}) {
  const managers =
    children ? parseCodeDocuments(children)[0]?.value : undefined;
  if (children && !managers)
    throw new Error('<ProviderSetupCode> children must be a code block');
  const { title, language, code } = providerSetup({
    platform,
    imports,
    managers,
  });
  return (
    <CodeBlock language={language} title={title}>
      {code}
    </CodeBlock>
  );
}
