import { createContext } from 'react';

import type { CodeDocument } from './codeModel';

/** A line of one of the playground's files */
export interface CodeTarget {
  readonly path: string;
  readonly line: number;
}

/** What the playground's code declares, and a way to show a line of it: it
 * uncovers the code (closing a Store that slides over it), opens the file's
 * tab and puts the cursor there */
export interface CodeOpener {
  /** Where each name is first declared (a class, function or variable) */
  readonly declared: ReadonlyMap<string, CodeTarget>;
  readonly open: (target: CodeTarget) => void;
}
export const CodeOpenerContext = createContext<CodeOpener | null>(null);

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
