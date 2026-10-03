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

  test('selects a Vue SFC tab by its component name', () => {
    const documents = parseCodeDocuments(
      [
        code({ metastring: 'title="Post" collapsed' }, 'export {};'),
        code(
          {
            className: 'language-html',
            metastring: 'title="PostList.vue" collapsed',
          },
          '<template />',
        ),
      ],
      'PostList',
    );

    expect(documents.map(doc => doc.collapsed)).toEqual([true, false]);
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

  test('accepts an unquoted path', () => {
    expect(
      parseCodeDocuments([
        code({ metastring: 'path=Todo.ts' }, 'a'),
        code({ metastring: "title='T' path='src/b.ts' {1}" }, 'b'),
      ]).map(({ path }) => path),
    ).toEqual(['Todo.ts', 'src/b.ts']);
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
