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

/** `export default function Name`, `class Name` or `Name;` (not an expression) */
const DEFAULT_EXPORT =
  /^[ \t]*export[ \t]+default[ \t]+(?:(?:async[ \t]+)?function\s*\*?\s*([A-Za-z_$][\w$]*)|class\s+(?!extends\b)([A-Za-z_$][\w$]*)|([A-Za-z_$][\w$]*)[ \t]*;?[ \t]*$)/m;

/** Name the code's default export keeps once `transformCode` strips `export default` */
export function defaultExportName(code: string): string | undefined {
  return DEFAULT_EXPORT.exec(code)
    ?.slice(1)
    .find(name => name !== undefined);
}

export default function transformCode(code: string): string {
  return code
    .replaceAll(STATIC_IMPORT, '')
    .replaceAll(EXPORT_LIST, '')
    .replaceAll(EXPORT_PREFIX, '');
}
