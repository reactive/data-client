import clsx from 'clsx';

import { RequestDefinition, ResponseDefinition } from './Definition';
import { ResponseSheet } from './Response';
import styles from './styles.module.css';
import playgroundstyles from '../Playground/styles.module.css';

/** An exchange the code hasn't made yet (after a client navigation, the
 * page's HTML holds none): the request, and its response if there will be
 * one, in skeletons; the options they are made from are already known */
export default function PendingExchange({ answered }: { answered: boolean }) {
  return (
    <>
      <div
        className={clsx(playgroundstyles.folderHead, styles.request)}
        aria-busy
      >
        <div className={styles.requestLine}>
          <span className={clsx(styles.skeleton, styles.short)} />
          <span className={styles.skeleton} />
        </div>
        <RequestDefinition />
      </div>
      {answered ?
        <ResponseSheet busy>
          <div className={styles.skeletonBody}>
            <span className={styles.skeleton} />
            <span className={styles.skeleton} />
            <span className={styles.skeleton} />
          </div>
          <ResponseDefinition />
        </ResponseSheet>
      : null}
    </>
  );
}
