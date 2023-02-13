import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import React from 'react';

export default function MangledFunctionnames() {
  return (
    <Layout title="Rest Hooks Error: Mangled function names detected">
      <header>
        <div className="container">
          <h2>Error: Mangled function names detected</h2>
        </div>
      </header>
      <main>
        <div className="container">
          <p>
            Either add a custom{' '}
            <Link to="/rest/api/Endpoint#name">Endpoint name</Link>
          </p>

          <p>
            Or{' '}
            <a
              href="https://terser.org/docs/api-reference#mangle-options"
              target="_blank"
              rel="noreferrer"
            >
              disable function name mangling
            </a>
          </p>
        </div>
      </main>
    </Layout>
  );
}
