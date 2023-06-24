import clsx from 'clsx';
import React from 'react';
import { Link } from 'react-router-dom';

import simpleFetchDemo from './code/simple';
import appDemo from './code/todo-app';
import CodeEditor from './CodeEditor';
import styles from './styles.module.css';

const Demo = props => (
  <div className="container">
    <div className={clsx('row', styles.demoList)}>
      <div className="col col--3">
        <h2>A simple data fetch</h2>
        <div>
          <p>
            Add a single <Link to="/docs/api/useSuspense">useSuspense()</Link>{' '}
            call{' '}
            <Link to="/docs/getting-started/data-dependency">
              where you need its data
            </Link>
            .
          </p>
          <p>
            Rest Hooks automatically optimizes performance by caching the
            results, deduplicating fetches, efficient component render bindings
            and more.
          </p>
          {/*<p>
            Decoupling <em>how</em> to get data from <em>where</em> you use it
            enables reusable components.
          </p>*/}
        </div>
      </div>
      <div className="col col--9">
        <CodeEditor codes={simpleFetchDemo} defaultValue="rest" />
      </div>
    </div>
    <div className={clsx('row', styles.demoList)}>
      <div className="col col--3">
        <h2>An application</h2>
        <div>
          <p>
            Use <Link to="/docs/api/Controller#fetch">Controller.fetch()</Link>{' '}
            to update the store.
          </p>
          <p>
            This updates <strong>all</strong> usages{' '}
            <Link to="/docs/concepts/atomic-mutations">
              <em>atomically</em> and <em>immediately</em>
            </Link>{' '}
            with zero additional fetches. Rest Hooks automatically ensures{' '}
            <Link to="/docs/concepts/normalization">
              data consistency and integrity globally
            </Link>
            .
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
