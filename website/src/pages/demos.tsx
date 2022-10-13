import React from 'react';
import Layout from '@theme/Layout';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

export default function DemoList() {
  return (
    <Layout
      title="React Suspense Demos"
      description="Rest Hooks Suspense Demos"
    >
      <Tabs
        defaultValue="todo"
        values={[
          { label: 'Todo', value: 'todo' },
          { label: 'GitHub', value: 'github' },
        ]}
        groupId="Demos"
      >
        <TabItem value="todo">
          {/*Todo
              <a
                href="https://github.com/coinbase/rest-hooks/tree/master/examples/todo-app"
                target="_blank"
                rel="noopener noreferrer"
                className="header-github-link"
                style={{ marginLeft: '1ex' }}
        ></a>*/}
          <iframe
            src="https://stackblitz.com/github/coinbase/rest-hooks/tree/master/examples/todo-app?embed=1&file=src%2Fpages%2FHome%2FTodoListComponent.tsx&hideDevTools=1&hideNavigation=1"
            width="900"
            height="600"
            style={{ width: '100%', height: 'calc(100vh - 170px)' }}
          ></iframe>
        </TabItem>
        <TabItem value="github">
          {/*            <a
              href="https://github.com/coinbase/rest-hooks/tree/master/examples/github-app"
              target="_blank"
              rel="noopener noreferrer"
              className="header-github-link"
              style={{ marginLeft: '1ex' }}
            ></a>*/}
          <iframe
            src="https://stackblitz.com/github/coinbase/rest-hooks/tree/master/examples/github-app?embed=1&file=src%2Fpages%2FIssueList.tsx&hideNavigation=1&hideDevTools=1"
            width="900"
            height="700"
            style={{ width: '100%', height: 'calc(100vh - 170px)' }}
          ></iframe>
        </TabItem>
      </Tabs>
    </Layout>
  );
}
