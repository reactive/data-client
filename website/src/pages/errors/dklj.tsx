import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

export default function MangledClassnames() {
  return (
    <Layout title="Reactive Data Client Error: Mangled class names detected">
      <header>
        <div className="container">
          <h2>Error: Mangled class names detected</h2>
        </div>
      </header>
      <main>
        <div className="container">
          <p>
            Either add a custom{' '}
            <Link to="/rest/api/Entity#key">Entity key</Link>
          </p>

          <p>
            Or{' '}
            <a
              href="https://terser.org/docs/api-reference#mangle-options"
              target="_blank"
              rel="noreferrer"
            >
              disable class name mangling
            </a>
          </p>
        </div>
      </main>
    </Layout>
  );
}
