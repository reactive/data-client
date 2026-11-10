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
import { noteListViewRender } from '@shared/renderCounts';
import { IssueResource, UserResource } from '@shared/resources';
import type { Issue } from '@shared/types';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

let mutationCounter = 0;

function SortedListView({
  limit,
  refetchKey,
}: {
  limit?: number;
  refetchKey: number;
}) {
  const [issues, setIssues] = useState<Issue[] | null>(null);
  useEffect(() => {
    IssueResource.getList().then(setIssues);
  }, [refetchKey]);
  const sorted = useMemo(() => (issues ? sortByTitle(issues) : []), [issues]);
  if (!sorted.length) return null;
  return (
    <div data-sorted-list>
      <PlainIssueList issues={sorted} limit={limit} />
    </div>
  );
}

function DetailView({
  number,
  refetchKey,
}: {
  number: number;
  refetchKey: number;
}) {
  const [issue, setIssue] = useState<Issue | null>(null);
  useEffect(() => {
    IssueResource.get({ number }).then(setIssue);
  }, [number, refetchKey]);
  if (!issue) return null;
  return (
    <div data-detail-view data-issue-number={number}>
      <IssueRow issue={issue} />
    </div>
  );
}

function PinnedCard({
  number,
  refetchKey,
}: {
  number: number;
  refetchKey: number;
}) {
  const [issue, setIssue] = useState<Issue | null>(null);
  useEffect(() => {
    IssueResource.get({ number }).then(setIssue);
  }, [number, refetchKey]);
  if (!issue) return null;
  return <PinnedCardView issue={issue} />;
}

function PinnedStrip({
  numbers,
  refetchKey,
}: {
  numbers: number[];
  refetchKey: number;
}) {
  return (
    <div data-pinned-strip style={PINNED_STRIP_STYLE}>
      {numbers.map(n => (
        <PinnedCard key={n} number={n} refetchKey={refetchKey} />
      ))}
    </div>
  );
}

function ListView({
  count,
  limit,
  refetchKey,
}: {
  count: number;
  limit?: number;
  refetchKey: number;
}) {
  noteListViewRender();
  const [issues, setIssues] = useState<Issue[] | null>(null);
  useEffect(() => {
    IssueResource.getList({ count }).then(setIssues);
  }, [count, refetchKey]);
  if (!issues) return null;
  setCurrentIssues(issues);
  return <PlainIssueList issues={issues} limit={limit} />;
}

function StateListView({
  state,
  count,
  limit,
  refetchKey,
}: {
  state: string;
  count: number;
  limit?: number;
  refetchKey: number;
}) {
  const [issues, setIssues] = useState<Issue[] | null>(null);
  useEffect(() => {
    IssueResource.getList({ state, count }).then(setIssues);
  }, [state, count, refetchKey]);
  if (!issues) return null;
  return (
    <div data-state-list={state}>
      <span data-state-count>{issues.length}</span>
      <PlainIssueList issues={issues} limit={limit} />
    </div>
  );
}

function DoubleListView({
  count,
  limit,
  refetchKey,
}: {
  count: number;
  limit?: number;
  refetchKey: number;
}) {
  return (
    <div style={DOUBLE_LIST_STYLE}>
      <StateListView
        state="open"
        count={count}
        limit={limit}
        refetchKey={refetchKey}
      />
      <StateListView
        state="closed"
        count={count}
        limit={limit}
        refetchKey={refetchKey}
      />
    </div>
  );
}

function BenchmarkHarness() {
  const [refetchKey, setRefetchKey] = useState(0);
  const triggerRefetch = useCallback(() => setRefetchKey(k => k + 1), []);

  const {
    listViewCount,
    showSortedView,
    showDoubleList,
    doubleListCount,
    detailIssueNumber,
    pinnedNumbers,
    stateList,
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
        ).then(triggerRefetch),
      );
    },
    [measureUpdate, triggerRefetch],
  );

  const updateUser = useCallback(
    (login: string) => {
      const user = FIXTURE_USERS_BY_LOGIN.get(login);
      if (!user) return;
      const v = ++mutationCounter;
      measureUpdate(() =>
        UserResource.update({ login }, { name: `${user.name} (v${v})` }).then(
          triggerRefetch,
        ),
      );
    },
    [measureUpdate, triggerRefetch],
  );

  const unshiftItem = useCallback(() => {
    const user = FIXTURE_USERS[0];
    measureUpdate(() =>
      IssueResource.create({ title: 'New Issue', user }).then(triggerRefetch),
    );
  }, [measureUpdate, triggerRefetch]);

  const deleteEntity = useCallback(
    (number: number) => {
      measureUpdate(() =>
        IssueResource.delete({ number }).then(triggerRefetch),
      );
    },
    [measureUpdate, triggerRefetch],
  );

  const createItem = useCallback(async () => {
    const issue = await IssueResource.create({
      title: 'New Issue',
      user: FIXTURE_USERS[0],
    });
    triggerRefetch();
    return issue.number;
  }, [triggerRefetch]);

  const editTitle = useCallback(
    async (number: number, title: string) => {
      await IssueResource.update({ number }, { title });
      triggerRefetch();
    },
    [triggerRefetch],
  );

  const moveToState = useCallback(
    async (number: number, state: 'open' | 'closed') => {
      await IssueResource.update({ number }, { state });
      triggerRefetch();
    },
    [triggerRefetch],
  );

  const moveStateRef = useRef<'open' | 'closed'>('closed');

  const moveItem = useCallback(
    (number: number) => {
      const targetState = moveStateRef.current;
      moveStateRef.current = targetState === 'closed' ? 'open' : 'closed';
      measureUpdate(
        () =>
          IssueResource.update({ number }, { state: targetState }).then(
            triggerRefetch,
          ),
        () => moveItemIsReady(containerRef, number, targetState),
      );
    },
    [measureUpdate, triggerRefetch, containerRef],
  );

  const updateEntityMultiView = useCallback(
    (number: number) => {
      const issue = FIXTURE_ISSUES_BY_NUMBER.get(number);
      if (!issue) return;
      const v = ++mutationCounter;
      const expected = `${issue.title} (v${v})`;
      measureUpdate(
        () =>
          IssueResource.update({ number }, { title: expected }).then(
            triggerRefetch,
          ),
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
    [measureUpdate, triggerRefetch, containerRef],
  );

  registerAPI({
    updateEntity,
    updateUser,
    updateEntityMultiView,
    unshiftItem,
    deleteEntity,
    moveItem,
    createItem,
    moveToState,
    editTitle,
  });

  return (
    <div ref={containerRef} data-bench-harness>
      {listViewCount != null && (
        <ListView
          count={listViewCount}
          limit={renderLimit}
          refetchKey={refetchKey}
        />
      )}
      {showSortedView && (
        <SortedListView limit={renderLimit} refetchKey={refetchKey} />
      )}
      {showDoubleList && doubleListCount != null && (
        <DoubleListView
          count={doubleListCount}
          limit={renderLimit}
          refetchKey={refetchKey}
        />
      )}
      {stateList != null && doubleListCount != null && (
        <StateListView
          key={stateList}
          state={stateList}
          count={doubleListCount}
          limit={renderLimit}
          refetchKey={refetchKey}
        />
      )}
      {detailIssueNumber != null && (
        <DetailView number={detailIssueNumber} refetchKey={refetchKey} />
      )}
      {pinnedNumbers.length > 0 && (
        <PinnedStrip numbers={pinnedNumbers} refetchKey={refetchKey} />
      )}
    </div>
  );
}

renderBenchApp(BenchmarkHarness);
