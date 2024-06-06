'use client';
import Link from 'next/link';

import AssetPrice from '../../components/AssetPrice';
import styles from '../../styles/Home.module.css';

export default function Crypto() {
  return (
    <>
      <title>Live Crypto Prices with Reactive Data Client</title>
      <meta
        name="description"
        content="Live BTC price using the Reactive Data Client"
      />

      <h2 className={styles.subtitle}>
        Here we show the live price of BTC using Reactive Data Client
      </h2>

      <p className={styles.price}>
        <AssetPrice symbol="BTC" />
      </p>

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
