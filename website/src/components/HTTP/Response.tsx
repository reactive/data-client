import CodeBlock from '@theme/CodeBlock';
import clsx from 'clsx';

import styles from './Wrapper.module.css';
import Header from '../Playground/Header';
import { useCode } from '../Playground/useCode';

export default function Response({ response, status }: Props) {
  const { handleCodeChange, codes, codeTabs } = useCode(
    JSON.stringify(response, undefined, 2),
  );

  return (
    <div>
      <Header small className={clsx(styles.doubleTitle)}>
        <span>Response</span>
        <span>{status}</span>
      </Header>
      <CodeBlock
        language="json"
        className={styles.containedCode}
      >{`${codes[0]}`}</CodeBlock>
    </div>
  );
}
interface Props {
  response: JSON;
  status: number;
}
