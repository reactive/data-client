import '../DesignSystem/base.css';
import { Loading } from '../DesignSystem/Loading';
import styles from '../styles.module.css';

/** The app's sheet: its module class (the frame) and the global `sheet`
 * hook the design system keys a page's first and last pieces on */
export const sheetClassName = `${styles.sheet} sheet`;

/** The app's sheet while it loads: the page's first paint, the preview's
 * code loading, and the app waiting on its data all draw this one loading
 * page, so the preview goes from loading to loaded and nothing between */
export default function PendingSheet() {
  return (
    <div className={sheetClassName} aria-busy>
      <Loading />
    </div>
  );
}
