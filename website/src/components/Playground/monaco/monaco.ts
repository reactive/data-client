/**
 * Monaco's bundled ESM build, limited to what the playground renders: every
 * editor feature, the CSS/HTML/JSON/TypeScript language services, and syntax
 * highlighting for the fence languages the docs use. Each language's
 * tokenizer, language service and worker is its own chunk, fetched only once
 * a model of that language exists.
 *
 * Touches `document` when it evaluates, so only ever load it with `import()`
 * from ./setup.ts.
 */
import 'monaco-editor/features/register.all';
import 'monaco-editor/languages/definitions/css/register';
import 'monaco-editor/languages/definitions/html/register';
import 'monaco-editor/languages/definitions/javascript/register';
import 'monaco-editor/languages/definitions/markdown/register';
import 'monaco-editor/languages/definitions/typescript/register';

export * from 'monaco-editor/editor';
// Also registers the language services; JSON highlighting comes from its service
export {
  css,
  html,
  json,
  typescript,
} from 'monaco-editor/languages/features/register.all';
