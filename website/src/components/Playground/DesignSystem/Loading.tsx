import useBaseUrl from '@docusaurus/useBaseUrl';

import styles from './Loading.module.css';

export function Loading() {
  const loadingUrl = useBaseUrl('img/loading-logo.svg');
  return (
    <div className={styles.loading}>
      <img src={loadingUrl} />
    </div>
  );
}
