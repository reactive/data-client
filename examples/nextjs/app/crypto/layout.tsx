import Link from 'next/link';

export default function CryptoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <meta
        name="description"
        content="Live BTC price using the Reactive Data Client"
      />

      {/* <h2 className={styles.subtitle}>
        Here we show the live price of BTC using Reactive Data Client
      </h2> */}

      {children}

      <p>
        The latest price is immediately available before any JavaScript runs;
        while automatically updating as prices change.
      </p>

      <p>
        <Link href="/">Todo List</Link> |{' '}
        <Link href="/crypto">Crypto List</Link>
      </p>
    </>
  );
}
