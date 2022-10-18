import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.css';

type OnClick = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>['onClick'];

export default function Header({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: OnClick;
}) {
  return (
    <div
      className={clsx(
        styles.playgroundHeader,
        className,
        onClick ? styles.clickable : null,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
