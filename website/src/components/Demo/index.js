import clsx from 'clsx';
import React from 'react';
import { Link } from 'react-router-dom';

import mutationDemo from './code/profile-edit';
import appDemo from './code/todo-app';
import CodeEditor from './CodeEditor';
import styles from './styles.module.css';

const Demo = props => (
  <div className="container">
    <div className={clsx('row', styles.demoList)}>
      <div className="col col--3">
        <h2>Reactive Mutations</h2>
        <div>
          <p>
            Render data with{' '}
            <Link to="/docs/api/useSuspense">useSuspense()</Link>. Then mutate
            with <Link to="/docs/api/Controller#fetch">Controller.fetch()</Link>
          </p>
          <p>
            This updates <strong>all</strong> usages{' '}
            <Link to="/docs/concepts/atomic-mutations">
              <em>atomically</em> and <em>immediately</em>
            </Link>{' '}
            with zero additional fetches. Rest Hooks automatically ensures{' '}
            <Link to="/docs/concepts/normalization">
              data consistency and integrity globally
            </Link>{' '}
            including even the most challenging{' '}
            <Link to="/rest/guides/optimistic-updates#example-race-condition">
              race conditions
            </Link>
            .
          </p>
        </div>
      </div>
      <div className="col col--9">
        <CodeEditor codes={mutationDemo} defaultValue="rest" />
      </div>
    </div>
    <div className={clsx('row', styles.demoList)}>
      <div className="col col--3">
        <h2>Structured data</h2>
        <div>
          <p>
            Data consistency, performance, and typesafety scale even as your
            data becomes more complex.
          </p>
          <p>
            <Link to="/docs/concepts/atomic-mutations#create">Creates</Link> and{' '}
            <Link to="/docs/concepts/atomic-mutations#delete">deletes</Link>{' '}
            reactively update the correct lists, even when those lists are{' '}
            <Link to="/rest/api/Collection">nested inside other objects</Link>.
          </p>
          <p>
            Rest easy with the help of{' '}
            <Link to="/docs/guides/debugging">debugging</Link>,{' '}
            <Link to="/docs/guides/unit-testing-hooks">unit testing</Link>, and{' '}
            <Link to="/docs/guides/storybook">storybook integration</Link>.
          </p>
        </div>
      </div>
      <div className="col col--9">
        <CodeEditor codes={appDemo} defaultValue="rest" />
      </div>
    </div>
  </div>
);
export default Demo;
