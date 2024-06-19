import { AsyncBoundary } from '@data-client/react';
import { DataProvider } from '@data-client/react/nextjs';
import Image from 'next/image';

import styles from 'styles/Home.module.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <DataProvider>
          <h1 className={styles.title}>
            Welcome to <a href="https://nextjs.org">Next.js!</a> with{' '}
            <a href="https://dataclient.io">Reactive Data Client</a>
          </h1>
          <div className={styles.container}>
            <main className={styles.main}>
              <AsyncBoundary>{children}</AsyncBoundary>
            </main>

            <footer className={styles.footer}>
              <a
                href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Powered by{' '}
                <span className={styles.logo}>
                  <Image
                    src="/vercel.svg"
                    alt="Vercel Logo"
                    width={72}
                    height={16}
                  />
                </span>
              </a>
            </footer>
          </div>
        </DataProvider>
      </body>
    </html>
  );
}
