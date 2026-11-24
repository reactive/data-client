import { readdirSync, readFileSync } from 'fs';
import { join, relative } from 'path';

/* Chrome rechecks a :has() that has more selector after it (`.a:has(.b) .c`)
 * from the page's root: changing any attribute, class or state named inside
 * one, on any element, restyles everything those rules match, page-wide.
 * See the Playground README's Design system. */

// all of the site's CSS; CI's test jobs have only the Playground's and
// motion's (setup's persist_to_workspace)
const SRC = join(__dirname, '../../..');

// each an element few pages have, behind a change that is rare
const ALLOWED = [
  // focus moving by keyboard shows a tip
  '.anchor:is(:focus-visible, :has(:focus-visible), [data-open]) > .tip',
  '.terminal:has(:focus-visible) .tip',
  '.sourcePeekHost:has(:focus-visible) .sourcePeek',
  // a demo's navigation appearing in a tight header
  '.previewHeader:has(.routerControls) .liveLabelText',
  // a person's avatar appearing in a demo's group label
  '.playground-preview section > h3:has(> .avatar) + .list',
];

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory())
      return entry.name === '__tests__' ? [] : cssFiles(path);
    return entry.name.endsWith('.css') ? [path] : [];
  });
}

/** Each rule's selectors (the comma-separated parts before its `{`) */
function selectorsOf(css: string): string[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '{') {
      const prelude = text.slice(start, i).trim();
      if (!prelude.startsWith('@')) selectors.push(...splitTop(prelude, ','));
      start = i + 1;
    } else if (c === '}' || c === ';') {
      start = i + 1;
    }
  }
  return selectors.map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

/** `text` split at `separator` outside parentheses and brackets */
function splitTop(text: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let from = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === separator && depth === 0) {
      parts.push(text.slice(from, i));
      from = i + 1;
    }
  }
  parts.push(text.slice(from));
  return parts;
}

/** A :has() with a combinator after its compound, or on html or body */
function checkedFromRoot(selector: string): boolean {
  if (/(^|[\s(>+~])(html|body)(\[[^\]]*\]|\.[\w-]+)*:has\(/.test(selector))
    return true;
  let depth = 0;
  let seenHas = false;
  for (let i = 0; i < selector.length; i++) {
    const c = selector[i];
    if (selector.startsWith(':has(', i)) seenHas = true;
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (depth === 0 && seenHas && /[\s>+~]/.test(c)) return true;
  }
  return false;
}

describe('site CSS', () => {
  it('keeps :has() in the last part of a rule, off html and body', () => {
    const found = cssFiles(SRC).flatMap(file =>
      selectorsOf(readFileSync(file, 'utf8'))
        .filter(checkedFromRoot)
        .filter(selector => !ALLOWED.includes(selector))
        .map(selector => `${relative(SRC, file)}: ${selector}`),
    );
    expect(found).toEqual([]);
  });

  it('finds such rules', () => {
    expect(checkedFromRoot('.row:has(> .x) .y')).toBe(true);
    expect(checkedFromRoot('.row:has(> .x) > .y::after')).toBe(true);
    expect(checkedFromRoot('.a .b:is(.c, :has(.d)) + .e')).toBe(true);
    expect(checkedFromRoot(':global(html:has(.navbar)) .panel')).toBe(true);
    expect(checkedFromRoot('body:has(.modal)')).toBe(true);
    expect(checkedFromRoot('.row > .x:has(~ .y)')).toBe(false);
    expect(checkedFromRoot('.row:not(.stacked):has(> .x)::before')).toBe(false);
    expect(checkedFromRoot('.a > .b:not([data-x]) ~ .c')).toBe(false);
  });
});
