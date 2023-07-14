import Layout from '@theme/Layout';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

import { searchParams } from '../utils/searchParams';

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
          { label: 'NextJS SSR', value: 'nextjs' },
        ]}
        groupId="Demos"
      >
        <TabItem value="todo">
          {/*Todo
              <a
                href="https://github.com/data-client/rest-hooks/tree/master/examples/todo-app"
                target="_blank"
                rel="noopener noreferrer"
                className="header-github-link"
                style={{ marginLeft: '1ex' }}
        ></a>*/}
          <iframe
            loading="lazy"
            src={`https://stackblitz.com/github/data-client/rest-hooks/tree/master/examples/todo-app?${searchParams(
              {
                embed: '1',
                file: [
                  'src/resources/TodoResource.ts,src/pages/Home/TodoList.tsx',
                ],
                hideDevTools: '1',
                hideNavigation: '1',
                terminalHeight: '1',
              },
            )}`}
            width="900"
            height="600"
            style={{ width: '100%', height: 'calc(100vh - 170px)' }}
          ></iframe>
        </TabItem>
        <TabItem value="github">
          {/*            <a
              href="https://github.com/data-client/rest-hooks/tree/master/examples/github-app"
              target="_blank"
              rel="noopener noreferrer"
              className="header-github-link"
              style={{ marginLeft: '1ex' }}
            ></a>*/}
          <iframe
            loading="lazy"
            src={`https://stackblitz.com/github/data-client/rest-hooks/tree/master/examples/github-app?${searchParams(
              {
                embed: '1',
                file: ['src/resources/Issue.tsx,src/pages/IssueList.tsx'],
                hideDevTools: '1',
                hideNavigation: '1',
                terminalHeight: '1',
              },
            )}`}
            width="900"
            height="700"
            style={{ width: '100%', height: 'calc(100vh - 170px)' }}
          ></iframe>
        </TabItem>
        <TabItem value="nextjs">
          {/*            <a
              href="https://github.com/data-client/rest-hooks/tree/master/examples/github-app"
              target="_blank"
              rel="noopener noreferrer"
              className="header-github-link"
              style={{ marginLeft: '1ex' }}
            ></a>*/}
          <iframe
            loading="lazy"
            src={`https://stackblitz.com/github/data-client/rest-hooks/tree/master/examples/nextjs?${searchParams(
              {
                embed: '1',
                file: ['resources/ExchangeRates.ts,pages/AssetPrice.tsx'],
                hideDevTools: '1',
                hideNavigation: '1',
                terminalHeight: '1',
              },
            )}`}
            width="900"
            height="700"
            style={{ width: '100%', height: 'calc(100vh - 170px)' }}
          ></iframe>
        </TabItem>
      </Tabs>
    </Layout>
  );
}
