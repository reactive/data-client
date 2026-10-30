import clsx from 'clsx';

import { ResponseSheet } from './Response';
import styles from './styles.module.css';
import playgroundstyles from '../Playground/styles.module.css';

/** An exchange the code hasn't made yet (after a client navigation, the
 * page's HTML holds none): the request, and its response if there will be
 * one, in skeletons */
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
      </div>
      {answered ?
        <ResponseSheet busy>
          <div className={styles.skeletonBody}>
            <span className={styles.skeleton} />
            <span className={styles.skeleton} />
            <span className={styles.skeleton} />
          </div>
        </ResponseSheet>
      : null}
    </>
  );
}
