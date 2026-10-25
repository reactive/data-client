import '../DesignSystem/base.css';
import { Loading } from '../DesignSystem/Loading';
import styles from '../styles.module.css';

/** The app's sheet while it loads: the page's first paint, the preview's
 * code loading, and the app waiting on its data all draw this one loading
 * page, so the preview goes from loading to loaded and nothing between */
export default function PendingSheet() {
  return (
    <div className={styles.sheet}>
      <Loading />
    </div>
  );
}
