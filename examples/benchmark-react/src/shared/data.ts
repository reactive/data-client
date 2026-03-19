import type { Issue, Label, User } from './types';

/** Sort issues by title, optionally limiting to the first `limit` results. */
export function sortByTitle<T extends { title: string }>(
  items: T[],
  limit?: number,
): T[] {
  const sorted = [...items].sort((a, b) => a.title.localeCompare(b.title));
  return limit ? sorted.slice(0, limit) : sorted;
}

const LABEL_DEFS: { name: string; color: string; description: string }[] = [
  { name: 'bug', color: 'd73a4a', description: "Something isn't working" },
  {
    name: 'enhancement',
    color: 'a2eeef',
    description: 'New feature or request',
  },
  {
    name: 'documentation',
    color: '0075ca',
    description: 'Improvements or additions to documentation',
  },
  {
    name: 'good first issue',
    color: '7057ff',
    description: 'Good for newcomers',
  },
  {
    name: 'help wanted',
    color: '008672',
    description: 'Extra attention needed',
  },
  {
    name: 'performance',
    color: 'fbca04',
    description: 'Performance-related issue',
  },
  {
    name: 'breaking change',
    color: 'e11d48',
    description: 'Introduces a breaking change',
  },
  {
    name: 'dependencies',
    color: '0366d6',
    description: 'Pull requests that update a dependency',
  },
  { name: 'refactor', color: 'c5def5', description: 'Code refactoring' },
  {
    name: 'testing',
    color: 'bfd4f2',
    description: 'Related to testing infrastructure',
  },
];

export const FIXTURE_LABELS: Label[] = LABEL_DEFS.map((def, i) => ({
  id: i + 1,
  nodeId: `MDU6TGFiZWw${i + 1}`,
  name: def.name,
  color: def.color,
  description: def.description,
  default: i < 3,
}));

const ISSUE_TITLE_PREFIXES = [
  'Add',
  'Deprecate',
  'Fix',
  'Handle',
  'Improve',
  'Migrate',
  'Refactor',
  'Remove',
  'Support',
  'Update',
];

const ISSUE_TITLE_SUBJECTS = [
  'type inference for nested schemas',
  'race condition in concurrent fetches',
  'memory leak in subscription manager',
  'cache invalidation after mutation',
  'optimistic update rollback on error',
  'SSR hydration mismatch',
  'pagination with cursor-based endpoints',
  'retry logic for network failures',
  'stale-while-revalidate behavior',
  'normalized entity merging',
  'query parameter serialization',
  'WebSocket reconnection handling',
  'bundle size reduction for tree-shaking',
  'TypeScript strict mode compatibility',
  'React 19 concurrent features',
  'error boundary integration',
  'middleware execution order',
  'batch request coalescing',
  'schema validation at runtime',
  'offline-first data synchronization',
];

/**
 * Generate users - shared across issues to stress normalization.
 * Fewer users than issues means many issues share the same user reference.
 */
export function generateUsers(count: number): User[] {
  const users: User[] = [];
  for (let i = 0; i < count; i++) {
    users.push({
      id: 1000 + i,
      login: `user${i}`,
      nodeId: `MDQ6VXNlcjEwMDA${i}`,
      avatarUrl: `https://avatars.githubusercontent.com/u/${1000 + i}?v=4`,
      gravatarId: '',
      type: 'User',
      siteAdmin: false,
      htmlUrl: `https://github.com/user${i}`,
      name: `User ${i}`,
      company: i % 3 === 0 ? 'Acme Corp' : '',
      blog: i % 4 === 0 ? `https://user${i}.dev` : '',
      location: ['San Francisco', 'London', 'Tokyo', 'Berlin', 'Sydney'][i % 5],
      email: `user${i}@example.com`,
      bio: `Software engineer #${i}. Likes open source and coffee.`,
      publicRepos: (i * 7 + 3) % 200,
      publicGists: (i * 3 + 1) % 50,
      followers: (i * 137 + 42) % 10000,
      following: (i * 11 + 5) % 500,
      createdAt: new Date(2015, 0, 1 + (i % 365)).toISOString(),
      updatedAt: new Date(2024, i % 12, 1 + (i % 28)).toISOString(),
    });
  }
  return users;
}

/**
 * Generate issues with nested user entities (shared references) and labels.
 * Issues cycle through users so many issues share the same user.
 */
