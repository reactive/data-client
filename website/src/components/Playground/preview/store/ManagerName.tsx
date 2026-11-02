import React, { useContext } from 'react';

import { stageName, type ManagerStage } from './attribution';
import styles from './store.module.css';
import { CodeOpenerContext, type CodeTarget } from '../../editor/openCode';

/** Opens where the playground's code declares `name` (a class, a
 * component), if it does */
function useOpenDeclared(name: string | null) {
  const opener = useContext(CodeOpenerContext);
  const target = name && opener?.declared.get(name);
  return opener && target ? () => opener.open(target) : undefined;
}

/** The class the code declares for `stage`: none for the library's
 * managers, which are no code of the reader's */
const declaredClass = ({ className, library }: ManagerStage) =>
  library ? null : className;

/** Opens where the code declares `stage`'s class */
const useOpenManager = (stage: ManagerStage) =>
  useOpenDeclared(declaredClass(stage));

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

/** `Demo.tsx:14`: the line of the playground's code `source` names, a link
 * to it when the playground can open its code. Hovered, it shows the lines
 * around it */
export function SourceLink({ source }: { source: CodeTarget }) {
  const opener = useContext(CodeOpenerContext);
  const label = `${source.path.slice(source.path.lastIndexOf('/') + 1)}:${source.line}`;
  if (!opener) return <span className={styles.sourceLink}>{label}</span>;
  const code = opener.code?.(source.path);
  return (
    <span className={styles.sourcePeekHost}>
      <button
        type="button"
        className={styles.sourceLink}
        title={code === undefined ? openLabel(label) : undefined}
        aria-label={openLabel(label)}
        onClick={e => {
          e.stopPropagation();
          opener.open(source);
        }}
        onKeyDown={e => e.stopPropagation()}
      >
        {label}
      </button>
      {code !== undefined && <SourcePeek code={code} line={source.line} />}
    </span>
  );
}

/** Lines shown on each side of a peeked line */
const PEEK_AROUND = 2;

/** The lines of `code` around `line`, it marked, their shared indent gone */
function SourcePeek({ code, line }: { code: string; line: number }) {
  const all = code.split('\n');
  const from = Math.max(1, line - PEEK_AROUND);
  const lines = all.slice(from - 1, line + PEEK_AROUND);
  const indent = Math.min(
    ...lines
      .filter(text => text.trim())
      .map(text => /^\s*/.exec(text)![0].length),
  );
  return (
    <span className={styles.sourcePeek} aria-hidden>
      {lines.map((text, i) => (
        <span
          key={from + i}
          className={styles.peekLine}
          data-at={from + i === line || undefined}
        >
          <span className={styles.peekNumber}>{from + i}</span>
          {text.slice(indent) || ' '}
        </span>
      ))}
    </span>
  );
}

/** A manager's name, a link to its code when the playground declares it */
export function ManagerName({ stage }: { stage: ManagerStage }) {
  const name = stageName(stage);
  return (
    <DeclaredName name={name} declared={declaredClass(stage)}>
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
