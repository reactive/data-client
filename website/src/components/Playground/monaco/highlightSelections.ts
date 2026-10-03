import type { ISelection } from 'monaco-editor';
import rangeParser from 'parse-numeric-range';

/**
 * Converts a code-fence highlight range (`{1-3,5}`) into Monaco selections,
 * merging consecutive lines into one whole-line selection each.
 */
export function highlightSelections(highlights: string): ISelection[] {
  const lines = rangeParser(highlights);
  if (!lines.length) return [];

  let selectionStartLineNumber = lines[0];
  let positionLineNumber = selectionStartLineNumber;
  const selections: ISelection[] = [];
  const pushSelection = () =>
    selections.push({
      selectionStartLineNumber,
      selectionStartColumn: 0,
      positionLineNumber,
      positionColumn: 0,
    });

  lines.forEach(lineNumber => {
    // more of same selection
    if (lineNumber === positionLineNumber) {
      positionLineNumber++;
    } else {
      pushSelection();
      selectionStartLineNumber = lineNumber;
      positionLineNumber = lineNumber + 1;
    }
  });
  pushSelection();
  return selections;
}
