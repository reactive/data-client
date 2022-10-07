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
import Header from './Header';

function PreviewWithHeader({ groupId, defaultOpen, row, fixtures }) {
  return (
    <div
      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <Header>
        <Translate
          id="theme.Playground.result"
          description="The result label of the live codeblocks"
        >
          Live Preview
        </Translate>
      </Header>
      <div className={styles.playgroundResult}>
        <Preview
          groupId={groupId}
          defaultOpen={defaultOpen}
          row={row}
          fixtures={fixtures}
        />
      </div>
    </div>
  );
}
export default memo(PreviewWithHeader);
