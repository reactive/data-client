import { RestGenerics } from '@rest-hooks/rest';

import { GithubEndpoint } from './Base';

export default class PreviewEndpoint<
  O extends RestGenerics,
> extends GithubEndpoint<O> {
  getHeaders(headers: HeadersInit): HeadersInit {
    return {
      ...headers,
      Accept: 'application/vnd.github.squirrel-girl-preview+json',
    };
  }
}
