import Translate, { translate } from '@docusaurus/Translate';
import clsx from 'clsx';

import styles from './ErrorMessage.module.css';

/** Matches the props of AsyncBoundary's `errorComponent` */
export function ErrorMessage({
  error,
  resetErrorBoundary,
  className,
}: {
  error: Error & { status?: number };
  resetErrorBoundary?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={clsx('alert alert--danger', styles.error, className)}
    >
      <div className={styles.text}>
        <strong>
          {error.status ?
            translate(
              {
                id: 'playground.errorMessage.status',
                message: 'Request failed ({status})',
              },
              { status: error.status },
            )
          : error.name}
        </strong>
        <code className={styles.message}>{error.message}</code>
      </div>
      {resetErrorBoundary && (
        <button
          type="button"
          className="button button--sm button--secondary"
          onClick={resetErrorBoundary}
        >
          <Translate id="playground.errorMessage.reset">Reset</Translate>
        </button>
      )}
    </div>
  );
}
