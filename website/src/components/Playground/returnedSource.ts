/** What a function's source returns, as one line: an arrow's expression
 * body, or the argument of its body's last top-level `return`. A glance for
 * the Fixtures panel, read from the text (see fixture-source.js), so
 * undefined when the source doesn't fit those shapes.
 */
export function returnedSource(source: string): string | undefined {
  // the first `{` outside the parameters opens the body, unless an arrow
  // comes first
  let head = -1;
  scan(source, 0, (i, depth, quoted) => {
    if (
      !quoted &&
      depth === 0 &&
      (source[i] === '{' || source.startsWith('=>', i))
    ) {
      head = i;
      return true;
    }
  });
  if (head === -1) return;
  let body = head;
  if (source[head] === '=') {
    body = source.slice(head + 2).search(/\S/) + head + 2;
    if (source[body] !== '{') return oneLine(code(source, body));
  }
  let from = -1;
  scan(source, body + 1, (i, depth, quoted) => {
    if (depth < 0) return true;
    RETURN.lastIndex = i;
    if (!quoted && depth === 0 && RETURN.test(source)) from = RETURN.lastIndex;
  });
  return from === -1 ? undefined : oneLine(code(source, from));
}

const RETURN = /(?<![\w$.])return(?![\w$])/y;

/** The code from `from` to the end of its statement, without comments */
function code(source: string, from: number) {
  let text = '';
  scan(source, from, (i, depth, quoted) => {
    if (depth < 0 || (!quoted && depth === 0 && source[i] === ';')) {
      return true;
    }
    text += source[i];
  });
  return text;
}

/** Visits each character outside comments with the depth of brackets open
 * around it (a closing bracket counts as outside its pair) and whether it's
 * inside a string, until `visit` returns true; returns where it stopped, or
 * -1 */
function scan(
  source: string,
  from: number,
  visit: (i: number, depth: number, quoted: boolean) => boolean | void,
): number {
  let depth = 0;
  let quote = '';
  for (let i = from; i < source.length; i++) {
    const c = source[i];
    if (quote) {
      if (c === '\\') visit(i++, depth, true);
      else if (c === quote) quote = '';
      if (visit(i, depth, true)) return i;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c;
      if (visit(i, depth, true)) return i;
      continue;
    }
    if (source.startsWith('//', i)) {
      // keep the line break, so code on either side stays apart
      i = source.indexOf('\n', i) - 1;
      if (i < 0) return -1;
      continue;
    }
    if (source.startsWith('/*', i)) {
      i = source.indexOf('*/', i) + 1;
      if (i === 0) return -1;
      continue;
    }
    if (c === ')' || c === ']' || c === '}') depth--;
    if (visit(i, depth, false)) return i;
    if (c === '(' || c === '[' || c === '{') depth++;
  }
  return -1;
}

function oneLine(text: string) {
  text = text
    .replace(/\s+/g, ' ')
    // a multi-line literal's trailing comma reads as clutter on one line
    .replace(/,\s*([}\])])/g, ' $1')
    .trim();
  // `({ id })` reads as `{ id }`
  if (text[0] === '(') {
    const close = scan(
      text,
      0,
      (i, depth, quoted) => !quoted && depth === 0 && text[i] === ')',
    );
    if (close === text.length - 1) text = text.slice(1, -1).trim();
  }
  return text || undefined;
}
