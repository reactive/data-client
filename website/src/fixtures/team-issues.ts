import { Entity, resource } from '@data-client/rest';
import type { Interceptor } from '@data-client/test';

import { users } from './assignees';

class Issue extends Entity {
  id = 0;
  assigneeId = 0;
  title = '';
  state: 'open' | 'closed' = 'open';

  static key = 'Issue';
}
const IssueResource = resource({
  path: '/issues/:id',
  searchParams: {} as { assigneeId?: string | number } | undefined,
  schema: Issue,
});

class User extends Entity {
  id = 0;
  name = '';

  static key = 'User';
}
const UserResource = resource({
  path: '/users/:id',
  schema: User,
});

/** An issue as the server sends it */
type IssueData = Pick<Issue, 'id' | 'assigneeId' | 'title' | 'state'>;
/** The demo's server: its issues in list order, and the next id it gives */
type TeamIssueServer = { issues: IssueData[]; nextId: number };

const issues: IssueData[] = [
  { id: 1, assigneeId: 1, title: 'Signup email not sent', state: 'open' },
  { id: 2, assigneeId: 2, title: 'Old plans on pricing page', state: 'closed' },
  { id: 3, assigneeId: 3, title: 'Search ignores accents', state: 'open' },
  { id: 4, assigneeId: 1, title: 'Avatar upload fails', state: 'open' },
  { id: 5, assigneeId: 3, title: 'CSV export drops a column', state: 'open' },
  { id: 6, assigneeId: 2, title: 'Dark mode flickers', state: 'open' },
  { id: 7, assigneeId: 1, title: 'Invite link expires early', state: 'open' },
];

export const getInitialInterceptorData = (): TeamIssueServer => ({
  issues: structuredClone(issues),
  nextId: Math.max(...issues.map(issue => issue.id)) + 1,
});

type UserData = (typeof users)[number];

const issuesOf = (server: TeamIssueServer, assigneeId: number | string) =>
  server.issues.filter(issue => issue.assigneeId === Number(assigneeId));

/** A user as `/users` sends them: with the issues assigned to them nested */
const withIssues = (server: TeamIssueServer, user: UserData) => ({
  ...user,
  issues: issuesOf(server, user.id),
});

const notFound = (what: string) => ({ status: 404, message: `No ${what}` });

/** Long enough that a page waiting on a request shows it */
const delay = 300;

/** A team's issue tracker: `/users` nests each user's issues, so one request
 * loads what the user and issue pages read. Every endpoint answers from one
 * server, which orders lists as the client's push and move do (new and
 * reassigned issues last), so a refetch (stale data, an edited demo) changes
 * nothing on screen. */
export const teamIssueFixtures: Interceptor<TeamIssueServer>[] = [
  {
    endpoint: UserResource.getList,
    response() {
      return users.map(user => withIssues(this, user));
    },
    delay,
  },
  {
    endpoint: UserResource.get,
    response({ id }: Parameters<typeof UserResource.get>[0]) {
      const user = users.find(user => user.id === Number(id));
      if (!user) throw notFound(`user ${id}`);
      return withIssues(this, user);
    },
    delay,
  },
  {
    endpoint: IssueResource.getList,
    response(...args: Parameters<typeof IssueResource.getList>) {
      const assigneeId = args[0]?.assigneeId;
      return assigneeId === undefined ?
          this.issues
        : issuesOf(this, assigneeId);
    },
    delay,
  },
  {
    endpoint: IssueResource.get,
    response({ id }: Parameters<typeof IssueResource.get>[0]) {
      const issue = this.issues.find(issue => issue.id === Number(id));
      if (!issue) throw notFound(`issue ${id}`);
      return issue;
    },
    delay,
  },
  {
    endpoint: IssueResource.getList.push,
    response(...args: Parameters<typeof IssueResource.getList.push>) {
      // the body is the last argument: push(body) or push(params, body)
      const body = args[args.length - 1] as Partial<IssueData>;
      const issue: IssueData = {
        assigneeId: 0,
        title: '',
        state: 'open',
        ...body,
        id: this.nextId++,
      };
      this.issues.push(issue);
      return issue;
    },
  },
  // also answers getList.move (the same PATCH)
  {
    endpoint: IssueResource.partialUpdate,
    response(
      { id }: Parameters<typeof IssueResource.partialUpdate>[0],
      body: Parameters<typeof IssueResource.partialUpdate>[1],
    ) {
      const index = this.issues.findIndex(issue => issue.id === Number(id));
      if (index === -1) throw notFound(`issue ${id}`);
      const stored = this.issues[index];
      const issue = { ...stored, ...body, id: stored.id };
      if (issue.assigneeId === stored.assigneeId) {
        this.issues[index] = issue;
      } else {
        // last in its new assignee's list
        this.issues.splice(index, 1);
        this.issues.push(issue);
      }
      return issue;
    },
    delay: 150,
  },
  {
    endpoint: IssueResource.delete,
    response({ id }: Parameters<typeof IssueResource.delete>[0]) {
      const pk = Number(id);
      this.issues = this.issues.filter(issue => issue.id !== pk);
      return { id: pk };
    },
    delay: 150,
  },
];
