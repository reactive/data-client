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
      <div
        className={clsx(styles.playgroundContainer, styles.standaloneEditor)}
      >
        <PlaygroundTextEdit
          fixtures={[]}
          row={
            row === undefined ?
              codeTabs.length > 1 ?
                true
              : false
            : row
          }
          codeTabs={codeTabs}
          handleCodeChange={handleCodeChange}
          codes={codes}
          large={false}
          isPlayground={false}
        />
      </div>
      <MonacoPreloads />
    </LiveProvider>
  );
}
