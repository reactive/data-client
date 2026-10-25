import React, { useContext } from 'react';

import { baseName, isLibraryManager } from './attribution';
import styles from './store.module.css';
import { CodeOpenerContext } from '../../editor/openCode';

/** A manager's name, which opens its code when the playground declares it
 * (the library's are no code of the reader's). `stage`: beside a pipeline
 * stage, whose own click picks it, it is a `</>` of its own instead. Its
 * click and keys stay its own inside a row that is a button itself */
export default function ManagerName({
  name,
  stage = false,
}: {
  name: string;
  stage?: boolean;
}) {
  const opener = useContext(CodeOpenerContext);
  const target =
    !isLibraryManager(name) && opener?.declared.get(baseName(name));
  if (!opener || !target) return stage ? null : <>{name}</>;
  const label = 'Open ' + name + ' in the code';
  return (
    <button
      type="button"
      className={stage ? styles.codeLink : styles.managerLink}
      title={label}
      aria-label={stage ? label : undefined}
      onClick={e => {
        e.stopPropagation();
        opener.open(target);
      }}
      onKeyDown={e => e.stopPropagation()}
    >
      {stage ? '</>' : name}
    </button>
  );
}
