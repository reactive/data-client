/// <reference types="jest" />

import transformCode, {
  defaultExportName,
  documentLine,
  joinDocuments,
} from '../transformCode';

describe('transformCode', () => {
  test('removes Prettier multiline imports', () => {
    expect(
      transformCode(
        `import {
  GQLEntity,
  GQLEndpoint,
} from '@data-client/graphql';
const x = 1;`,
      ),
    ).toBe('\n\n\n\nconst x = 1;');
  });

  test('removes type-bearing and relative imports', () => {
    expect(
      transformCode(
        `import { type Post, PostResource } from './resources';
render(PostResource);`,
      ),
    ).toBe('\nrender(PostResource);');
  });

  test('removes side-effect and import-type statements', () => {
    expect(
      transformCode(
        `import './setup'
import type { User } from './types'
const user: User = value;`,
      ),
    ).toBe('\n\nconst user: User = value;');
  });

  test('strips export prefixes from declarations', () => {
    expect(
      transformCode(
        `export type User = { id: string };
export const user = {} as User;
export default function App() {}`,
      ),
    ).toBe(
      `type User = { id: string };
const user = {} as User;
function App() {}`,
    );
  });

  test('removes export lists and re-exports', () => {
    expect(
      transformCode(
        `const X = 1;
export { X };
export type { User };
export { Y } from './y';
export * from './z';`,
      ),
    ).toBe('const X = 1;\n\n\n\n');
  });

  test('keeps GraphQL resource bodies after multiline import strip', () => {
    const input = `import {
  GQLEndpoint,
  GQLEntity,
  Collection,
} from '@data-client/graphql';

const gql = new GQLEndpoint('/');

export class User extends GQLEntity {
  name = '';
}

export const UserResource = {
  get: gql.query(\`query GetUser($id: ID!) { user(id: $id) { id } }\`, { user: User }),
};`;

    const output = transformCode(input);
    expect(output).not.toMatch(/\bfrom\b/);
    expect(output).toContain("const gql = new GQLEndpoint('/');");
    expect(output).toContain('class User extends GQLEntity');
    expect(output).toContain('const UserResource =');
    expect(output.trimStart().startsWith('GQLEndpoint')).toBe(false);
  });

  test('does not strip import.meta usage', () => {
    expect(
      transformCode(
        `const url = import.meta.url;
const x = 'value';`,
      ),
    ).toBe(
      `const url = import.meta.url;
const x = 'value';`,
    );
  });

  test('removes namespace re-exports', () => {
    expect(transformCode(`export * as ns from './x';\nconst y = 1;`)).toBe(
      '\nconst y = 1;',
    );
  });

  test('keeps every line where it was', () => {
    const input = `import {
  useSuspense,
} from '@data-client/react';
import { getTodo } from './api';
export { getTodo };

export default function TodoDetail() {
  return useSuspense(getTodo);
}`;
    const output = transformCode(input).split('\n');
    expect(output).toHaveLength(input.split('\n').length);
    expect(output[7]).toBe('  return useSuspense(getTodo);');
  });
});

describe('documentLine', () => {
  const documents = [
    { value: 'import a from "a";\nconst one = 1;', path: 'api.ts' },
    { value: 'const two = 2;', path: 'util.ts' },
    {
      value: 'import b from "b";\n\nfunction App() {\n  return two;\n}',
      path: 'App.tsx',
    },
  ];
  const program = joinDocuments(documents).split('\n');
  const at = (line: number) => {
    const found = documentLine(documents, line);
    return found && [found.path, found.line];
  };

  test('finds each document’s lines past the joiners', () => {
    expect(at(1)).toEqual(['api.ts', 1]);
    expect(at(2)).toEqual(['api.ts', 2]);
    expect(at(4)).toEqual(['util.ts', 1]);
    expect(at(6)).toEqual(['App.tsx', 1]);
    expect(at(9)).toEqual(['App.tsx', 4]);
    // every program line maps to the same text in its document
    program.forEach((text, i) => {
      const found = documentLine(documents, i + 1);
      const document = documents.find(d => d.path === found?.path);
      if (found) expect(document?.value.split('\n')[found.line - 1]).toBe(text);
    });
  });

  test('finds nothing on a joiner or past the documents', () => {
    expect(program[2]).toBe(';');
    expect(at(3)).toBeUndefined();
    expect(at(5)).toBeUndefined();
    expect(at(11)).toBeUndefined();
    expect(at(0)).toBeUndefined();
  });

  test('holds for the code that runs, imports stripped', () => {
    const running = transformCode(joinDocuments(documents)).split('\n');
    expect(running).toHaveLength(program.length);
    expect(running[8]).toBe('  return two;');
    expect(at(9)).toEqual(['App.tsx', 4]);
  });
});

describe('defaultExportName', () => {
  test.each([
    ['export default function PostList() {}', 'PostList'],
    ['export default async function Page() {}', 'Page'],
    ['export default class Board extends React.Component {}', 'Board'],
    ['const a = 1;\nexport default PostDetail;', 'PostDetail'],
    ['export default function () {}', undefined],
    ['export default class {}', undefined],
    ['export default class extends React.Component {}', undefined],
    ['export default memo(PostList);', undefined],
    ['export default functionPage;', 'functionPage'],
    ['export default function$x;', 'function$x'],
    ['function PostList() {}', undefined],
  ])('%s', (code, name) => {
    expect(defaultExportName(code)).toBe(name);
  });
});
