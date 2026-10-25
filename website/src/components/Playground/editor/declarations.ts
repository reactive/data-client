import type { CodeDocument } from './codeModel';
import type { CodeTarget } from './openCode';

const DECLARATION =
  /\b(?:class|function|const|let|var|enum)\s+([A-Za-z_$][\w$]*)/g;

/** The names `source` declares, with where each declaration starts */
export function* declarationsIn(source: string) {
  for (const match of source.matchAll(DECLARATION))
    yield { name: match[1], index: match.index };
}

/** Where `documents` first declare each name */
export function declarationsOf(
  documents: readonly Pick<CodeDocument, 'path' | 'value'>[],
): ReadonlyMap<string, CodeTarget> {
  const declared = new Map<string, CodeTarget>();
  for (const { path, value } of documents) {
    let line = 1;
    let at = 0;
    for (const { name, index } of declarationsIn(value)) {
      for (; at < index; at++) if (value[at] === '\n') line++;
      if (!declared.has(name)) declared.set(name, { path, line });
    }
  }
  return declared;
}
