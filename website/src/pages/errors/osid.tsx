import Link from '@docusaurus/Link';
import Translate, { translate } from '@docusaurus/Translate';
import Layout from '@theme/Layout';
import React from 'react';

export default function MangledFunctionnames() {
  return (
    <Layout
      title={`Reactive Data Client ${translate({
        id: 'errors.osid.title',
        message: 'Error: Mangled function names detected',
      })}`}
    >
      <header>
        <div className="container">
          <h2>
            <Translate id="errors.osid.title">
              Error: Mangled function names detected
            </Translate>
          </h2>
        </div>
      </header>
      <main>
        <div className="container">
          <p>
            <Translate
              id="errors.osid.custom"
              values={{
                link: (
                  <Link to="/rest/api/Endpoint#name">
                    <Translate id="errors.osid.customLink">
                      Endpoint name
                    </Translate>
                  </Link>
                ),
              }}
            >
              {'Either add a custom {link}'}
            </Translate>
          </p>

          <p>
            <Translate
              id="errors.mangle.or"
              values={{
                link: (
                  <a
                    href="https://terser.org/docs/api-reference#mangle-options"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Translate id="errors.osid.disable">
                      disable function name mangling
                    </Translate>
                  </a>
                ),
              }}
            >
              {'Or {link}'}
            </Translate>
          </p>
        </div>
      </main>
    </Layout>
  );
}
