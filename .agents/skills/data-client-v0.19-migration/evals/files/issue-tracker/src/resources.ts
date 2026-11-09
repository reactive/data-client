import { Entity, resource } from '@data-client/rest';

const urlPrefix = 'https://api.example.com';

export class Issue extends Entity {
  id = 0;
  title = '';
  body = '';
}
export const IssueResource = resource({
  urlPrefix,
  path: '/issues/:id',
  schema: Issue,
});

export class Comment extends Entity {
  id = 0;
  issueId = 0;
  body = '';
}
export const CommentResource = resource({
  urlPrefix,
  path: '/issues/:issueId/comments/:id',
  schema: Comment,
});

export class Settings extends Entity {
  id = 'me';
  theme: 'light' | 'dark' = 'light';
  pageSize = 25;
}
export const SettingsResource = resource({
  urlPrefix,
  path: '/settings/:id',
  schema: Settings,
});
