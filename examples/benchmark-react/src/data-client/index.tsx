import {
  DataProvider,
  GCPolicy,
  useController,
  useDLE,
  useSuspense,
} from '@data-client/react';
import type { Controller } from '@data-client/react';
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
  FIXTURE_ISSUES_BY_NUMBER,
  FIXTURE_USERS_BY_LOGIN,
} from '@shared/data';
import { setCurrentIssues } from '@shared/refStability';
import {
  UserResource,
  IssueResource,
  sortedIssuesEndpoint,
} from '@shared/resources';
import { getIssue, patchIssue } from '@shared/server';
import type { Issue } from '@shared/types';
import React, { useCallback } from 'react';

/** GCPolicy with no interval (won't fire during timing scenarios) and instant
 *  expiry so an explicit sweep() collects all unreferenced data immediately. */
class BenchGCPolicy extends GCPolicy {
  constructor() {
    super({ expiresAt: () => 0 });
  }

  init(controller: Controller) {
    this.controller = controller;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  cleanup() {}

  public sweep() {
    this.runSweep();
  }
}

const benchGC = new BenchGCPolicy();

/** Renders issues from the list endpoint (models rendering a list fetch response). */
function ListView({ count, limit }: { count: number; limit?: number }) {
  const { data: issues } = useDLE(IssueResource.getList, { count });
  if (!issues) return null;
  const list = issues as Issue[];
  setCurrentIssues(list);
  return <PlainIssueList issues={list} limit={limit} />;
}

/** Renders issues sorted by title via Query schema (memoized by MemoCache). */
function SortedListView({ count, limit }: { count: number; limit?: number }) {
  const { data: issues } = useDLE(sortedIssuesEndpoint, { count });
  if (!issues?.length) return null;
  return (
    <div data-sorted-list>
      <PlainIssueList issues={issues as Issue[]} limit={limit} />
    </div>
  );
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
  const { data: issues } = useDLE(IssueResource.getList, { state, count });
  if (!issues) return null;
  const list = issues as Issue[];
  return (
    <div data-state-list={state}>
      <span data-state-count>{list.length}</span>
      <PlainIssueList issues={list} limit={limit} />
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

function DetailView({ number }: { number: number }) {
  const issue = useSuspense(IssueResource.get, { number });
  return (
    <div data-detail-view data-issue-number={number}>
      <IssueRow issue={issue as Issue} />
    </div>
  );
}

function PinnedCard({ number }: { number: number }) {
  const issue = useSuspense(IssueResource.get, { number });
  return <PinnedCardView issue={issue as Issue} />;
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

function BenchmarkHarness() {
  const controller = useController();
  const {
    listViewCount,
    showSortedView,
    sortedViewCount,
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
      measureUpdate(() => {
        controller.fetch(
          IssueResource.update,
          { number },
          { title: `${issue.title} (updated)` },
        );
      });
    },
    [measureUpdate, controller],
  );

  const updateUser = useCallback(
    (login: string) => {
      const user = FIXTURE_USERS_BY_LOGIN.get(login);
      if (!user) return;
      measureUpdate(() => {
        controller.fetch(
          UserResource.update,
          { login },
          { name: `${user.name} (updated)` },
        );
      });
    },
    [measureUpdate, controller],
  );

  const unshiftItem = useCallback(() => {
    const user = FIXTURE_USERS[0];
    measureUpdate(() => {
      (controller.fetch as any)(
        IssueResource.create,
        { state: 'open' },
        {
          title: 'New Issue',
          user,
        },
      );
    });
  }, [measureUpdate, controller]);

  const deleteEntity = useCallback(
    (number: number) => {
      measureUpdate(() => {
        controller.fetch(IssueResource.delete, { number });
      });
    },
    [measureUpdate, controller],
  );

  const moveItem = useCallback(
    (number: number) => {
      measureUpdate(
        () => {
          controller.fetch(IssueResource.move, { number }, { state: 'closed' });
        },
        () => moveItemIsReady(containerRef, number),
      );
    },
    [measureUpdate, controller, containerRef],
  );

  const invalidateAndResolve = useCallback(
    async (number: number) => {
      const issue = await getIssue(number);
      if (issue) {
        await patchIssue(number, { title: `${issue.title} (refetched)` });
      }
      measureUpdate(
        () => {
          if (doubleListCount != null) {
            controller.invalidate(IssueResource.getList, {
              state: 'open',
              count: doubleListCount,
            });
          } else {
            controller.invalidate(IssueResource.getList, {
              count: listViewCount!,
            });
          }
        },
        () => {
          const el = containerRef.current!.querySelector(
            `[data-issue-number="${number}"] [data-title]`,
          );
          return el?.textContent?.includes('(refetched)') ?? false;
        },
      );
    },
    [measureUpdate, controller, containerRef, doubleListCount, listViewCount],
  );

  const updateEntityMultiView = useCallback(
    (number: number) => {
      const issue = FIXTURE_ISSUES_BY_NUMBER.get(number);
      if (!issue) return;
      const expected = `${issue.title} (updated)`;
      measureUpdate(
        () => {
          controller.fetch(
            IssueResource.update,
            { number },
            { title: expected },
          );
        },
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
    [measureUpdate, controller, containerRef],
  );

  registerAPI({
    updateEntity,
    updateUser,
    invalidateAndResolve,
    updateEntityMultiView,
    unshiftItem,
    deleteEntity,
    moveItem,
    triggerGC: () => benchGC.sweep(),
  });

  return (
    <div ref={containerRef} data-bench-harness>
      {listViewCount != null && (
        <ListView count={listViewCount} limit={renderLimit} />
      )}
      {showSortedView && sortedViewCount != null && (
        <SortedListView count={sortedViewCount} limit={renderLimit} />
      )}
      {showDoubleList && doubleListCount != null && (
        <DoubleListView count={doubleListCount} limit={renderLimit} />
      )}
      {detailIssueNumber != null && (
        <React.Suspense fallback={<div>Loading...</div>}>
          <DetailView number={detailIssueNumber} />
        </React.Suspense>
      )}
      {pinnedNumbers.length > 0 && (
        <React.Suspense fallback={<div>Loading pinned...</div>}>
          <PinnedStrip numbers={pinnedNumbers} />
        </React.Suspense>
      )}
    </div>
  );
}

function BenchProvider({ children }: { children: React.ReactNode }) {
  return <DataProvider gcPolicy={benchGC}>{children}</DataProvider>;
}

renderBenchApp(BenchmarkHarness, BenchProvider);
