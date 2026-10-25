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