export function generateIssues(
  count: number,
  users: User[],
  labels: Label[] = FIXTURE_LABELS,
): Issue[] {
  const issues: Issue[] = [];
  const titlePrefixes = ISSUE_TITLE_PREFIXES;
  const titleSubjects = ISSUE_TITLE_SUBJECTS;
  for (let i = 0; i < count; i++) {
    const user = users[i % users.length];
    const created = new Date(2023, i % 12, 1 + (i % 28)).toISOString();
    const state: Issue['state'] = i % 3 === 2 ? 'closed' : 'open';
    const labelCount = i % 4;
    const issueLabels: Label[] = [];
    for (let li = 0; li < labelCount; li++) {
      issueLabels.push(labels[(i + li) % labels.length]);
    }
    const num = i + 1;
    issues.push({
      id: 100000 + num,
      number: num,
      title: `${titlePrefixes[i % titlePrefixes.length]} ${titleSubjects[i % titleSubjects.length]}`,
      body: `Description for issue #${num}: a moderately long text field that exercises serialization and storage overhead in the benchmark.`,
      state,
      locked: i % 20 === 0,
      comments: i % 15,
      labels: issueLabels,
      user: { ...user },
      htmlUrl: `https://github.com/owner/repo/issues/${num}`,
      repositoryUrl: 'https://api.github.com/repos/owner/repo',
      authorAssociation: i % 5 === 0 ? 'MEMBER' : 'NONE',
      createdAt: created,
      updatedAt: new Date(2024, i % 12, 1 + (i % 28)).toISOString(),
      closedAt:
        state === 'closed' ? new Date(2024, i % 12, 5).toISOString() : null,
    });
  }
  return issues;
}

/** Unique users from fixture (for seeding and updateUser scenarios) */
export const FIXTURE_USERS = generateUsers(20);

/** Pre-generated fixture for benchmark - 10000 issues, 20 shared users */
export const FIXTURE_ISSUES = generateIssues(10000, FIXTURE_USERS);

/** O(1) issue lookup by number */
export const FIXTURE_ISSUES_BY_NUMBER = new Map(
  FIXTURE_ISSUES.map(i => [i.number, i]),
);

/** O(1) user lookup by login */
export const FIXTURE_USERS_BY_LOGIN = new Map(
  FIXTURE_USERS.map(u => [u.login, u]),
);

/**
 * Generate fresh issues/users with distinct IDs for bulk ingestion scenarios.
 * Uses offset numbering so these don't collide with pre-seeded FIXTURE data.
 */
export function generateFreshData(
  issueCount: number,
  userCount = 20,
): { issues: Issue[]; users: User[] } {
  const users: User[] = [];
  for (let i = 0; i < userCount; i++) {
    users.push({
      id: 50000 + i,
      login: `freshuser${i}`,
      nodeId: `MDQ6VXNlcjUwMDAw${i}`,
      avatarUrl: `https://avatars.githubusercontent.com/u/${50000 + i}?v=4`,
      gravatarId: '',
      type: 'User',
      siteAdmin: false,
      htmlUrl: `https://github.com/freshuser${i}`,
      name: `Fresh User ${i}`,
      company: '',
      blog: '',
      location: 'Remote',
      email: `freshuser${i}@example.com`,
      bio: `Fresh contributor #${i}.`,
      publicRepos: (i * 5 + 2) % 100,
      publicGists: 0,
      followers: (i * 89 + 17) % 5000,
      following: (i * 7 + 3) % 200,
      createdAt: new Date(2021, 6, 1 + (i % 28)).toISOString(),
      updatedAt: new Date(2024, i % 12, 1 + (i % 28)).toISOString(),
    });
  }
  const issues: Issue[] = [];
  for (let i = 0; i < issueCount; i++) {
    const user = users[i % userCount];
    const created = new Date(2024, i % 12, 1 + (i % 28)).toISOString();
    const num = 50000 + i + 1;
    issues.push({
      id: 200000 + num,
      number: num,
      title: `Fresh issue #${num}`,
      body: `Fresh issue ${num} description with enough text to be realistic.`,
      state: i % 2 === 0 ? 'open' : 'closed',
      locked: false,
      comments: 0,
      labels: [FIXTURE_LABELS[i % FIXTURE_LABELS.length]],
      user: { ...user },
      htmlUrl: `https://github.com/owner/repo/issues/${num}`,
      repositoryUrl: 'https://api.github.com/repos/owner/repo',
      authorAssociation: 'NONE',
      createdAt: created,
      updatedAt: created,
      closedAt: null,
    });
  }
  return { issues, users };
}
