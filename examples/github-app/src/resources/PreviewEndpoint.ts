import { RestGenerics } from '@rest-hooks/experimental';

import { GithubEndpoint } from './Base';

export default class PreviewEndpoint<
  O extends RestGenerics,
> extends GithubEndpoint<O> {
  getFetchInit(body: any) {
    const init: any = { ...super.getFetchInit(body) };
    init.headers = {
      ...init.headers,
      Accept: 'application/vnd.github.squirrel-girl-preview+json',
    };
    return init;
  }
}
