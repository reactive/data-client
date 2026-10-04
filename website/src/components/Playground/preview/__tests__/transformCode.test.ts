/// <reference types="jest" />

import transformCode from '../transformCode';

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
    ).toBe('const x = 1;');
  });

  test('removes type-bearing and relative imports', () => {
    expect(
      transformCode(
        `import { type Post, PostResource } from './resources';
render(PostResource);`,
      ),
    ).toBe('render(PostResource);');
  });

  test('removes side-effect and import-type statements', () => {
    expect(
      transformCode(
        `import './setup'
import type { User } from './types'
const user: User = value;`,
      ),
    ).toBe('const user: User = value;');
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
    ).toBe('const X = 1;\n');
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
      'const y = 1;',
    );
  });
});
