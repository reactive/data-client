/// <reference types="jest" />

import React from 'react';

import { parseCodeDocuments, updateDocument } from '../codeModel';

describe('code document model', () => {
  test('parses a string as one editable TypeScript document', () => {
    expect(parseCodeDocuments('const value = 1;\n')).toEqual([
      {
        value: 'const value = 1;',
        collapsed: false,
        path: 'default.tsx',
        language: 'tsx',
      },
    ]);
  });

  test('parses metadata and selects the requested default tab', () => {
    const documents = parseCodeDocuments(
      [
        code(
          {
            className: 'language-typescript',
            metastring: 'title="Before" path="src/before.ts" column {1-2}',
          },
          'const before = true;\n',
        ),
        code({ metastring: 'title="After" collapsed' }, 'const after = true;'),
      ],
      'After',
    );

    expect(documents).toMatchObject([
      {
        value: 'const before = true;',
        title: 'Before',
        path: 'src/before.ts',
        language: 'typescript',
        highlights: '1-2',
        col: true,
        collapsed: true,
      },
      {
        value: 'const after = true;',
        title: 'After',
        path: 'After.tsx',
        collapsed: false,
      },
    ]);
  });

  test('updates only the addressed document', () => {
    const documents = parseCodeDocuments([
      code({ metastring: 'title="One"' }, 'one'),
      code({ metastring: 'title="Two"' }, 'two'),
    ]);

    const updated = updateDocument(documents, 1, 'changed');
    expect(updated[0]).toBe(documents[0]);
    expect(updated[1]).toEqual({ ...documents[1], value: 'changed' });
  });
});

function code(props: Record<string, unknown>, children: string) {
  return React.createElement('code', props, children);
}
