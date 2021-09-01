import BaseResource from './BaseResource';

export default abstract class PreviewResource extends BaseResource {
  static getFetchInit = (init: RequestInit) => ({
    ...init,
    headers: {
      ...init.headers,
      Accept: 'application/vnd.github.squirrel-girl-preview+json',
    },
  });
}
