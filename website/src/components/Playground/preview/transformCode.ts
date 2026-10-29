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

/** The documents as one program, in order. `;` keeps a half-typed statement
 * from absorbing the next document. */
export function joinDocuments(documents: readonly { value: string }[]) {
  return documents.map(document => document.value).join('\n;\n');
}

/** `transformCode`, as one block for react-live's scope function, whose
 * parameters are the scope: a block lets the code declare its own `Link` or
 * `Avatar` with `const` or `class` (a SyntaxError beside a parameter), and
 * the opening brace on the code's first line keeps error line numbers. */
export function scopeBlock(code: string): string {
  return `{${transformCode(code)}\n}`;
}

export default function transformCode(code: string): string {
  return code
    .replaceAll(STATIC_IMPORT, '')
    .replaceAll(EXPORT_LIST, '')
    .replaceAll(EXPORT_PREFIX, '');
}
