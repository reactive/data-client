/* eslint-disable @typescript-eslint/no-unused-expressions */
// this lets us validate the published/built types
import { RestEndpoint } from '@data-client/rest';

// path: '/todos'
() => {
  const optionalUndefSearch = new RestEndpoint({
    path: '/todos',
    searchParams: {} as
      | {
          userId?: string | number;
        }
      | undefined,
  });
  const optionalSearch = new RestEndpoint({
    path: '/todos',
    searchParams: {} as {
      userId?: string | number;
    },
  });
  const undef = new RestEndpoint({
    path: '/todos',
    searchParams: undefined,
  });
  const requiredSearch = new RestEndpoint({
    path: '/todos',
    searchParams: {} as {
      userId: string | number;
    },
  });
  const noSearch = new RestEndpoint({
    path: '/todos',
  });
  () => optionalUndefSearch();
  () => optionalUndefSearch({});
  () => optionalUndefSearch({ userId: 'hi' });
  // @ts-expect-error
  () => optionalUndefSearch(5);
  // @ts-expect-error
  () => optionalUndefSearch({ userId: 'hi' }, { userId: 'hi' });

  () => optionalSearch();
  () => optionalSearch({});
  () => optionalSearch({ userId: 'hi' });
  // @ts-expect-error
  () => optionalSearch(5);
  // @ts-expect-error
  () => optionalSearch({ userId: 'hi' }, { userId: 'hi' });

  // @ts-expect-error
  () => requiredSearch();
  // @ts-expect-error
  () => requiredSearch({});
  () => requiredSearch({ userId: 'hi' });
  // @ts-expect-error
  () => requiredSearch(5);
  // @ts-expect-error
  () => requiredSearch({ userId: 'hi' }, { userId: 'hi' });

  () => undef();
  // @ts-expect-error
  () => undef({});
  // @ts-expect-error
  () => undef({ userId: 'hi' });
  // @ts-expect-error
  () => undef(5);

  () => noSearch();
  // @ts-expect-error
  () => noSearch({});
  // @ts-expect-error
  () => noSearch({ userId: 'hi' });
  // @ts-expect-error
  () => noSearch(5);
};
// path: '/todos/:id?'
() => {
  const optionalUndefSearch = new RestEndpoint({
    path: '/todos/:id?',
    searchParams: {} as
      | {
          userId?: string | number;
        }
      | undefined,
  });
  const optionalSearch = new RestEndpoint({
    path: '/todos/:id?',
    searchParams: {} as {
      userId?: string | number;
    },
  });
  const undef = new RestEndpoint({
    path: '/todos/:id?',
    searchParams: undefined,
  });
  const requiredSearch = new RestEndpoint({
    path: '/todos/:id?',
    searchParams: {} as {
      userId: string | number;
    },
  });
  const noSearch = new RestEndpoint({
    path: '/todos/:id?',
  });
  () => optionalUndefSearch();
  () => optionalUndefSearch({});
  () => optionalUndefSearch({ id: '5' });
  () => optionalUndefSearch({ userId: 'hi' });
  () => optionalUndefSearch({ userId: 'hi', id: '5' });
  // @ts-expect-error
  () => optionalUndefSearch(5);
  // @ts-expect-error
  () => optionalUndefSearch({ userId: 'hi' }, { userId: 'hi' });

  () => optionalSearch();
  () => optionalSearch({});
  () => optionalSearch({ id: '5' });
  () => optionalSearch({ userId: 'hi' });
  () => optionalSearch({ userId: 'hi', id: '5' });
  // @ts-expect-error
  () => optionalSearch(5);
  // @ts-expect-error
  () => optionalSearch({ userId: 'hi' }, { userId: 'hi' });

  // @ts-expect-error
  () => requiredSearch();
  // @ts-expect-error
  () => requiredSearch({});
  // @ts-expect-error
  () => requiredSearch({ id: '5' });
  () => requiredSearch({ userId: 'hi' });
  () => requiredSearch({ userId: 'hi', id: '5' });
  // @ts-expect-error
  () => requiredSearch(5);
  // @ts-expect-error
  () => requiredSearch({ userId: 'hi' }, { userId: 'hi' });

  () => undef();
  // @ts-expect-error
  () => undef({ userId: 'hi' });
  // @ts-expect-error
  () => undef(5);

  () => noSearch();
  () => noSearch({});
  () => noSearch({ id: '5' });
  // @ts-expect-error
  () => noSearch({ userId: 'hi' });
  // @ts-expect-error
  () => noSearch(5);
};
// path: '/todos/:id'
() => {
  const optionalUndefSearch = new RestEndpoint({
    path: '/todos/:id',
    searchParams: {} as
      | {
          userId?: string | number;
        }
      | undefined,
  });
  const optionalSearch = new RestEndpoint({
    path: '/todos/:id',
    searchParams: {} as {
      userId?: string | number;
    },
  });
  const undef = new RestEndpoint({
    path: '/todos/:id',
    searchParams: undefined,
  });
  const requiredSearch = new RestEndpoint({
    path: '/todos/:id',
    searchParams: {} as {
      userId: string | number;
    },
  });
  const noSearch = new RestEndpoint({
    path: '/todos/:id',
  });
  // @ts-expect-error
  () => optionalUndefSearch();
  () => optionalUndefSearch({ id: '5' });
  () => optionalUndefSearch({ id: '5', userId: 'hi' });
  // @ts-expect-error
  () => optionalUndefSearch(5);
  () =>
    // @ts-expect-error
    optionalUndefSearch({ id: '5', userId: 'hi' }, { id: '5', userId: 'hi' });

  // @ts-expect-error
  () => optionalSearch();
  () => optionalSearch({ id: '5' });
  () => optionalSearch({ id: '5', userId: 'hi' });
  // @ts-expect-error
  () => optionalSearch(5);
  // @ts-expect-error
  () => optionalSearch({ id: '5', userId: 'hi' }, { id: '5', userId: 'hi' });

  // @ts-expect-error
  () => requiredSearch();
  // @ts-expect-error
  () => requiredSearch({ id: '5' });
  () => requiredSearch({ id: '5', userId: 'hi' });
  // @ts-expect-error
  () => requiredSearch(5);
  // @ts-expect-error
  () => requiredSearch({ id: '5', userId: 'hi' }, { id: '5', userId: 'hi' });

  // @ts-expect-error
  () => undef();
  // @ts-expect-error
  () => undef({});
  // @ts-expect-error
  () => undef({ id: '5', userId: 'hi' });
  // @ts-expect-error
  () => undef(5);

  // @ts-expect-error
  () => noSearch();
  () => noSearch({ id: '5' });
  // @ts-expect-error
  () => noSearch({ id: '5', userId: 'hi' });
  // @ts-expect-error
  () => noSearch(5);
};
// path: string
() => {
  const optionalUndefSearch = new RestEndpoint({
    path: '' as string,
    searchParams: {} as
      | {
          userId?: string | number;
        }
      | undefined,
  });
  const optionalSearch = new RestEndpoint({
    path: '' as string,
    searchParams: {} as {
      userId?: string | number;
    },
  });
  const undef = new RestEndpoint({
    path: '' as string,
    searchParams: undefined,
  });
  const requiredSearch = new RestEndpoint({
    path: '' as string,
    searchParams: {} as {
      userId: string | number;
    },
  });
  const noSearch = new RestEndpoint({
    path: '' as string,
  });
  () => optionalUndefSearch();
  () => optionalUndefSearch({});
  () => optionalUndefSearch({ id: '5' });
  () => optionalUndefSearch({ userId: 'hi' });
  () => optionalUndefSearch({ userId: 'hi', id: '5' });
  // @ts-expect-error
  () => optionalUndefSearch(5);
  // @ts-expect-error
  () => optionalUndefSearch({ userId: 'hi' }, { userId: 'hi' });

  () => optionalSearch();
  () => optionalSearch({});
  () => optionalSearch({ id: '5' });
  () => optionalSearch({ userId: 'hi' });
  () => optionalSearch({ userId: 'hi', id: '5' });
  // @ts-expect-error
  () => optionalSearch(5);
  // @ts-expect-error
  () => optionalSearch({ userId: 'hi' }, { userId: 'hi' });

  // @ts-expect-error
  () => requiredSearch();
  // @ts-expect-error
  () => requiredSearch({});
  // @ts-expect-error
  () => requiredSearch({ id: '5' });
  () => requiredSearch({ userId: 'hi' });
  () => requiredSearch({ userId: 'hi', id: '5' });
  // @ts-expect-error
  () => requiredSearch(5);
  // @ts-expect-error
  () => requiredSearch({ userId: 'hi' }, { userId: 'hi' });

  () => undef();
  // @ts-expect-error
  () => undef(5);

  () => noSearch();
  () => noSearch({});
  () => noSearch({ id: '5' });
  () => noSearch({ userId: 'hi' });
  // @ts-expect-error
  () => noSearch(5);
};
