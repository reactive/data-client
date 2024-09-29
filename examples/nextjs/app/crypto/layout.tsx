import Link from 'next/link';

import styles from '@/styles/Home.module.css';

export default function CryptoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <h2 className={styles.subtitle}>
        Here we show the live price of BTC using Reactive Data Client
      </h2>

      {children}

      <p>
        The latest price is immediately available before any JavaScript runs;
        while automatically updating as prices change.
      </p>

      <p>
        <Link href="/">Todo List</Link>
      </p>
    </>
  );
}
