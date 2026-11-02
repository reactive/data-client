/**
 * Strip ESM import/export wrappers so concatenated playground documents can run
 * under react-live (scope provides package imports; earlier files provide locals).
 *
 * Order matters: remove complete import / export-list declarations first, then
 * strip `export` prefixes from remaining declarations. That keeps Prettier
 * multiline imports from leaving orphan `} from '…'` syntax.
 */
const STATIC_IMPORT =
  /^[ \t]*import(?!\s*\(|\.)(?:(?:[\s\S]*?\bfrom\s*)|\s+)["'][^"'\r\n]+["']\s*;?[ \t]*(?:\/\/[^\r\n]*)?(?:\r?\n|$)/gm;

const EXPORT_LIST =
  /^[ \t]*export\s+(?:type\s+)?(?:\{[\s\S]*?\}|\*(?:\s+as\s+\w+)?)\s*(?:from\s*["'][^"'\r\n]+["'])?\s*;?[ \t]*(?:\/\/[^\r\n]*)?(?:\r?\n|$)/gm;

const EXPORT_PREFIX = /^[ \t]*export[ \t]+(?:default[ \t]+)?/gm;

/** Captures one identifier; each of DEFAULT_EXPORT's alternatives has one */
const IDENTIFIER = /([A-Za-z_$][\w$]*)/.source;
/** `export default function Name`, `class Name` or `Name;` (not an expression) */
const DEFAULT_EXPORT = new RegExp(
  String.raw`^[ \t]*export[ \t]+default[ \t]+(?:(?:async[ \t]+)?function(?![\w$])\s*\*?\s*${IDENTIFIER}|class\s+(?!extends\b)${IDENTIFIER}|${IDENTIFIER}[ \t]*;?[ \t]*$)`,
  'm',
);

/** Name the code's default export keeps once `transformCode` strips `export default` */
export function defaultExportName(code: string): string | undefined {
  return DEFAULT_EXPORT.exec(code)
    ?.slice(1)
    .find(name => name !== undefined);
}

/** Between documents in the program: `;` keeps a half-typed statement from
 * absorbing the next document */
const JOINER = '\n;\n';

/** The documents as one program, in order. */
export function joinDocuments(documents: readonly { value: string }[]) {
  return documents.map(document => document.value).join(JOINER);
}

/** Where line `line` (1-based) of `joinDocuments(documents)` is: its
 * document's path and line there. Nothing for a joiner's line or one past
 * the documents (a trailer). `transformCode` keeps lines, so it holds for the
 * code that runs */
export function documentLine(
  documents: readonly { value: string; path: string }[],
  line: number,
): { path: string; line: number } | undefined {
  let start = 1;
  for (const { value, path } of documents) {
    if (line < start) return;
    const lines = value.split('\n').length;
    if (line < start + lines) return { path, line: line - start + 1 };
    // the joiner's `;` takes a line of its own
    start += lines + 1;
  }
}

/** `transformCode`, as one block for react-live's scope function, whose
 * parameters are the scope: a block lets the code declare its own `Link` or
 * `Avatar` with `const` or `class` (a SyntaxError beside a parameter), and
 * the opening brace on the code's first line keeps error line numbers. */
export function scopeBlock(code: string): string {
  return `{${transformCode(code)}\n}`;
}

/** The line breaks in what a removed statement took, so the code after it
 * keeps its line numbers */
const keepLines = (removed: string) => removed.replace(/[^\n]/g, '');

/** The code without its import and export statements (export lists and
 * re-exports go; declarations lose their `export`), on the lines it had */
export default function transformCode(code: string): string {
  return code
    .replaceAll(STATIC_IMPORT, keepLines)
    .replaceAll(EXPORT_LIST, keepLines)
    .replaceAll(EXPORT_PREFIX, '');
}
