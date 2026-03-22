import {
  moveItemIsReady,
  renderBenchApp,
  useBenchState,
} from '@shared/benchHarness';
import {
  DOUBLE_LIST_STYLE,
  IssueRow,
  PINNED_STRIP_STYLE,
  PinnedCardView,
  PlainIssueList,
} from '@shared/components';
import {
  FIXTURE_USERS,
  FIXTURE_USERS_BY_LOGIN,
  FIXTURE_ISSUES_BY_NUMBER,
  sortByTitle,
} from '@shared/data';
import { setCurrentIssues } from '@shared/refStability';
import { UserResource, IssueResource } from '@shared/resources';
import type { Issue } from '@shared/types';
import React, { useCallback, useMemo, useRef } from 'react';
import useSWR, { SWRConfig, useSWRConfig } from 'swr';

let mutationCounter = 0;

/** SWR fetcher: dispatches to shared resource fetch methods based on cache key */
const fetcher = (key: string): Promise<any> => {
  if (key.startsWith('issue:'))
    return IssueResource.get({ number: Number(key.slice(6)) });
  if (key.startsWith('user:')) return UserResource.get({ login: key.slice(5) });
  if (key === 'issues:all') return IssueResource.getList();
  if (key.startsWith('issues:state:')) {
    const [state, count] = key.slice(13).split(':');
    return IssueResource.getList({
      state,
      ...(count ? { count: Number(count) } : {}),
    });
  }
  if (key.startsWith('issues:'))
    return IssueResource.getList({ count: Number(key.slice(7)) });
  return Promise.reject(new Error(`Unknown key: ${key}`));
};

function SortedListView({ limit }: { limit?: number }) {
  const { data: issues } = useSWR<Issue[]>('issues:all', fetcher);
  const sorted = useMemo(() => (issues ? sortByTitle(issues) : []), [issues]);
  if (!sorted.length) return null;
  return (
    <div data-sorted-list>
      <PlainIssueList issues={sorted} limit={limit} />
    </div>
  );
}

function DetailView({ number }: { number: number }) {
  const { data: issue } = useSWR<Issue>(`issue:${number}`, fetcher);
  if (!issue) return null;
  return (
    <div data-detail-view data-issue-number={number}>
      <IssueRow issue={issue} />
    </div>
  );
}

function PinnedCard({ number }: { number: number }) {
  const { data: issue } = useSWR<Issue>(`issue:${number}`, fetcher);
  if (!issue) return null;
  return <PinnedCardView issue={issue} />;
}

function PinnedStrip({ numbers }: { numbers: number[] }) {
  return (
    <div data-pinned-strip style={PINNED_STRIP_STYLE}>
      {numbers.map(n => (
        <PinnedCard key={n} number={n} />
      ))}
    </div>
  );
}

function ListView({ count, limit }: { count: number; limit?: number }) {
  const { data: issues } = useSWR<Issue[]>(`issues:${count}`, fetcher);
  if (!issues) return null;
  setCurrentIssues(issues);
  return <PlainIssueList issues={issues} limit={limit} />;
}

function StateListView({
  state,
  count,
  limit,
}: {
  state: string;
  count: number;
  limit?: number;
}) {
  const { data: issues } = useSWR<Issue[]>(
    `issues:state:${state}:${count}`,
    fetcher,
  );
  if (!issues) return null;
  return (
    <div data-state-list={state}>
      <span data-state-count>{issues.length}</span>
      <PlainIssueList issues={issues} limit={limit} />
    </div>
  );
}

function DoubleListView({ count, limit }: { count: number; limit?: number }) {
  return (
    <div style={DOUBLE_LIST_STYLE}>
      <StateListView state="open" count={count} limit={limit} />
      <StateListView state="closed" count={count} limit={limit} />
    </div>
  );
}

