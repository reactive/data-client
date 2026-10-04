import Link from '@docusaurus/Link';
import clsx from 'clsx';
import React from 'react';

import styles from './HomepageFeatures.module.css';
import ChemicalCompositionSvg from '../../static/img/chemical-composition.svg';
import FastCarSvg from '../../static/img/fast-car.svg';
import GrowingBarChartSvg from '../../static/img/growing-bar-chart.svg';
import TypeScriptSvg from '../../static/img/typescript-mono.svg';

interface FeatureItem {
  description: React.ReactNode;
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
}

const featureList: FeatureItem[] = [
  {
    description: (
      <>
        Strong <b>inferred</b> types; single source of truth that is
        referentially stable ensures consistency; <b>asynchronous invariants</b>{' '}
        make it easy to avoid race conditions
      </>
    ),
    Svg: TypeScriptSvg,
    title: 'Data Integrity',
  },
  {
    description: (
      <>
        Navigation <Link to="/docs/concepts/performance">24x faster</Link> than
        TanStack Query, SWR and React baseline.{' '}
        <Link to="/docs/concepts/performance">Mutations 92x</Link> faster than
        TanStack Query, SWR and React baseline.
      </>
    ),
    Svg: FastCarSvg,
    title: 'Performance',
  },
  {
    description: (
      <>
        <b>Declare</b> what you need <b>where</b> you need it. <b>Share</b> data
        definitions <b>across platforms</b>, components,{' '}
        <Link to="/docs#endpoint">protocols</Link>, and behaviors.
      </>
    ),
    Svg: ChemicalCompositionSvg,
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
    Svg: GrowingBarChartSvg,
    title: 'Incremental Adoption',
  },
];

function Feature({ title, description, Svg }: FeatureItem) {
  return (
    <div className={clsx('col col--3', styles.feature)}>
      <Svg className={styles.featureSvg} role="img" aria-label={title} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <h2 className="text--center margin-bottom--lg">Why Data Client</h2>
        <div className="row">
          {featureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
