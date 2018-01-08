import { ArticleResource } from '../../__tests__/common';
import reducer from '../reducer';

describe('reducer', () => {
  it('handle get single', () => {
    const id = 20;
    const action = {
      type: 'receive' as 'receive',
      payload: { id, title: 'hi', content: 'this is the content' },
      meta: {
        schema: ArticleResource.getSchema(),
        url: ArticleResource.url({ id }),
        mutate: false,
        date: 5000000000,
        expiresAt: 5000500000,
      },
    };
    const iniState = {
      entities: {},
      results: {},
      meta: {},
    };
    const newState = reducer(iniState, action);
    expect(newState).toMatchSnapshot();
  });
  it('mutate should never change results', () => {
    const id = 20;
    const action = {
      type: 'receive' as 'receive',
      payload: { id, title: 'hi', content: 'this is the content' },
      meta: {
        schema: ArticleResource.getSchema(),
        url: ArticleResource.url({ id }),
        mutate: true,
        date: 5000000000,
        expiresAt: 5000500000,
      },
    };
    const iniState = {
      entities: {},
      results: { abc: '5' },
      meta: {},
    };
    const newState = reducer(iniState, action);
    expect(newState.results).toBe(iniState.results);
  });
  it('should set error in meta', () => {
    const id = 20;
    const error = new Error('hi');
    const action = {
      type: 'receive' as 'receive',
      payload: error,
      meta: {
        schema: ArticleResource.getSchema(),
        url: ArticleResource.url({ id }),
        mutate: false,
        date: 5000000000,
        expiresAt: 5000500000,
      },
      error: true,
    };
    const iniState = {
      entities: {},
      results: {},
      meta: {},
    };
    const newState = reducer(iniState, action);
    expect(newState).toMatchSnapshot();
  });
  it('other types should do nothing', () => {
    const action = {
      type: 'fetch' as 'fetch',
      payload: () => new Promise<any>(() => null),
      meta: {
        schema: ArticleResource.getSchema(),
        url: ArticleResource.url({ id: 5 }),
        mutate: true,
        throttle: true,
        reject: (v: any) => null,
        resolve: (v: any) => null,
      },
    };
    const iniState = {
      entities: {},
      results: { abc: '5' },
      meta: {},
    };
    const newState = reducer(iniState, action);
    expect(newState).toBe(iniState);
  })
});
