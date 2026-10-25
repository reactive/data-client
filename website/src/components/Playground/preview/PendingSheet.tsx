import styles from '../styles.module.css';

/** The app's sheet before its code has run (the page's first paint, and
 * while the preview's code loads): blank, at the size an app that fits the
 * preview takes, so the preview holds its final shape and only its content
 * arrives */
export default function PendingSheet() {
  return <div className={styles.sheet} data-pending />;
}
