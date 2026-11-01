import Client from './Client';

// the pages fetch, so render them per request instead of at build time
export const dynamic = 'force-dynamic';

export default function Page() {
  return <Client />;
}
