import React, { useContext } from 'react';

import { stageName, type ManagerStage } from './attribution';
import styles from './store.module.css';
import { CodeOpenerContext } from '../../editor/openCode';

/** Opens where the playground's code declares `stage`'s class, if it does:
 * the library's managers are no code of the reader's */
function useOpenManager({ className, library }: ManagerStage) {
  const opener = useContext(CodeOpenerContext);
  const target = !library && opener?.declared.get(className);
  return opener && target ? () => opener.open(target) : undefined;
}

const openLabel = (name: string) => 'Open ' + name + ' in the code';

/** A manager's name, a link to its code when the playground declares it.
 * Its click and keys stay its own inside a row that is a button itself */
export function ManagerName({ stage }: { stage: ManagerStage }) {
  const open = useOpenManager(stage);
  const name = stageName(stage);
  if (!open) return <>{name}</>;
  return (
    <button
      type="button"
      className={styles.managerLink}
      title={openLabel(name)}
      onClick={e => {
        e.stopPropagation();
        open();
      }}
      onKeyDown={e => e.stopPropagation()}
    >
      {name}
    </button>
  );
}

/** `</>` beside a manager's pipeline stage, whose own click picks it: opens
 * its code when the playground declares it */
export function CodeLink({ stage }: { stage: ManagerStage }) {
  const open = useOpenManager(stage);
  if (!open) return null;
  const name = stageName(stage);
  return (
    <button
      type="button"
      className={styles.codeLink}
      title={openLabel(name)}
      aria-label={openLabel(name)}
      onClick={open}
    >
      {'</>'}
    </button>
  );
}
