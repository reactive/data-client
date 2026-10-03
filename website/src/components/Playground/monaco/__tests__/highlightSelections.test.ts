/// <reference types="jest" />

import { highlightSelections } from '../highlightSelections';

const lines = (start: number, end: number) => ({
  selectionStartLineNumber: start,
  selectionStartColumn: 0,
  positionLineNumber: end,
  positionColumn: 0,
});

describe('highlightSelections', () => {
  test('selects nothing without lines', () => {
    expect(highlightSelections([])).toEqual([]);
  });

  test('selects a single line through the start of the next', () => {
    expect(highlightSelections([2])).toEqual([lines(2, 3)]);
  });

  test('merges consecutive lines and splits gaps', () => {
    expect(highlightSelections([1, 2, 3, 5, 7, 8])).toEqual([
      lines(1, 4),
      lines(5, 6),
      lines(7, 9),
    ]);
  });
});
