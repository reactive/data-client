import Link from '@docusaurus/Link';
import Translate, { translate } from '@docusaurus/Translate';
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
      <Translate
        id="homepage.features.integrity.description"
        values={{
          inferred: (
            <b>
              <Translate id="homepage.features.integrity.inferred">
                inferred
              </Translate>
            </b>
          ),
          invariants: (
            <b>
              <Translate id="homepage.features.integrity.invariants">
                asynchronous invariants
              </Translate>
            </b>
          ),
        }}
      >
        {
          'Strong {inferred} types; single source of truth that is referentially stable ensures consistency; {invariants} make it easy to avoid race conditions'
        }
      </Translate>
    ),
    Svg: TypeScriptSvg,
    title: translate({
      id: 'homepage.features.integrity.title',
      message: 'Data Integrity',
    }),
  },
  {
    description: (
      <Translate
        id="homepage.features.performance.description"
        values={{
          navigation: (
            <Link to="/docs/concepts/performance">
              <Translate id="homepage.features.performance.navigation">
                24x faster
              </Translate>
            </Link>
          ),
          mutations: (
            <Link to="/docs/concepts/performance">
              <Translate id="homepage.features.performance.mutations">
                Mutations 92x
              </Translate>
            </Link>
          ),
        }}
      >
        {
          'Navigation {navigation} than React baseline, 10x faster than TanStack Query and SWR. {mutations} faster than TanStack Query, SWR and React baseline.'
        }
      </Translate>
    ),
    Svg: FastCarSvg,
    title: translate({
      id: 'homepage.features.performance.title',
      message: 'Performance',
    }),
  },
  {
    description: (
      <Translate
        id="homepage.features.composition.description"
        values={{
          declare: (
            <b>
              <Translate id="homepage.features.composition.declare">
                Declare
              </Translate>
            </b>
          ),
          where: (
            <b>
              <Translate id="homepage.features.composition.where">
                where
              </Translate>
            </b>
          ),
          share: (
            <b>
              <Translate id="homepage.features.composition.share">
                Share
              </Translate>
            </b>
          ),
          platforms: (
            <b>
              <Translate id="homepage.features.composition.platforms">
                across platforms
              </Translate>
            </b>
          ),
          protocols: (
            <Link to="/docs#endpoint">
              <Translate id="homepage.features.composition.protocols">
                protocols
              </Translate>
            </Link>
          ),
        }}
      >
        {
          '{declare} what you need {where} you need it. {share} data definitions {platforms}, components, {protocols}, and behaviors.'
        }
      </Translate>
    ),
    Svg: ChemicalCompositionSvg,
    title: translate({
      id: 'homepage.features.composition.title',
      message: 'Composition over configuration',
    }),
  },
  {
    description: (
      <Translate
        id="homepage.features.adoption.description"
        values={{
          oneLine: (
            <b>
              <Translate id="homepage.features.adoption.oneLine">
                one line
              </Translate>
            </b>
          ),
          definition: (
            <Link to="/docs#endpoint">
              <Translate id="homepage.features.adoption.definition">
                data definition
              </Translate>
            </Link>
          ),
          binding: (
            <Link to="/docs#co-locate-data-dependencies">
              <Translate id="homepage.features.adoption.binding">
                data binding
              </Translate>
            </Link>
          ),
          add: (
            <b>
              <Translate id="homepage.features.adoption.add">add</Translate>
            </b>
          ),
          // eslint-disable-next-line @docusaurus/no-untranslated-text -- API name
          schemas: <Link to="/docs#entities">Schemas</Link>,
          optimistic: (
            <Link to="/docs#optimistic-updates">
              <Translate id="homepage.features.adoption.optimistic">
                optimistic updates
              </Translate>
            </Link>
          ),
        }}
      >
        {
          'Get started fast with {oneLine} {definition} and one line {binding}. Then {add} TypeScript, normalized cache with {schemas}, {optimistic} and more.'
        }
      </Translate>
    ),
    Svg: GrowingBarChartSvg,
    title: translate({
      id: 'homepage.features.adoption.title',
      message: 'Incremental Adoption',
    }),
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
        <div className="row">
          {featureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
