import React from 'react';
import clsx from 'clsx';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Link from '@docusaurus/Link';

import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    description: (
      <>
        Strong <b>inferred</b> types; single source of truth that is
        referentially stable ensures consistency; <b>asynchronous invariants</b>{' '}
        make it easy to avoid race conditions
      </>
    ),
    light: '/img/typescript.svg',
    dark: '/img/typescript.dark.svg',
    title: 'Data Integrity',
  },
  {
    description: (
      <>
        Normalized cache means data is often <b>ready before</b> it is even
        needed. Automatic <b>request deduplication</b> means less data to send
        over the network.
      </>
    ),
    Svg: require(`../../static/img/fast-car.svg`).default,
    title: 'Performance',
  },
  {
    description: (
      <>
        <b>Declare</b> what you need <b>where</b> you need it. <b>Share</b> data
        definitions <b>across platforms</b>, components,{' '}
        <Link to="/docs#protocol-specific-patterns">protocols</Link>, and
        behaviors.
      </>
    ),
    Svg: require(`../../static/img/chemical-composition.svg`).default,
    title: 'Composition over configuration',
  },
  {
    description: (
      <>
        Get started fast with <b>one line</b>{' '}
        <Link to="/docs#endpoint">data definition</Link> and one line{' '}
        <Link to="/docs#co-locate-data-dependencies">data binding</Link>. Then{' '}
        <b>add</b> TypeScript, normalized cache with{' '}
        <Link to="/docs#entities">Schemas</Link>,{' '}
        <Link to="/docs#optimistic-updates">optimistic updates</Link> and more.
      </>
    ),
    Svg: require(`../../static/img/growing-bar-chart.svg`).default,
    title: 'Incremental Adoption',
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
