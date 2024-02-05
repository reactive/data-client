import styles from './Grid.module.css';

export default function Grid({ children, cols }) {
  return (
    <div className={styles.grid}>
      {typeof children === 'string' ?
        children
      : Array.isArray(children) ?
        children
      : children.props.children}
    </div>
  );
}
