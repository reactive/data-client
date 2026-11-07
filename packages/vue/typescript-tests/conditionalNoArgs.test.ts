import { RestEndpoint } from '@data-client/rest';

import useCache from '../src/consumers/useCache';
import useDLE from '../src/consumers/useDLE';
import useLive from '../src/consumers/useLive';
import useSuspense from '../src/consumers/useSuspense';

// Eval for bulletproof-react migration problem P6 (Vue side): a getter
// returning `cond ? {} : null` conditionally fetches an endpoint that takes
// no arguments. Compile-time only (tsconfig.test.json, not run by jest); each
// `ts-expect-error` line must keep erroring and every other line must compile.

declare const cond: { value: boolean };
type Team = { id: string; name: string };
const getTeams = new RestEndpoint({
  path: '/teams',
  process(value: any): Team[] {
    return value;
  },
});

async () => {
  const maybeTeams = await useSuspense(getTeams, () =>
    cond.value ? {} : null,
  );
  maybeTeams.value satisfies readonly Team[] | undefined;
  // @ts-expect-error may be undefined with nullable args
  maybeTeams.value.length;

  (await useLive(getTeams, () => (cond.value ? {} : null))).value satisfies
    readonly Team[] | undefined;
  useDLE(getTeams, () => (cond.value ? {} : null));
  useCache(getTeams, () => (cond.value ? {} : null));

  (await useSuspense(getTeams)).value satisfies readonly Team[];
  (await useSuspense(getTeams, {})).value satisfies readonly Team[];

  // @ts-expect-error getTeams has no path or search params
  useSuspense(getTeams, () => (cond.value ? { page: 1 } : null));
};
