// Options passed to extend() are checked against their types, and
// resource().extend() keeps every member of the resource it extends.
// Each @ts-expect-error line must keep erroring; plain lines must keep compiling.
import { User } from '__tests__/new';

import resource from '../src/resource';
import RestEndpoint from '../src/RestEndpoint';

const ep = new RestEndpoint({ path: '/users/:id', schema: User });
const UserResource = resource({ path: '/users/:id', schema: User });

/* ---------------- option types (plain ep.extend() is in extendPathsGetPage) ---------------- */
// @ts-expect-error
ep.extend({ path: '/u/:uid' }).extend({ dataExpiryLength: 'long' });
// @ts-expect-error
ep.extend({ path: '/u/:uid', dataExpiryLength: 'long' });
// @ts-expect-error
UserResource.get.extend({ dataExpiryLength: 'long' });
// @ts-expect-error
UserResource.extend('get', { dataExpiryLength: 'long' });
// @ts-expect-error
UserResource.extend('current', { dataExpiryLength: 'long' });
// @ts-expect-error
UserResource.extend({ get: { dataExpiryLength: 'long' } });

/* ---------------- resource().extend() keeps members ---------------- */
const CurrentUserResource = UserResource.extend('current', {
  path: '/user',
}).extend({ get: { dataExpiryLength: 1000 } });
export const current = CurrentUserResource.current();
export const get = CurrentUserResource.get({ id: 5 });
// deprecated, but still there at runtime
export const create = CurrentUserResource.create;
// @ts-expect-error not a member
CurrentUserResource.other;

// extend({...}) results can be extended again
const Chained = CurrentUserResource.extend({
  update: { dataExpiryLength: 5 },
}).extend('me', { path: '/me' });
export const chained = [
  Chained.current(),
  Chained.me(),
  Chained.get({ id: 1 }),
];
