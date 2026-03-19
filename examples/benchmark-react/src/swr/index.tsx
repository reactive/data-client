import {
  moveItemIsReady,
  renderBenchApp,
  useBenchState,
} from '@shared/benchHarness';
import {
  DOUBLE_LIST_STYLE,
  ISSUE_HEIGHT,
  IssueRow,
  IssuesRow,
  LIST_STYLE,
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
import React, { useCallback, useMemo } from 'react';
import { List } from 'react-window';
import useSWR, { SWRConfig, useSWRConfig } from 'swr';

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

function SortedListView() {
  const { data: issues } = useSWR<Issue[]>('issues:all', fetcher);
  const sorted = useMemo(() => (issues ? sortByTitle(issues) : []), [issues]);
  if (!sorted.length) return null;
  return (
    <div data-sorted-list>
      <List
        style={LIST_STYLE}
        rowHeight={ISSUE_HEIGHT}
        rowCount={sorted.length}
        rowComponent={IssuesRow}
        rowProps={{ issues: sorted }}
      />
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

function ListView({ count }: { count: number }) {
  const { data: issues } = useSWR<Issue[]>(`issues:${count}`, fetcher);
  if (!issues) return null;
  setCurrentIssues(issues);
  return (
    <List
      style={LIST_STYLE}
      rowHeight={ISSUE_HEIGHT}
      rowCount={issues.length}
      rowComponent={IssuesRow}
      rowProps={{ issues }}
    />
  );
}

function StateListView({ state, count }: { state: string; count: number }) {
  const { data: issues } = useSWR<Issue[]>(
    `issues:state:${state}:${count}`,
    fetcher,
  );
  if (!issues) return null;
  return (
    <div data-state-list={state}>
      <span data-state-count>{issues.length}</span>
      <PlainIssueList issues={issues} />
    </div>
  );
}

function DoubleListView({ count }: { count: number }) {
  return (
    <div style={DOUBLE_LIST_STYLE}>
      <StateListView state="open" count={count} />
      <StateListView state="closed" count={count} />
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
    containerRef,
    measureUpdate,
    registerAPI,
  } = useBenchState();

  const updateEntity = useCallback(
    (number: number) => {
      const issue = FIXTURE_ISSUES_BY_NUMBER.get(number);
      if (!issue) return;
      measureUpdate(() =>
        IssueResource.update(
          { number },
          { title: `${issue.title} (updated)` },
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
      measureUpdate(
        () =>
          UserResource.update(
            { login },
            { name: `${user.name} (updated)` },
          ).then(() =>
            mutate(key => typeof key === 'string' && key.startsWith('issues:')),
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

  const moveItem = useCallback(
    (number: number) => {
      measureUpdate(
        () =>
          IssueResource.update({ number }, { state: 'closed' }).then(() =>
            mutate(key => typeof key === 'string' && key.startsWith('issues:')),
          ),
        () => moveItemIsReady(containerRef, number),
      );
    },
    [measureUpdate, mutate, containerRef],
  );

  registerAPI({
    updateEntity,
    updateUser,
    unshiftItem,
    deleteEntity,
    moveItem,
  });

  return (
    <div ref={containerRef} data-bench-harness>
      {listViewCount != null && <ListView count={listViewCount} />}
      {showSortedView && <SortedListView />}
      {showDoubleList && doubleListCount != null && (
        <DoubleListView count={doubleListCount} />
      )}
      {detailIssueNumber != null && <DetailView number={detailIssueNumber} />}
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
      }}
    >
      {children}
    </SWRConfig>
  );
}

renderBenchApp(BenchmarkHarness, BenchProvider);
