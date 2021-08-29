import React from 'react';
import clsx from 'clsx';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';

import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    description: (
      <>
        Rest hooks&apos; TypeScript definitions will infer <b>specific</b> and{' '}
        <b>accurate</b> types based on your definition of the data. Predictable
        results means <b>no surprises</b> at runtime.
      </>
    ),
    light: '/img/typescript.svg',
    dark: '/img/typescript.dark.svg',
    title: 'Strongly Typed',
  },
  {
    description: (
      <>
        Normalized cache means data is often <b>ready before</b> it is even
        needed. Automatic <b>request deduplication</b> means less data to send
        over the network.
      </>
    ),
    Svg: require(`../../static/img/space-shuttle-solid.svg`).default,
    title: 'Fast',
  },
  {
    description: (
      <>
        <b>Declare</b> what you need <b>where</b> you need it, while maintaining
        optimal efficiency. Say goodbye to unnecessary tight couplings.
      </>
    ),
    Svg: require(`../../static/img/dice-d6-solid.svg`).default,
    title: 'Simple',
  },
  {
    description: (
      <>
        Rest hooks is <b>protocol agnostic</b>. REST out of the box, with
        GraphQL, GRPC, and websockets all possible.
      </>
    ),
    Svg: require(`../../static/img/spa-solid.svg`).default,
    title: 'Flexible',
  },
];

function Feature({ Svg, light, dark, title, description }) {
  const sources = {
    light: useBaseUrl(light),
    dark: useBaseUrl(dark),
  };
  return (
    <div className={clsx('col col--3')}>
      <div className="text--center">
        {Svg ? (
          <Svg className={styles.featureSvg} alt={title} />
        ) : (
          <ThemedImage
            className={styles.featureSvg}
            alt={title}
            sources={sources}
          />
        )}
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
