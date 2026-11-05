import { Entity } from '@data-client/endpoint';

import resource from '../src/resource';
import RestEndpoint from '../src/RestEndpoint';

// e.g. a zod discriminated union, or `A & (B | C)` input types
type Input = { email: string } & (
  { teamId: string; teamName: null } | { teamId: null; teamName: string }
);
declare const input: Input;
class Team extends Entity {
  id = '';
}

it('RestEndpoint accepts a value of the whole union body', () => {
  const register = new RestEndpoint({
    path: '/auth/register',
    method: 'POST',
    body: {} as Input,
  });
  register(input);
  register({ email: 'a', teamId: 'b', teamName: null });
  // @ts-expect-error neither member
  register({ email: 'a', teamId: null, teamName: null });
  // @ts-expect-error body is required
  register();

  const join = new RestEndpoint({
    path: '/teams/:id/members',
    method: 'POST',
    body: {} as Input,
  });
  join({ id: '1' }, input);
  // @ts-expect-error missing path params
  join(input);
});

it('RestEndpoint.extend() accepts a union body', () => {
  const join = new RestEndpoint({
    path: '/teams/:id/members',
    method: 'POST',
  }).extend({ body: {} as Input });
  join({ id: '1' }, input);
});

it('RestEndpoint accepts a non-object union', () => {
  const upload = new RestEndpoint({
    path: '/upload',
    method: 'POST',
    body: {} as FormData | Blob,
  });
  upload({} as FormData | Blob);
});

it('RestEndpoint keeps an optional body optional', () => {
  const save = new RestEndpoint({
    path: '/save',
    method: 'POST',
    body: {} as Input | undefined,
  });
  save(input);
  save();
  const saveOne = new RestEndpoint({
    path: '/save/:id',
    method: 'POST',
    body: {} as Input | undefined,
  });
  saveOne({ id: '1' }, input);
  saveOne({ id: '1' });
});

it('RestEndpoint keeps a body unioned with void optional', () => {
  const save = new RestEndpoint({
    path: '/save',
    method: 'POST',
    body: {} as { name: string } | void,
  });
  save({ name: 'a' });
  save();
});

it('resource() mutations accept a union body', () => {
  const TeamResource = resource({
    path: '/teams/:id',
    schema: Team,
    body: {} as Input,
  });
  TeamResource.update({ id: '1' }, input);
  TeamResource.partialUpdate({ id: '1' }, { email: 'a' });
  TeamResource.getList.push(input);
  // @ts-expect-error body is required
  TeamResource.update({ id: '1' });
});
