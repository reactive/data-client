import CodeBlock from '@theme/CodeBlock';
import clsx from 'clsx';

import styles from './Wrapper.module.css';
import { useCodeDocuments } from '../Playground/editor/codeModel';
import Header from '../Playground/Header';

export default function Response({ response, status }: Props) {
  const { documents } = useCodeDocuments(
    response ? JSON.stringify(response, undefined, 2) : 'NO CONTENT',
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
      >{`${documents[0].value}`}</CodeBlock>
    </div>
  );
}
interface Props {
  response: JSON;
  status: number;
}
