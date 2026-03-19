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
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { List } from 'react-window';

const IssuesContext = React.createContext<{
  issues: Issue[];
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
}>(null as any);

function SortedListView() {
  const { issues, setIssues } = useContext(IssuesContext);
  useEffect(() => {
    IssueResource.getList().then(setIssues);
  }, [setIssues]);
  const sorted = useMemo(() => sortByTitle(issues), [issues]);
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

function ListView() {
  const { issues } = useContext(IssuesContext);
  if (!issues.length) return null;
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

const DoubleListContext = React.createContext<{
  openIssues: Issue[];
  closedIssues: Issue[];
  setOpenIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  setClosedIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
}>(null as any);

function DoubleListView() {
  const { openIssues, closedIssues } = useContext(DoubleListContext);
  return (
    <div style={DOUBLE_LIST_STYLE}>
      {openIssues.length > 0 && (
        <div data-state-list="open">
          <span data-state-count>{openIssues.length}</span>
          <PlainIssueList issues={openIssues} />
        </div>
      )}
      {closedIssues.length > 0 && (
        <div data-state-list="closed">
          <span data-state-count>{closedIssues.length}</span>
          <PlainIssueList issues={closedIssues} />
        </div>
      )}
    </div>
  );
}

function DetailView({ number }: { number: number }) {
  const [issue, setIssue] = useState<Issue | null>(null);
  useEffect(() => {
    IssueResource.get({ number }).then(setIssue);
  }, [number]);
  if (!issue) return null;
  return (
    <div data-detail-view data-issue-number={number}>
      <IssueRow issue={issue} />
    </div>
  );
}

function BenchmarkHarness() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [openIssues, setOpenIssues] = useState<Issue[]>([]);
  const [closedIssues, setClosedIssues] = useState<Issue[]>([]);
  const {
    listViewCount,
    showSortedView,
    showDoubleList,
    doubleListCount,
    detailIssueNumber,
    containerRef,
    measureUpdate,
    unmountAll: unmountBase,
    registerAPI,
  } = useBenchState();

  useEffect(() => {
    if (listViewCount != null) {
      IssueResource.getList({ count: listViewCount }).then(setIssues);
    }
  }, [listViewCount]);

  useEffect(() => {
    if (showDoubleList && doubleListCount != null) {
      IssueResource.getList({ state: 'open', count: doubleListCount }).then(
        setOpenIssues,
      );
      IssueResource.getList({ state: 'closed', count: doubleListCount }).then(
        setClosedIssues,
      );
    }
  }, [showDoubleList, doubleListCount]);

  const unmountAll = useCallback(() => {
    unmountBase();
    setIssues([]);
    setOpenIssues([]);
    setClosedIssues([]);
  }, [unmountBase]);

  const refetchActiveList = useCallback(() => {
    if (doubleListCount != null) {
      return Promise.all([
        IssueResource.getList({
          state: 'open',
          count: doubleListCount,
        }).then(setOpenIssues),
        IssueResource.getList({
          state: 'closed',
          count: doubleListCount,
        }).then(setClosedIssues),
      ]);
    }
    return IssueResource.getList({ count: listViewCount! }).then(setIssues);
  }, [listViewCount, doubleListCount]);

  const updateEntity = useCallback(
    (number: number) => {
      const issue = FIXTURE_ISSUES_BY_NUMBER.get(number);
      if (!issue) return;
      measureUpdate(() =>
        IssueResource.update(
          { number },
          { title: `${issue.title} (updated)` },
        ).then(refetchActiveList),
      );
    },
    [measureUpdate, refetchActiveList],
  );

  const updateUser = useCallback(
    (login: string) => {
      const user = FIXTURE_USERS_BY_LOGIN.get(login);
      if (!user) return;
      measureUpdate(() =>
        UserResource.update({ login }, { name: `${user.name} (updated)` }).then(
          refetchActiveList,
        ),
      );
    },
    [measureUpdate, refetchActiveList],
  );

  const unshiftItem = useCallback(() => {
    const user = FIXTURE_USERS[0];
    measureUpdate(() =>
      IssueResource.create({ title: 'New Issue', user }).then(
        refetchActiveList,
      ),
    );
  }, [measureUpdate, refetchActiveList]);

  const deleteEntity = useCallback(
    (number: number) => {
      measureUpdate(() =>
        IssueResource.delete({ number }).then(refetchActiveList),
      );
    },
    [measureUpdate, refetchActiveList],
  );

  const moveItem = useCallback(
    (number: number) => {
      measureUpdate(
        () =>
          IssueResource.update({ number }, { state: 'closed' }).then(() =>
            Promise.all([
              IssueResource.getList({
                state: 'open',
                count: doubleListCount!,
              }).then(setOpenIssues),
              IssueResource.getList({
                state: 'closed',
                count: doubleListCount!,
              }).then(setClosedIssues),
            ]),
          ),
        () => moveItemIsReady(containerRef, number),
      );
    },
    [measureUpdate, doubleListCount, containerRef],
  );

  registerAPI({
    updateEntity,
    updateUser,
    unmountAll,
    unshiftItem,
    deleteEntity,
    moveItem,
  });

  return (
    <IssuesContext.Provider value={{ issues, setIssues }}>
      <DoubleListContext.Provider
        value={{
          openIssues,
          closedIssues,
          setOpenIssues,
          setClosedIssues,
        }}
      >
        <div ref={containerRef} data-bench-harness>
          {listViewCount != null && <ListView />}
          {showSortedView && <SortedListView />}
          {showDoubleList && doubleListCount != null && <DoubleListView />}
          {detailIssueNumber != null && (
            <DetailView number={detailIssueNumber} />
          )}
        </div>
      </DoubleListContext.Provider>
    </IssuesContext.Provider>
  );
}

renderBenchApp(BenchmarkHarness);
