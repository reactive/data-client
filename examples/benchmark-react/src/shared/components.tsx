import React from 'react';
import type { RowComponentProps } from 'react-window';

import type { Issue, User } from './types';

export const ISSUE_HEIGHT = 30;
export const VISIBLE_COUNT = 40;
export const LIST_STYLE = { height: ISSUE_HEIGHT * VISIBLE_COUNT } as const;
export const DOUBLE_LIST_STYLE = { display: 'flex', gap: 8 } as const;

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

/**
 * Expensive memoized user component. Simulates a realistic rich user
 * card: avatar color derivation, bio truncation, follower formatting, date
 * parsing. Libraries that preserve user referential equality skip this
 * entirely on unrelated updates; those that don't pay per row.
 */
function UserView({ user }: { user: User }) {
  const hash = djb2(user.login + user.email + user.bio);
  const hue = hash % 360;
  const initials = user.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase();
  const bioWords = user.bio.split(/\s+/);
  const truncatedBio =
    bioWords.length > 12 ? bioWords.slice(0, 12).join(' ') + '…' : user.bio;
  const followerStr =
    user.followers >= 1000 ?
      `${(user.followers / 1000).toFixed(1)}k`
    : String(user.followers);
  const joinYear = new Date(user.createdAt).getFullYear();

  return (
    <span
      data-user
      data-user-login={user.login}
      style={{ color: `hsl(${hue},60%,40%)` }}
    >
      <span data-initials>{initials}</span>
      <span data-user-name>{user.name}</span>
      <span data-bio>{truncatedBio}</span>
      <span data-followers>{followerStr}</span>
      <span data-joined>{joinYear}</span>
    </span>
  );
}

const STATE_ICONS: Record<string, string> = {
  open: '🟢',
  closed: '🟣',
};

/**
 * Row component — React Compiler auto-memoizes props/values. Libraries that
 * preserve referential equality benefit from the compiler's caching; those
 * that don't still re-execute the expensive UserView on every render.
 */
export function IssueRow({ issue }: { issue: Issue }) {
  const labelStr = issue.labels.map(l => l.name).join(', ');
  return (
    <div data-issue-number={issue.number} data-bench-item>
      <span data-title>{issue.title}</span>
      <UserView user={issue.user} />
      <span data-state>{STATE_ICONS[issue.state] ?? issue.state}</span>
      <span data-comments>{issue.comments}</span>
      <span data-labels>{labelStr}</span>
      <span data-body>{issue.body}</span>
    </div>
  );
}

/** Generic react-window row that renders an IssueRow from an issues array. */
export function IssuesRow({
  index,
  style,
  issues,
}: RowComponentProps<{ issues: Issue[] }>) {
  return (
    <div style={style}>
      <IssueRow issue={issues[index]} />
    </div>
  );
}

/** Plain (non-virtualized) list keyed by issue number. Renders up to VISIBLE_COUNT issues. */
export function PlainIssueList({ issues }: { issues: Issue[] }) {
  const visible =
    issues.length > VISIBLE_COUNT ? issues.slice(0, VISIBLE_COUNT) : issues;
  return (
    <div style={LIST_STYLE}>
      {visible.map(issue => (
        <IssueRow key={issue.number} issue={issue} />
      ))}
    </div>
  );
}
