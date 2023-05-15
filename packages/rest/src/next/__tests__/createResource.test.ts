import { Entity, schema } from '@rest-hooks/endpoint';
import {
  CacheProvider,
  useCache,
  useController,
  Controller,
  useSuspense,
} from '@rest-hooks/react';
import { makeRenderRestHook } from '@rest-hooks/test';
import { act } from '@testing-library/react-hooks';
import nock from 'nock';

import createResource from '../createResource';
import RestEndpoint, { RestGenerics } from '../RestEndpoint';

describe('createResource()', () => {
  const renderRestHook: ReturnType<typeof makeRenderRestHook> =
    makeRenderRestHook(CacheProvider);
  let mynock: nock.Scope;

  class User extends Entity {
    readonly id: number | undefined = undefined;
    readonly username: string = '';
    readonly email: string = '';
    readonly isAdmin: boolean = false;

    pk() {
      return this.id?.toString();
    }
  }

  const UserResource = createResource({
    path: 'http\\://test.com/groups/:group/users/:id',
    schema: User,
  });

  const userPayload = {
    id: 5,
    username: 'ntucker',
    email: 'bob@vila.com',
    isAdmin: true,
  };

  beforeEach(() => {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .get(`/groups/five/users/${userPayload.id}`)
      .reply(200, userPayload)
      .get(`/groups/five/users`)
      .reply(200, [userPayload])
      .options(/.*/)
      .reply(200);
    mynock = nock(/.*/).defaultReplyHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('can override endpoint options', () => {
    const UserResource = createResource({
      path: 'http\\://test.com/groups/:group/users/:id',
      schema: User,
      getList: {
        path: ':blob',
        searchParams: {} as { isAdmin?: boolean },
        getOptimisticResponse(snap, params) {
          params.isAdmin;
          params.blob;
          // @ts-expect-error
          params.nothere;
          return [];
        },
        /*process(users: User[]) {
            return users.slice(0, 7);
          }, TODO: why doesn't this work?*/
      },
      partialUpdate: {
        getOptimisticResponse(snap, params, body) {
          params.id;
          params.group;
          // @ts-expect-error
          params.nothere;
          return {
            id: params.id,
            ...body,
          };
        },
      },
      delete: {
        getOptimisticResponse(snap, params) {
          return params;
        },
      },
      create: {
        process(users: any[]) {
          return users.slice(0, 7);
        },
      },
      endpoints: {
        justget: {},
        current: {
          path: '/current',
          searchParams: {} as { isAdmin?: boolean },
        },
        toggleAdmin: {
          path: '/toggle/:id',
          method: 'POST',
        },
      },
    });
    () => UserResource.getList({ blob: '5', isAdmin: true });
    () => UserResource.get({ group: '1', id: '5' });
    () => UserResource.create({ blob: '5' }, { username: 'bob' });
    () =>
      UserResource.create({ blob: '5', isAdmin: false }, { username: 'bob' });
    // @ts-expect-error
    () => UserResource.create({ group: 'bob' }, { username: 'bob' });
    () => UserResource.get({ id: 'hi', group: 'group' });
    () => UserResource.justget({ group: 'blob', id: '5' });
    // @ts-expect-error
    () => UserResource.justget({ id: '5' });
    () => UserResource.current();
    () => UserResource.current({ isAdmin: true });
    () => UserResource.toggleAdmin({ id: '5' });
    // @ts-expect-error
    () => UserResource.justget({ id: '5' });
  });
});
