import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

import styles from './demos.module.css';
import { searchParams } from '../utils/searchParams';

interface Demo {
  value: string;
  label: string;
  /** Directory under examples/ */
  app: string;
  description: string;
  /** Files opened in the editor */
  files: string;
}

const demos: Demo[] = [
  {
    value: 'todo',
    label: 'Todo',
    app: 'todo-app',
    description:
      'React todo list on JSONPlaceholder with REST resources and optimistic updates.',
    files:
      'src/resources/TodoResource.ts,src/pages/Home/NewTodo.tsx,src/pages/Home/TodoListItem.tsx,src/pages/Home/TodoList.tsx',
  },
  {
    value: 'github',
    label: 'GitHub',
    app: 'github-app',
    description:
      'Issues and pull request browser on the live GitHub API, with pagination and nested entities.',
    files: 'src/resources/Issue.tsx,src/pages/IssueList.tsx',
  },
  {
    value: 'nextjs',
    label: 'NextJS SSR',
    app: 'nextjs',
    description:
      'Next.js App Router with server side rendering and client hydration of the normalized store.',
    files: 'resources/TodoResource.ts,components/todo/TodoList.tsx',
  },
  {
    value: 'coin-app',
    label: 'Live Coin Prices',
    app: 'coin-app',
    description:
      'Crypto prices streamed over WebSocket with a custom Manager, plus Queries that compute derived values.',
    files:
      'src/resources/StreamManager.ts,src/resources/Ticker.ts,src/resources/fallbackQueries.ts,src/pages/Home/AssetPrice.tsx',
  },
  {
    value: 'vue-todo-app',
    label: 'Vue Todo',
    app: 'vue-todo-app',
    description:
      'The todo app in Vue 3 with @data-client/vue composables and Vue Router.',
    files:
      'src/resources/TodoResource.ts,src/resources/UserResource.ts,src/pages/UserTodos.vue,src/pages/UserList.vue',
  },
];

const repoPath = 'reactive/data-client/tree/master/examples';

function DemoPanel({ app, description, files }: Demo) {
  const projectUrl = `https://stackblitz.com/github/${repoPath}/${app}`;
  return (
    <>
      <div className={styles.caption}>
        <p>{description}</p>
        <div className={styles.links}>
          <Link
            className="button button--sm button--secondary"
            to={`${projectUrl}?${searchParams({ file: files })}`}
          >
            Open in StackBlitz
          </Link>
          <Link
            className="button button--sm button--secondary"
            to={`https://github.com/${repoPath}/${app}`}
          >
            Source on GitHub
          </Link>
        </div>
      </div>
      <iframe
        loading="lazy"
        title={`${app} demo`}
        className={styles.frame}
        src={`${projectUrl}?${searchParams({
          embed: '1',
          file: files,
          hideDevTools: '1',
          hideNavigation: '1',
          terminalHeight: '0',
        })}`}
        width="900"
        height="700"
      ></iframe>
    </>
  );
}

export default function DemoList() {
  return (
    <Layout
      title="React Suspense Demos"
      description="Examples demonstrating high performance scalable applications using REST, GraphQL and Websockets"
    >
      <header className={styles.header}>
        <h1>Demos</h1>
        <p>
          Complete example apps from the{' '}
          <Link to={`https://github.com/${repoPath}`}>examples directory</Link>,
          running live in StackBlitz.
        </p>
      </header>
      <Tabs
        defaultValue="todo"
        values={demos.map(({ value, label }) => ({ value, label }))}
        groupId="Demos"
        className={styles.tabs}
      >
        {demos.map(demo => (
          <TabItem value={demo.value} key={demo.value}>
            <DemoPanel {...demo} />
          </TabItem>
        ))}
      </Tabs>
    </Layout>
  );
}
