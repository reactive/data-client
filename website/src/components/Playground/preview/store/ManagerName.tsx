import React, { useContext } from 'react';

import { stageName, type ManagerStage } from './attribution';
import styles from './store.module.css';
import { CodeOpenerContext } from '../../editor/openCode';

/** Opens where the playground's code declares `name` (a class, a
 * component), if it does */
function useOpenDeclared(name: string | null) {
  const opener = useContext(CodeOpenerContext);
  const target = name && opener?.declared.get(name);
  return opener && target ? () => opener.open(target) : undefined;
}

/** Opens where the code declares `stage`'s class: the library's managers
 * are no code of the reader's */
const useOpenManager = ({ className, library }: ManagerStage) =>
  useOpenDeclared(library ? null : className);

const openLabel = (name: string) => 'Open ' + name + ' in the code';

/** `children`, a link to where the code declares `declared` (`name` unless
 * said; `null` never links) when it does. Its click and keys stay its own
 * inside a row that is a button itself */
export function DeclaredName({
  name,
  declared = name,
  children,
}: {
  name: string;
  declared?: string | null;
  children: React.ReactNode;
}) {
  const open = useOpenDeclared(declared);
  if (!open) return <>{children}</>;
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
      {children}
    </button>
  );
}

/** A manager's name, a link to its code when the playground declares it */
export function ManagerName({ stage }: { stage: ManagerStage }) {
  const name = stageName(stage);
  return (
    <DeclaredName name={name} declared={stage.library ? null : stage.className}>
      {name}
    </DeclaredName>
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
