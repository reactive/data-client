import { LiveEditor } from 'react-live';

/**
 * Prism-highlighted, non-editable code. Renders identically on server and
 * client, so it is the SSG/crawler markup and the placeholder until Monaco
 * mounts. Needs an EditorShell ancestor for its theme.
 */
export default function StaticEditor({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  return <LiveEditor language={language} code={code} disabled />;
}
