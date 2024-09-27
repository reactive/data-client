import { Temporal } from '@js-temporal/polyfill';

import { GithubEntity, githubResource, GithubGqlEndpoint } from './Base';

export class Repository extends GithubEntity {
  name = '';
  fullName = '';
  private = false;
  description = '';
  fork = false;
  homepage = '';
  language: string | null = null;
  forksCount = 0;
  stargazersCount = 0;
  watchersCount = 0;
  size = 0;
  defaultBranch = 'master';
  openIssuesCount = 0;
  isTemplate = false;
  topics: string[] = [];
  hasIssues = false;
  hasProjects = false;
  hasWiki = false;
  hasPages = false;
  hasDownloads = false;
  archived = false;
  disabled = false;
  visibility: 'public' | 'private' = 'public';
  pushedAt = Temporal.Instant.fromEpochSeconds(0);
  createdAt = Temporal.Instant.fromEpochSeconds(0);
  updatedAt = Temporal.Instant.fromEpochSeconds(0);
  templateRepository: null = null;
  owner = { login: '' };

  static schema = {
    pushedAt: Temporal.Instant.from,
    createdAt: Temporal.Instant.from,
    updatedAt: Temporal.Instant.from,
  };

  pk() {
    return [this.owner.login, this.name].join(',');
  }

  static key = 'Repository';
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

export const RepositoryResource = githubResource({
  path: '/repos/:owner/:repo',
  schema: Repository,
}).extend((base) => ({
  getByUser: base.getList.extend({
    path: '/users/:login/repos',
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
}));

export default RepositoryResource;
