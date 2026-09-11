import { RestEndpoint } from '@data-client/rest';
import type { Interceptor } from '@data-client/test';
import { v4 as uuid } from 'uuid';

export type AcidIssue = {
  id: string;
  repoId: string;
  title: string;
  state: 'open' | 'closed';
};

export type AcidIssueState = {
  issues: AcidIssue[];
};

export type AcidRepo = {
  id: string;
  name: string;
};

export type AcidCollectionState = AcidIssueState & {
  repos: AcidRepo[];
};

export type AcidAccount = {
  id: string;
  balance: number;
};

export type AcidTrade = {
  id: string;
  amount: number;
  coin: string;
};

export type AcidTradeState = {
  account: AcidAccount;
  trades: AcidTrade[];
};

const getIssueList = new RestEndpoint({
  path: '/issues',
  searchParams: {} as { repoId?: string } | undefined,
});
const getIssue = new RestEndpoint({
  path: '/issues/:id',
});
const partialUpdateIssue = new RestEndpoint({
  path: '/issues/:id',
  method: 'PATCH',
});
const createIssue = new RestEndpoint({
  path: '/issues',
  method: 'POST',
});
const deleteIssue = new RestEndpoint({
  path: '/issues/:id',
  method: 'DELETE',
});
const getRepo = new RestEndpoint({
  path: '/repos/:id',
});
const getAccount = new RestEndpoint({
  path: '/accounts/:id',
});
const getTradeList = new RestEndpoint({
  path: '/trade',
});
const createTrade = new RestEndpoint({
  path: '/trade',
  method: 'POST',
});

export function getAcidIssueData(): AcidIssueState {
  return {
    issues: [
      {
        id: '3',
        repoId: '1',
        title: 'Rate limit the API',
        state: 'closed',
      },
      {
        id: '1',
        repoId: '1',
        title: 'Fix login timeout',
        state: 'open',
      },
      {
        id: '2',
        repoId: '1',
        title: 'Document ACID guarantees',
        state: 'open',
      },
    ],
  };
}

export function getAcidCollectionData(): AcidCollectionState {
  return {
    repos: [{ id: '1', name: 'data-client' }],
    issues: getAcidIssueData().issues,
  };
}

export function getAcidTradeData(): AcidTradeState {
  return {
    account: { id: '1', balance: 1337 },
    trades: [{ id: '1', amount: 50, coin: 'DOGE' }],
  };
}

const delay = 150;

const getIssueListInterceptor: Interceptor<AcidIssueState> = {
  endpoint: getIssueList,
  response({ repoId }) {
    return this.issues.filter(issue => issue.repoId == repoId);
  },
  delay,
};

const getIssueInterceptor: Interceptor<AcidIssueState> = {
  endpoint: getIssue,
  response({ id }) {
    return this.issues.find(issue => issue.id == id);
  },
  delay,
};

const partialUpdateIssueInterceptor: Interceptor<AcidIssueState> = {
  endpoint: partialUpdateIssue,
  response({ id }, body) {
    const issue = this.issues.find(item => item.id == id);
    if (!issue) return { id, ...body };
    Object.assign(issue, body);
    return { ...issue };
  },
  delay,
};

export const acidIssueFixtures: Interceptor<AcidIssueState>[] = [
  getIssueListInterceptor,
  getIssueInterceptor,
  partialUpdateIssueInterceptor,
  {
    endpoint: createIssue,
    response(body) {
      const issue = {
        state: 'open' as const,
        repoId: '1',
        ...body,
        id: uuid(),
      };
      this.issues.push(issue);
      return issue;
    },
    delay,
  },
  {
    endpoint: deleteIssue,
    response({ id }) {
      this.issues = this.issues.filter(issue => issue.id != id);
      return { id };
    },
    delay,
  },
];

export const acidCollectionFixtures: Interceptor<AcidCollectionState>[] = [
  ...acidIssueFixtures,
  {
    endpoint: getRepo,
    response({ id }) {
      const repo = this.repos.find(item => item.id == id);
      if (!repo) return { id, issues: [] };
      return {
        ...repo,
        issues: this.issues.filter(issue => issue.repoId == id),
      };
    },
    delay,
  },
];

export const acidRollbackFixtures: Interceptor<AcidIssueState>[] = [
  getIssueListInterceptor,
  getIssueInterceptor,
  {
    endpoint: partialUpdateIssue,
    response() {
      throw Object.assign(new Error('Internal Server Error'), {
        status: 500,
      });
    },
    delay: 500,
  },
];

export const acidTradeFixtures: Interceptor<AcidTradeState>[] = [
  {
    endpoint: getAccount,
    response() {
      return { ...this.account };
    },
    delay,
  },
  {
    endpoint: getTradeList,
    response() {
      return this.trades;
    },
    delay,
  },
  {
    endpoint: createTrade,
    response(body) {
      const trade = {
        amount: 10,
        coin: 'DOGE',
        ...body,
        id: uuid(),
      };
      this.trades.push(trade);
      this.account.balance -= trade.amount;
      return {
        trade,
        account: { ...this.account },
      };
    },
    delay,
  },
];
