import { GithubEntity, createGithubResource, GithubGqlEndpoint } from './Base';

export class Repository extends GithubEntity {
  readonly name: string = '';
  readonly fullName: string = '';
  readonly private: boolean = false;
  readonly description: string = '';
  readonly fork: boolean = false;
  readonly homepage: string = '';
  readonly language: string | null = null;
  readonly forksCount: number = 0;
  readonly stargazersCount: number = 0;
  readonly watchersCount: number = 0;
  readonly size: number = 0;
  readonly defaultBranch: string = 'master';
  readonly openIssuesCount: number = 0;
  readonly isTemplate: boolean = false;
  readonly topics: string[] = [];
  readonly hasIssues: boolean = false;
  readonly hasProjects: boolean = false;
  readonly hasWiki: boolean = false;
  readonly hasPages: boolean = false;
  readonly hasDownloads: boolean = false;
  readonly archived: boolean = false;
  readonly disabled: boolean = false;
  readonly visibility: 'public' | 'private' = 'public';
  readonly pushedAt: Date = new Date(0);
  readonly createdAt: Date = new Date(0);
  readonly updatedAt: Date = new Date(0);
  readonly templateRepository: null = null;
  readonly owner: { login: string } = { login: '' };

  static schema = {
    pushedAt: Date,
    createdAt: Date,
    updatedAt: Date,
  };

  pk() {
    return [this.owner.login, this.name].join(',');
  }

  // for the inheritance
  static get key() {
    return 'Repository';
  }
}

export class GqlRepository extends Repository {
  static process(input: any, parent: any, key: string | undefined) {
    // conform gql api to rest
    if ('stargazerCount' in input) {
      return {
        ...input,
        stargazersCount: input.stargazerCount,
        fork: input.isFork,
        forksCount: input.forkCount,
        private: input.isPrivate,
      };
    }

    return input;
  }
}

const base = createGithubResource({
  path: '/repos/:owner/:repo',
  schema: Repository,
});
export const RepositoryResource = {
  ...base,
  getByUser: base.getList.extend({
    path: '/users/:login/repos',
    body: undefined,
  }),
  getByPinned: GithubGqlEndpoint.query(
    (v: { login: string }) => `query getByPinned($login: String!) {
    user(login: $login) {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            owner { login }
            id
            description
            createdAt
            stargazerCount
            isFork
            forkCount
            isPrivate
          }
        }
      }
    }
  }`,
    { user: { pinnedItems: { nodes: [GqlRepository] } } },
  ),
};
export default RepositoryResource;
