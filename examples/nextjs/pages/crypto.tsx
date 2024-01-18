import { AsyncBoundary } from '@data-client/react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import AssetPrice from '../components/AssetPrice';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Live Crypto Prices with Reactive Data Client</title>
        <meta name="description" content="Live BTC price using the Reactive Data Client" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a> with{' '}
          <a href="https://dataclient.io">Reactive Data Client</a>
        </h1>

        <h2 className={styles.subtitle}>
          Here we show the live price of BTC using Reactive Data Client
        </h2>

        <p className={styles.price}>
          <AsyncBoundary>
            <AssetPrice symbol="BTC" />
          </AsyncBoundary>
        </p>

        <p>
          The latest price is immediately available before any JavaScript runs;
          while automatically updating as prices change.
        </p>

        <p><Link href="/">Todo List</Link></p>
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
