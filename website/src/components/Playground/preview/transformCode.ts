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

const IDENTIFIER = '([A-Za-z_$][\\w$]*)';
/** `export default function Name`, `class Name` or `Name;` (not an expression) */
const DEFAULT_EXPORT = new RegExp(
  `^[ \\t]*export[ \\t]+default[ \\t]+(?:(?:async[ \\t]+)?function\\s*\\*?\\s*${IDENTIFIER}|class\\s+${IDENTIFIER}|${IDENTIFIER}[ \\t]*;?[ \\t]*$)`,
  'm',
);

/** Name the code's default export keeps once `transformCode` strips `export default` */
export function defaultExportName(code: string): string | undefined {
  return DEFAULT_EXPORT.exec(code)
    ?.slice(1)
    .find(name => name !== undefined);
}

/** `let`, `const` and `class` declarations at the code's top level */
const LEXICAL_DECLARATION = new RegExp(
  `^(?:export[ \\t]+(?:default[ \\t]+)?)?(?:const|let|class)[ \\t]+${IDENTIFIER}`,
  'gm',
);

/** `scope` without the names the code declares: react-live passes scope as
 * parameters of the function the code runs in, where redeclaring one with
 * `const`, `let` or `class` is a SyntaxError (a demo's own `class Link`) */
export function withoutDeclared<S extends Record<string, unknown>>(
  scope: S,
  code: string,
): S {
  const declared = [...code.matchAll(LEXICAL_DECLARATION)]
    .map(([, name]) => name)
    .filter(name => name in scope);
  if (!declared.length) return scope;
  const own = { ...scope };
  for (const name of declared) delete own[name];
  return own;
}

export default function transformCode(code: string): string {
  return code
    .replaceAll(STATIC_IMPORT, '')
    .replaceAll(EXPORT_LIST, '')
    .replaceAll(EXPORT_PREFIX, '');
}
