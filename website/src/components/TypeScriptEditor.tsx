import clsx from 'clsx';
import { LiveProvider } from 'react-live';

import MonacoPreloads from './Playground/MonacoPreloads';
import { PlaygroundTextEdit } from './Playground/PlaygroundTextEdit';
import styles from './Playground/styles.module.css';
import { useCode } from './Playground/useCode';
import { useReactLiveTheme } from './Playground/useReactLiveTheme';

export default function TypeScriptEditor({ children, row }) {
  const { handleCodeChange, codes, codeTabs } = useCode(children);
  const realTheme = useReactLiveTheme();
  return (
    <LiveProvider theme={realTheme} enableTypeScript={true}>
      <div className={styles.playgroundQueryContainer}>
        <div
          className={clsx(styles.playgroundContainer, styles.standaloneEditor)}
        >
          <PlaygroundTextEdit
            fixtures={[]}
            row={row ?? codeTabs.length > 1}
            codeTabs={codeTabs}
            handleCodeChange={handleCodeChange}
            codes={codes}
            isPlayground={false}
          />
        </div>
      </div>
      <MonacoPreloads />
    </LiveProvider>
  );
}
