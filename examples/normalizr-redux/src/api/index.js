import { Octokit } from '@octokit/rest';

export default new Octokit({
  headers: {
    'user-agent': 'Normalizr Redux Example',
  },
}).rest;
