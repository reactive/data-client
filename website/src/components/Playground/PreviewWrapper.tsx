import Translate from '@docusaurus/Translate';
import clsx from 'clsx';
import React from 'react';

import Header from './Header';
import styles from './styles.module.css';
import type { DemoViewport } from '../DemoVideo/types';

export default function PreviewWrapper({
  children,
  viewport,
  headerControls,
}: Props) {
  return (
    <div
      className={styles.previewWrapper}
      style={
        viewport &&
        ({
          '--demo-width': viewport.width,
          '--demo-height': viewport.height,
        } as React.CSSProperties)
      }
    >
      <Header
        className={clsx(
          styles.previewHeader,
          headerControls && styles.tabControls,
        )}
      >
        {headerControls ?
          <span className={styles.title}>
            <LivePreviewLabel />
          </span>
        : <LivePreviewLabel />}
        {headerControls}
      </Header>
      <div
        className={clsx(
          styles.playgroundResult,
          viewport && styles.demoViewport,
        )}
      >
        {children}
      </div>
    </div>
  );
}

function LivePreviewLabel() {
  return (
    <Translate
      id="theme.Playground.result"
      description="The result label of the live codeblocks"
    >
      🔴 Live Preview
    </Translate>
  );
}

interface Props {
  children: React.ReactNode;
  viewport?: DemoViewport;
  headerControls?: React.ReactNode;
}
