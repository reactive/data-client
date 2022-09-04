import { GithubEntity } from './Base';

export class Push extends GithubEntity {
  readonly pushId: number = -1;
  readonly size: number = 0;
  readonly distinctSize: number = 0;
  readonly ref: string = '';
  readonly head: string = '';
  readonly before: string = '';
  readonly commits: Commit[] = [];

  pk() {
    return `${this.pushId}`;
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
