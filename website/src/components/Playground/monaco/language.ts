/** Monaco's language id for a code fence's language */
export function extensionToMonacoLanguage(language: string) {
  const id = language.toLowerCase();
  if (id === 'tsx' || id === 'ts') return 'typescript';
  if (id === 'jsx' || id === 'js') return 'javascript';
  return id;
}

/** Monaco languages that `monaco/tokenize.ts` colors as Monaco does */
const TOKENIZED = new Set(['typescript', 'javascript', 'html', 'json']);

/** Whether fence language `language` gets Monaco's colors before Monaco loads */
export const isMonacoTokenized = (language: string) =>
  TOKENIZED.has(extensionToMonacoLanguage(language));
