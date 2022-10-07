import React, {
  memo,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react';
import { LiveProvider, LiveEditor, LiveProviderProps } from 'react-live';
import clsx from 'clsx';
import Translate from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { usePrismTheme } from '@docusaurus/theme-common';
import { transpileModule, ModuleKind, ScriptTarget, JsxEmit } from 'typescript';
import { FixtureEndpoint } from '@rest-hooks/test';

import CodeTabContext from '../Demo/CodeTabContext';
import Preview from './Preview';
import styles from './styles.module.css';
import FixturePreview from './FixturePreview';

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