function BenchmarkHarness() {
  const { mutate } = useSWRConfig();
  const {
    listViewCount,
    showSortedView,
    showDoubleList,
    doubleListCount,
    detailIssueNumber,
    pinnedNumbers,
    renderLimit,
    containerRef,
    measureUpdate,
    registerAPI,
  } = useBenchState();

  const updateEntity = useCallback(
    (number: number) => {
      const issue = FIXTURE_ISSUES_BY_NUMBER.get(number);
      if (!issue) return;
      const v = ++mutationCounter;
      measureUpdate(() =>
        IssueResource.update(
          { number },
          { title: `${issue.title} (v${v})` },
        ).then(() =>
          mutate(key => typeof key === 'string' && key.startsWith('issues:')),
        ),
      );
    },
    [measureUpdate, mutate],
  );

  const updateUser = useCallback(
    (login: string) => {
      const user = FIXTURE_USERS_BY_LOGIN.get(login);
      if (!user) return;
      const v = ++mutationCounter;
      measureUpdate(
        () =>
          UserResource.update({ login }, { name: `${user.name} (v${v})` }).then(
            () =>
              mutate(
                key => typeof key === 'string' && key.startsWith('issues:'),
              ),
          ) as Promise<any>,
      );
    },
    [measureUpdate, mutate],
  );

  const unshiftItem = useCallback(() => {
    const user = FIXTURE_USERS[0];
    measureUpdate(() =>
      IssueResource.create({ title: 'New Issue', user }).then(() =>
        mutate(key => typeof key === 'string' && key.startsWith('issues:')),
      ),
    );
  }, [measureUpdate, mutate]);

  const deleteEntity = useCallback(
    (number: number) => {
      measureUpdate(() =>
        IssueResource.delete({ number }).then(() =>
          mutate(key => typeof key === 'string' && key.startsWith('issues:')),
        ),
      );
    },
    [measureUpdate, mutate],
  );

  const moveStateRef = useRef<'open' | 'closed'>('closed');

  const moveItem = useCallback(
    (number: number) => {
      const targetState = moveStateRef.current;
      moveStateRef.current = targetState === 'closed' ? 'open' : 'closed';
      measureUpdate(
        () =>
          IssueResource.update({ number }, { state: targetState }).then(() =>
            mutate(key => typeof key === 'string' && key.startsWith('issues:')),
          ),
        () => moveItemIsReady(containerRef, number, targetState),
      );
    },
    [measureUpdate, mutate, containerRef],
  );

  const updateEntityMultiView = useCallback(
    (number: number) => {
      const issue = FIXTURE_ISSUES_BY_NUMBER.get(number);
      if (!issue) return;
      const v = ++mutationCounter;
      const expected = `${issue.title} (v${v})`;
      measureUpdate(
        () =>
          IssueResource.update({ number }, { title: expected }).then(() =>
            mutate(
              key =>
                typeof key === 'string' &&
                (key.startsWith('issues:') || key.startsWith('issue:')),
            ),
          ) as Promise<any>,
        () => {
          const container = containerRef.current!;
          const listTitle = container.querySelector(
            `[data-issue-number="${number}"] [data-title]`,
          );
          const detailTitle = container.querySelector(
            '[data-detail-view] [data-title]',
          );
          const pinnedTitle = container.querySelector(
            `[data-pinned-number="${number}"] [data-title]`,
          );
          return [listTitle, detailTitle, pinnedTitle].every(
            el => el?.textContent === expected,
          );
        },
      );
    },
    [measureUpdate, mutate, containerRef],
  );

  const { cache } = useSWRConfig();
  const resetStore = useCallback(() => {
    if (typeof (cache as any).clear === 'function') (cache as any).clear();
  }, [cache]);

  registerAPI({
    updateEntity,
    updateUser,
    updateEntityMultiView,
    unshiftItem,
    deleteEntity,
    moveItem,
    resetStore,
  });

  return (
    <div ref={containerRef} data-bench-harness>
      {listViewCount != null && (
        <ListView count={listViewCount} limit={renderLimit} />
      )}
      {showSortedView && <SortedListView limit={renderLimit} />}
      {showDoubleList && doubleListCount != null && (
        <DoubleListView count={doubleListCount} limit={renderLimit} />
      )}
      {detailIssueNumber != null && <DetailView number={detailIssueNumber} />}
      {pinnedNumbers.length > 0 && <PinnedStrip numbers={pinnedNumbers} />}
    </div>
  );
}

function BenchProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
        revalidateOnMount: true,
        dedupingInterval: 0,
      }}
    >
      {children}
    </SWRConfig>
  );
}

renderBenchApp(BenchmarkHarness, BenchProvider);
