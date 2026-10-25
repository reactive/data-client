import PlaygroundLiveEditor from '../PlaygroundLiveEditor';

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
  return <PlaygroundLiveEditor language={language} code={code} disabled />;
}
