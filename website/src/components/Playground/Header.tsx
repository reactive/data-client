import clsx from 'clsx';
import React from 'react';

import styles from './styles.module.css';

type OnClick = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>['onClick'];

export default function Header({
  children,
  className,
  onClick,
  small,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: OnClick;
  small?: boolean;
}) {
  return (
    <div
      className={clsx(
        styles.playgroundHeader,
        className,
        onClick ? styles.clickable : null,
        { [styles.small]: small },
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
Header.defaultProps = {
  small: false,
};
