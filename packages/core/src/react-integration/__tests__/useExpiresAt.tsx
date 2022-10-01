import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Endpoint, Entity } from '@rest-hooks/endpoint';
import { StateContext } from '@rest-hooks/core';

// relative imports to avoid circular dependency in tsconfig references

import { makeRenderRestHook, makeCacheProvider } from '../../../../test';
import { useExpiresAt } from '../hooks';
import { State, useDenormalized } from '../..';

export default class IDEntity extends Entity {
  readonly id: string | number | undefined = undefined;
  pk(parent?: any, key?: string): string | undefined {
    return `${this.id}`;
  }
}
class Ingredients extends IDEntity {
  readonly name = '';
}
class Tacos extends IDEntity {
  readonly type = '';
  readonly ingredients: Ingredients[] = [];

  static schema = {
    ingredients: [Ingredients],
  };
}

describe('useExpiresAt()', () => {
  let renderRestHook: ReturnType<typeof makeRenderRestHook>;
  beforeEach(() => {
    renderRestHook = makeRenderRestHook(makeCacheProvider);
  });

  it('age is minimum of entities', () => {
    const ListTaco = new Endpoint(
      (a: Record<string, unknown>) => Promise.resolve({}),
      {
        schema: [Tacos],
        key: () => 'listtaco',
      },
    );
    const state = {
      entities: {
        Tacos: {
          '1': { id: '1', type: 'foo', ingredients: ['1'] },
          '2': { id: '2', type: 'bar', ingredients: [] },
        },
        Ingredients: {
          '1': { id: '1', name: 'rice' },
        },
      },
      entityMeta: {
        Tacos: {
          '1': { date: 0, expiresAt: 1000, fetchedAt: 0 },
          '2': { date: 0, expiresAt: 2000, fetchedAt: 0 },
        },
        Ingredients: {
          '1': { date: 0, expiresAt: 500, fetchedAt: 0 },
        },
      },
      indexes: {},
      results: { [ListTaco.key({})]: ['1', '2'] },
      meta: {},
      optimistic: [],
      lastReset: -Infinity,
    };

    const wrapper = function ConfiguredCacheProvider({
      children,
    }: {
      children: React.ReactNode;
    }) {
      return (
        <StateContext.Provider value={state}>{children}</StateContext.Provider>
      );
    };

    const { result } = renderHook(
      () => {
        const { expiresAt } = useDenormalized(ListTaco, {}, state);
        return useExpiresAt(ListTaco, {}, expiresAt);
      },
      { wrapper },
    );
    expect(result.current).toBe(500);
  });

  it('age ignores unused entities', () => {
    const ListTaco = new Endpoint(
      (a: Record<string, unknown>) => Promise.resolve({}),
      {
        schema: [Tacos],
        key: () => 'listtaco',
      },
    );
    const DetailTaco = new Endpoint((a: { id: any }) => Promise.resolve({}), {
      schema: Tacos,
      key: ({ id }: { id: any }) => `detailtaco ${id}`,
    });
    const state: State<unknown> = {
      entities: {
        Tacos: {
          1: { id: '1', type: 'foo', ingredients: ['1'] },
          2: { id: '2', type: 'bar', ingredients: [] },
          3: { id: '3', type: 'a', ingredients: [] },
        },
        Ingredients: {
          1: { id: '1', name: 'rice' },
          2: { id: '2', name: 'beans' },
        },
      },
      entityMeta: {
        Tacos: {
          1: { date: 0, expiresAt: 1000, fetchedAt: 0 },
          2: { date: 0, expiresAt: 2000, fetchedAt: 0 },
          3: { date: 0, expiresAt: 0, fetchedAt: 0 },
        },
        Ingredients: {
          1: { date: 0, expiresAt: 500, fetchedAt: 0 },
          2: { date: 0, expiresAt: 0, fetchedAt: 0 },
        },
      },
      indexes: {},
      results: { [ListTaco.key({})]: ['1', '2'] },
      meta: {},
      optimistic: [],
      lastReset: -Infinity,
    };

    const wrapper = function ConfiguredCacheProvider({
      children,
    }: {
      children: React.ReactNode;
    }) {
      return (
        <StateContext.Provider value={state}>{children}</StateContext.Provider>
      );
    };

    const { result } = renderHook(
      () => {
        const { expiresAt } = useDenormalized(ListTaco, {}, state);
        return useExpiresAt(ListTaco, {}, expiresAt);
      },
      { wrapper },
    );
    expect(result.current).toBe(500);

    const { result: result2 } = renderHook(
      () => {
        const { expiresAt } = useDenormalized(DetailTaco, { id: '2' }, state);
        return useExpiresAt(DetailTaco, { id: '2' }, expiresAt);
      },
      { wrapper },
    );
    expect(result2.current).toBe(2000);
  });
});
