import { usePrismTheme } from '@docusaurus/theme-common';
import { Editor } from 'react-live';

/**
 * Prism-highlighted, non-editable code. Renders identically on server and
 * client, so it is the SSG/crawler markup and the placeholder until Monaco
 * mounts.
 */
export default function StaticEditor({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const theme = usePrismTheme();
  return <Editor theme={theme} language={language} code={code} disabled />;
}
