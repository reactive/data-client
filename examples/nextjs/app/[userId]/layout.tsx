import { AsyncBoundary } from '@data-client/react';
import Link from 'next/link';

import UserSelection from '@/components/todo/UserSelection';

export default async function TodoLayout(props: {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}) {
  const params = await props.params;
  const { children } = props;

  return (
    <>
      <title>NextJS + Reactive Data Client = ❤️</title>
      <meta
        name="description"
        content="NextJS integration with Reactive Data Client"
      />

      <AsyncBoundary>
        <UserSelection userId={Number(params.userId)} />
      </AsyncBoundary>

      <AsyncBoundary>{children}</AsyncBoundary>

      <p>
        No fetch requests took place on the client. The client is immediately
        interactive without the need for revalidation.
      </p>

      <p>
        This is because Reactive Data Client&apos;s store is initialized and{' '}
        <a
          href="https://dataclient.io/docs/concepts/normalization?utm_source=demos&utm_medium=default-template&utm_campaign=demos"
          target="_blank"
          rel="noreferrer"
        >
          normalized
        </a>
      </p>

      <p>
        <Link href="/crypto">Live BTC Price</Link>
      </p>
    </>
  );
}
