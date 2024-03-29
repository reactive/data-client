import { AsyncBoundary } from '@data-client/react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import styles from '../styles/Home.module.css';
import TodoList from '../components/todo/TodoList';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>NextJS + Reactive Data Client = ❤️</title>
        <meta name="description" content="NextJS integration with Reactive Data Client" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a> with{' '}
          <a href="https://dataclient.io">Reactive Data Client</a>
        </h1>

        <AsyncBoundary>
          <TodoList userId={1} />
        </AsyncBoundary>

        <p>
          No fetch requests took place on the client. The client is immediately interactive
          without the need for revalidation.
        </p>

        <p>
          This is because Reactive Data Client's store is initialized and <a href="https://dataclient.io/docs/concepts/normalization">normalized</a>
        </p>

        <p><Link href="/crypto">Live BTC Price</Link></p>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  );
}
