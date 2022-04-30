import React from 'react';
import Layout from '@theme/Layout';

export default function DemoList() {
  return (
    <Layout
      title="React Suspense Demos"
      description="Rest Hooks Suspense Demos"
    >
      <div className="container margin-vert--lg">
        <h1
          style={{
            display: 'flex',
            alignItems: 'baseline',
          }}
        >
          Todo{' '}
          <a
            href="https://github.com/coinbase/rest-hooks/tree/master/examples/todo-app"
            target="_blank"
            rel="noopener noreferrer"
            className="header-github-link"
            style={{ marginLeft: '1ex' }}
          ></a>
        </h1>
        <p>
          <iframe
            src="https://stackblitz.com/github/coinbase/rest-hooks/tree/master/examples/todo-app?embed=1&file=src%2Fpages%2FHome%2FTodoListComponent.tsx&hidedevtools=1&view=both"
            width="100%"
            height="600"
          ></iframe>
        </p>
        <h1
          style={{
            display: 'flex',
            alignItems: 'baseline',
          }}
        >
          Github{' '}
          <a
            href="https://github.com/coinbase/rest-hooks/tree/master/examples/github-app"
            target="_blank"
            rel="noopener noreferrer"
            className="header-github-link"
            style={{ marginLeft: '1ex' }}
          ></a>
        </h1>
        <p>
          <iframe
            src="https://stackblitz.com/github/coinbase/rest-hooks/tree/master/examples/github-app?embed=1&file=src%2Fpages%2FIssueList.tsx&hidedevtools=1&view=preview"
            width="100%"
            height="700"
          ></iframe>
        </p>
      </div>
    </Layout>
  );
}
