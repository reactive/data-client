import clsx from 'clsx';
import React from 'react';
import { Link } from 'react-router-dom';

import appDemo from './code/posts-app';
import mutationDemo from './code/profile-edit';
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
        <h2>Nested data</h2>
        <div>
          <p>
            Data can be consumed and controlled in many contexts, speeding up
            development.
          </p>
          <p>
            Every piece of data maintains referential stability unless it
            changes. This ensures the most optimized render performance, as well
            as predictable equality checks.
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
