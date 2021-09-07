import React from 'react';
import clsx from 'clsx';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import EndpointDemo from './EndpointDemo';
import ResourceDemo from './ResourceDemo';
import GraphQLDemo from './GraphQLDemo';

const Demo = props => (
  <div className="container">
    <div className={clsx('row')}>
      <div className="col col--2"></div>
      <div className="col col--8">
        <Tabs
          defaultValue="fetch"
          groupId="protocol"
          values={[
            { label: 'Fetch', value: 'fetch' },
            { label: 'REST', value: 'rest' },
            { label: 'GraphQL', value: 'graphql' },
          ]}
        >
          <TabItem value="fetch">
            <EndpointDemo />
          </TabItem>
          <TabItem value="rest">
            <ResourceDemo />
          </TabItem>
          <TabItem value="graphql">
            <GraphQLDemo />
          </TabItem>
        </Tabs>
      </div>
      <div className="col col--2"></div>
    </div>
  </div>
);
export default Demo;
