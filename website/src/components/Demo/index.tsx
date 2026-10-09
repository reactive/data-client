import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import clsx from 'clsx';
import React from 'react';

import liveDemo from './code/live-app';
import mutationDemo from './code/profile-edit';
import appDemo from './code/todo-app';
import CodeEditor from './CodeEditor';
import styles from './styles.module.css';

export default function Demo() {
  return (
    <div className="container">
      <div className={clsx('row', styles.demoList)}>
        <div className="col col--3">
          <h2>
            <Translate id="homepage.demo.mutations.title">
              Reactive Mutations
            </Translate>
          </h2>
          <div>
            <p>
              <Translate
                id="homepage.demo.mutations.render"
                values={{
                  useSuspense: (
                    <Link to="/docs/api/useSuspense">useSuspense()</Link>
                  ),
                  fetch: (
                    <Link to="/docs/api/Controller#fetch">
                      Controller.fetch()
                    </Link>
                  ),
                }}
              >
                {'Render data with {useSuspense}. Then mutate with {fetch}.'}
              </Translate>
            </p>
            <p>
              <Translate
                id="homepage.demo.mutations.atomic"
                values={{
                  all: (
                    <strong>
                      <Translate id="homepage.demo.mutations.all">
                        all
                      </Translate>
                    </strong>
                  ),
                  atomically: (
                    <Link to="/docs/concepts/atomic-mutations">
                      <Translate
                        id="homepage.demo.mutations.atomicallyImmediately"
                        values={{
                          atomically: (
                            <em>
                              <Translate id="homepage.demo.mutations.atomically">
                                atomically
                              </Translate>
                            </em>
                          ),
                          immediately: (
                            <em>
                              <Translate id="homepage.demo.mutations.immediately">
                                immediately
                              </Translate>
                            </em>
                          ),
                        }}
                      >
                        {'{atomically} and {immediately}'}
                      </Translate>
                    </Link>
                  ),
                  consistency: (
                    <Link to="/docs/concepts/normalization">
                      <Translate id="homepage.demo.mutations.consistency">
                        data consistency and integrity globally
                      </Translate>
                    </Link>
                  ),
                  raceConditions: (
                    <Link to="/docs/getting-started/mutations#optimistic-updates">
                      <s>
                        <Translate id="homepage.demo.mutations.raceConditions">
                          race conditions
                        </Translate>
                      </s>
                    </Link>
                  ),
                }}
              >
                {
                  'This updates {all} usages {atomically} with zero additional fetches. Reactive Data Client automatically ensures {consistency} including even the most challenging {raceConditions}.'
                }
              </Translate>
            </p>
          </div>
        </div>
        <div className="col col--9">
          <CodeEditor codes={mutationDemo} defaultValue="rest" />
        </div>
      </div>
      <div className={clsx('row', styles.demoList)}>
        <div className="col col--3">
          <h2>
            <Translate id="homepage.demo.structured.title">
              Structured data
            </Translate>
          </h2>
          <div>
            <p>
              <Translate id="homepage.demo.structured.scale">
                {
                  'Data consistency, performance, and typesafety scale even as your data becomes more complex.'
                }
              </Translate>
            </p>
            <p>
              <Translate
                id="homepage.demo.structured.lists"
                values={{
                  creates: (
                    <Link to="/docs/getting-started/mutations">
                      <Translate id="homepage.demo.structured.creates">
                        Creates and deletes
                      </Translate>
                    </Link>
                  ),
                  lists: (
                    <Link to="/rest/api/Collection#nonFilterArgumentKeys">
                      <Translate id="homepage.demo.structured.correctLists">
                        correct lists
                      </Translate>
                    </Link>
                  ),
                  nested: (
                    <Link to="/rest/api/Collection">
                      <Translate id="homepage.demo.structured.nested">
                        nested inside other objects
                      </Translate>
                    </Link>
                  ),
                }}
              >
                {
                  '{creates} reactively update the {lists}, even when those lists are {nested}.'
                }
              </Translate>
            </p>
            <p>
              <Translate
                id="homepage.demo.structured.model"
                values={{
                  polymorphic: (
                    <Link to="/rest/api/Union">
                      <Translate id="homepage.demo.structured.polymorphic">
                        polymorphic
                      </Translate>
                    </Link>
                  ),
                  maps: (
                    <Link to="/rest/api/Values">
                      <Translate id="homepage.demo.structured.maps">
                        unbounded object/maps
                      </Translate>
                    </Link>
                  ),
                }}
              >
                {
                  'Model even the most complex data with {polymorphic} and {maps} support.'
                }
              </Translate>
            </p>
          </div>
        </div>
        <div className="col col--9">
          <CodeEditor codes={appDemo} defaultValue="rest" />
        </div>
      </div>
      <div className={clsx('row', styles.demoList)}>
        <div className="col col--3">
          <h2>
            <Translate id="homepage.demo.live.title">Live updates</Translate>
          </h2>
          <div>
            <p>
              <Translate
                id="homepage.demo.live.sync"
                values={{
                  useLive: <Link to="/docs/api/useLive">useLive()</Link>,
                }}
              >
                {'Keep remote changes in sync with {useLive}.'}
              </Translate>
            </p>
            <p>
              <Translate
                id="homepage.demo.live.protocols"
                values={{
                  polling: (
                    <Link to="/docs/api/PollingSubscription">
                      <Translate id="homepage.demo.live.polling">
                        Polling
                      </Translate>
                    </Link>
                  ),
                  streams: (
                    <Link to="/docs/concepts/managers#data-stream">
                      <Translate id="homepage.demo.live.streams">
                        SSE and Websocket
                      </Translate>
                    </Link>
                  ),
                  middlewares: (
                    <Link to="/docs/concepts/managers">
                      <Translate id="homepage.demo.live.middlewares">
                        middlewares
                      </Translate>
                    </Link>
                  ),
                }}
              >
                {
                  '{polling}, {streams} or support a custom protocol with {middlewares}'
                }
              </Translate>
            </p>
          </div>
        </div>
        <div className="col col--9">
          <CodeEditor codes={liveDemo} defaultValue="polling" />
        </div>
      </div>
    </div>
  );
}
