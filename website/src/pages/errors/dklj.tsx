import Link from '@docusaurus/Link';
import Translate, { translate } from '@docusaurus/Translate';
import Layout from '@theme/Layout';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

export default function MangledClassnames() {
  return (
    <Layout
      title={`Reactive Data Client ${translate({
        id: 'errors.dklj.title',
        message: 'Error: Mangled class names detected',
      })}`}
    >
      <header>
        <div className="container">
          <h2>
            <Translate id="errors.dklj.title">
              Error: Mangled class names detected
            </Translate>
          </h2>
        </div>
      </header>
      <main>
        <div className="container">
          <p>
            <Translate
              id="errors.dklj.custom"
              values={{
                link: (
                  <Link to="/rest/api/Entity#key">
                    <Translate id="errors.dklj.customLink">
                      Entity key
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
                    <Translate id="errors.dklj.disable">
                      disable class name mangling
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
