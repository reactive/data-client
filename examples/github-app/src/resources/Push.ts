import { GithubEntity } from './Base';

export class Push extends GithubEntity {
  pushId = -1;
  size = 0;
  distinctSize = 0;
  ref = '';
  head = '';
  before = '';
  commits: Commit[] = [];

  pk() {
    return this.pushId;
  }
}

interface Commit {
  sha: string;
  author: {
    email: string;
    name: string;
  };
  message: string;
  distinct: boolean;
  url: string;
}
