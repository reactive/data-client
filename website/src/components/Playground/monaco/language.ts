/** Monaco's language id for a code fence's language */
export function extensionToMonacoLanguage(language: string) {
  const ext = language.toLowerCase();
  if (ext === 'tsx' || ext === 'ts') return 'typescript';
  if (ext === 'jsx' || ext === 'js') return 'javascript';
  return ext;
}

/** Monaco languages that `monaco/tokenize.ts` colors as Monaco does */
const TOKENIZED = new Set(['typescript', 'javascript', 'html', 'json']);

/** Whether fence language `language` gets Monaco's colors before Monaco loads */
export const isMonacoTokenized = (language: string) =>
  TOKENIZED.has(extensionToMonacoLanguage(language));
