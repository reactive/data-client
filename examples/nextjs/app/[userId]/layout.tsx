import Link from 'next/link';
import UserSelection from '../../components/todo/UserSelection';

export default function TodoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params?: { userId: number };
}) {
  return (
    <>
      <title>NextJS + Reactive Data Client = ❤️</title>
      <meta
        name="description"
        content="NextJS integration with Reactive Data Client"
      />

      <UserSelection userId={params?.userId} />

      {children}

      <p>
        No fetch requests took place on the client. The client is immediately
        interactive without the need for revalidation.
      </p>

      <p>
        This is because Reactive Data Client's store is initialized and{' '}
        <a href="https://dataclient.io/docs/concepts/normalization">
          normalized
        </a>
      </p>

      <p>
        <Link href="/crypto">Live BTC Price</Link>
      </p>
    </>
  );
}
