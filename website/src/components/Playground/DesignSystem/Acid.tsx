import React from 'react';

export function AcidCompare({ children }: { children: React.ReactNode }) {
  return <div className="acidCompare">{children}</div>;
}

export function AcidPane({
  title,
  torn,
  children,
}: {
  title: string;
  torn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={torn ? 'acidPane acidPane--torn' : 'acidPane'}>
      <div className="acidPaneHeader">
        <small>{title}</small>
        {torn ?
          <span className="acidTornLabel">Views disagree</span>
        : null}
      </div>
      {children}
    </div>
  );
}

export function IssueState({
  state,
  stale,
}: {
  state: 'open' | 'closed';
  stale?: boolean;
}) {
  const cls = [
    'issueState',
    `issueState--${state}`,
    stale ? 'issueState--stale' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return <span className={cls}>{state}</span>;
}

export function IssueRow({
  title,
  state,
  selected,
  ghost,
  stale,
  onClick,
  children,
}: {
  title: string;
  state: 'open' | 'closed';
  selected?: boolean;
  ghost?: boolean;
  stale?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={ghost ? 'listItem issueRow--ghost' : 'listItem'}
      style={{ cursor: onClick ? 'pointer' : undefined }}
      onClick={onClick}
    >
      {selected ?
        <b>{title}</b>
      : <span>{title}</span>}
      <IssueState state={state} stale={stale} />
      {children}
    </div>
  );
}
