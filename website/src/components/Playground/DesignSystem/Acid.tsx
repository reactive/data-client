import React from 'react';

export function AcidCompare({ children }: { children: React.ReactNode }) {
  return <div className="acidCompare">{children}</div>;
}

export function AcidPane({
  title,
  subtitle,
  torn,
  children,
}: {
  title: string;
  subtitle?: string;
  torn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={torn ? 'acidPane acidPane--torn' : 'acidPane'}>
      <div className="acidPaneHeader">
        <div className="acidPaneTitle">
          <small>{title}</small>
          {subtitle ?
            <span className="acidPaneSubtitle">{subtitle}</span>
          : null}
        </div>
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
  const cls = [
    'issueRow',
    selected ? 'issueRow--selected' : '',
    ghost ? 'issueRow--ghost' : '',
    onClick ? 'issueRow--clickable' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls} onClick={onClick}>
      <span className="issueRowTitle">{title}</span>
      <IssueState state={state} stale={stale} />
      {children}
    </div>
  );
}
