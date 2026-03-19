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
  ISSUE_HEIGHT,
  IssueRow,
  IssuesRow,
  LIST_STYLE,
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
import { List } from 'react-window';

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
function ListView({ count }: { count: number }) {
  const { data: issues } = useDLE(IssueResource.getList, { count });
  if (!issues) return null;
  const list = issues as Issue[];
  setCurrentIssues(list);
  return (
    <List
      style={LIST_STYLE}
      rowHeight={ISSUE_HEIGHT}
      rowCount={list.length}
      rowComponent={IssuesRow}
      rowProps={{ issues: list }}
    />
  );
}

/** Renders issues sorted by title via Query schema (memoized by MemoCache). */
function SortedListView({ count }: { count: number }) {
  const { data: issues } = useDLE(sortedIssuesEndpoint, { count });
  if (!issues?.length) return null;
  return (
    <div data-sorted-list>
      <List
        style={LIST_STYLE}
        rowHeight={ISSUE_HEIGHT}
        rowCount={issues.length}
        rowComponent={IssuesRow}
        rowProps={{ issues: issues as Issue[] }}
      />
    </div>
  );
}

function StateListView({ state, count }: { state: string; count: number }) {
  const { data: issues } = useDLE(IssueResource.getList, { state, count });
  if (!issues) return null;
  const list = issues as Issue[];
  return (
    <div data-state-list={state}>
      <span data-state-count>{list.length}</span>
      <PlainIssueList issues={list} />
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

function DetailView({ number }: { number: number }) {
  const issue = useSuspense(IssueResource.get, { number });
  return (
    <div data-detail-view data-issue-number={number}>
      <IssueRow issue={issue as Issue} />
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

  registerAPI({
    updateEntity,
    updateUser,
    invalidateAndResolve,
    unshiftItem,
    deleteEntity,
    moveItem,
    triggerGC: () => benchGC.sweep(),
  });

  return (
    <div ref={containerRef} data-bench-harness>
      {listViewCount != null && <ListView count={listViewCount} />}
      {showSortedView && sortedViewCount != null && (
        <SortedListView count={sortedViewCount} />
      )}
      {showDoubleList && doubleListCount != null && (
        <DoubleListView count={doubleListCount} />
      )}
      {detailIssueNumber != null && (
        <React.Suspense fallback={<div>Loading...</div>}>
          <DetailView number={detailIssueNumber} />
        </React.Suspense>
      )}
    </div>
  );
}

function BenchProvider({ children }: { children: React.ReactNode }) {
  return <DataProvider gcPolicy={benchGC}>{children}</DataProvider>;
}

renderBenchApp(BenchmarkHarness, BenchProvider);
