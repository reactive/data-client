import { AsyncBoundary } from '@data-client/react';
import { DataProvider } from '@data-client/react/nextjs';
import Image from 'next/image';

import '@/styles/globals.css';
import styles from '@/styles/Home.module.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <DataProvider>
          <h1 className={styles.title}>
            Welcome to{' '}
            <a href="https://nextjs.org" target="_blank" rel="noreferrer">
              Next.js
            </a>{' '}
            with{' '}
            <a href="https://dataclient.io" target="_blank" rel="noreferrer">
              Reactive Data Client
            </a>
            !
          </h1>
          <div>
            <main className={styles.main}>
              <AsyncBoundary>{children}</AsyncBoundary>
            </main>

            <footer className={styles.footer}>
              <a
                href="https://dataclient.io?utm_source=demos&utm_medium=default-template&utm_campaign=demos"
                target="_blank"
                rel="noopener noreferrer"
              >
                Powered by{' '}
                <span className={styles.logo}>
                  <Image
                    src="/data_client.svg"
                    alt="Reactive Data Client Logo"
                    width={72 * 2}
                    height={32}
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
