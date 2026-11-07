import { RestEndpoint, resource } from '@data-client/rest';

import useCache from '../src/hooks/useCache';
import useDLE from '../src/hooks/useDLE';
import useFetch from '../src/hooks/useFetch';
import useLive from '../src/hooks/useLive';
import useSuspense from '../src/hooks/useSuspense';

// Eval for bulletproof-react migration problem P6: `cond ? args : null` must
// conditionally fetch an endpoint that takes no arguments, written as
// `cond ? {} : null`. Compile-time only (tsconfig.test.json); each
// `ts-expect-error` line must keep erroring and every other line must compile.

declare const cond: boolean;
type Team = { id: string; name: string };
const getTeams = new RestEndpoint({
  path: '/teams',
  process(value: any): Team[] {
    return value;
  },
});

() => {
  // the P6 repro
  const maybeTeams = useSuspense(getTeams, cond ? {} : null);
  maybeTeams satisfies Team[] | undefined;
  // @ts-expect-error may be undefined with nullable args
  maybeTeams.length;

  useLive(getTeams, cond ? {} : null) satisfies Team[] | undefined;
  useDLE(getTeams, cond ? {} : null).data satisfies Team[] | undefined;
  useFetch(getTeams, cond ? {} : null);
  useCache(getTeams, cond ? {} : null);

  // calling with no args or `{}` is the same fetch (same key and url)
  const teams = useSuspense(getTeams);
  teams satisfies Team[];
  useSuspense(getTeams, {}) satisfies Team[];
  // @ts-expect-error not undefined with non-null args
  useSuspense(getTeams, {}) satisfies undefined;

  // still rejects params it does not take
  // @ts-expect-error getTeams has no path or search params
  useSuspense(getTeams, { page: 1 });
  // @ts-expect-error getTeams has no path or search params
  useSuspense(getTeams, cond ? { page: 1 } : null);
  // @ts-expect-error not an object
  useSuspense(getTeams, 5);
};

// the endpoint itself
() => {
  getTeams();
  getTeams({});
  // @ts-expect-error getTeams has no path or search params
  getTeams({ page: 1 });
};

// process() params stay `any` for endpoints that take no args
new RestEndpoint({
  path: '/teams',
  process(value, params: { anything: string }) {
    return params.anything;
  },
});
const plainTeams = new RestEndpoint({ path: '/teams' });
plainTeams.extend({
  process(value, params: { anything: string }) {
    return params.anything;
  },
});

// resource() endpoints with no params also accept `{}`
const TeamResource = resource({
  path: '/teams/:id',
  schema: {} as any,
});
() => {
  useSuspense(TeamResource.getList, cond ? {} : null);
};
