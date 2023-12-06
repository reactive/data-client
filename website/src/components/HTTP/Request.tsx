import CodeBlock from '@theme/CodeBlock';

import styles from './Wrapper.module.css';
import Header from '../Playground/Header';

export default function Request({ input, init }: Props) {
  let text = `${init.method} ${input}`;
  Object.entries(init.headers).forEach(([key, value]) => {
    text += `\n${key}: ${value}`;
  });
  return (
    <div>
      <Header small>Request</Header>
      <CodeBlock language="bash" className={styles.containedCode}>
        {text}
      </CodeBlock>
    </div>
  );
}
interface Props {
  input: RequestInfo;
  init: RequestInit;
}
