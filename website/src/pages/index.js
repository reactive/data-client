import BrowserOnly from '@docusaurus/BrowserOnly';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import ThemedImage from '@theme/ThemedImage';
import clsx from 'clsx';
import React from 'react';

import styles from './index.module.css';
import Demo from '../components/Demo/index';
import { GithubStarsButton } from '../components/GithubStarsButton';
import HomepageFeatures from '../components/HomepageFeatures';
import { isGoogleBot } from '../components/Playground/isGoogleBot';
import StackBlitz from '../components/StackBlitz';

const ProjectTitle = () => {
  const sources = {
    light: useBaseUrl('img/client_logo_and_text--light.png'),
    dark: useBaseUrl('img/client_logo_and_text--dark.png'),
  };
  const { siteConfig } = useDocusaurusContext();

  return (
    <React.Fragment>
      <div className={styles.logoWrapper}>
        <ThemedImage
          sources={sources}
          alt="The Reactive Data Client"
          height={90}
          width={416}
        />
      </div>
      {/* 
      <h1 style={{ marginBottom: '0.0', fontWeight: '600' }}>
        {siteConfig.title}
      </h1>
      <p style={{ marginTop: '0.0', fontWeight: '500', fontSize: '18px' }}>
        Async State <strike>Management</strike> without the Management
      </p> */}
    </React.Fragment>
  );
};

function HomepageHeader() {
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <ProjectTitle />
        <div className={styles.buttons}>
          <GithubStarsButton />
          <Link
            className="button button--primary"
            to="/docs/getting-started/installation"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

function HomepageEnder() {
  return (
    <section className={'hero'}>
      <div className="container">
        <div className={styles.buttons}>
          <Link
            className="button button--primary"
            to="/docs/getting-started/installation"
          >
            Get Started{' '}
            <svg
              stroke="currentColor"
              fill="none"
              strokeWidth="3"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              height="20"
              width="20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Layout description="Async State Management without the Management.">
      <Head>
        <title>The Reactive Data Client ✨</title>
      </Head>
      <HomepageHeader />
      <main>
        <Demo />
        <HomepageFeatures />
        <div className="container">
          <div className="row">
            <div className="col">
              <StackBlitz
                app="github-app"
                width="100%"
                height="750"
                style={{ maxHeight: 'calc(100vh - 64px)', height: '800px' }}
                file="src/resources/Issue.tsx,src/pages/IssueList.tsx"
                view="both"
              />
            </div>
          </div>
        </div>
        <HomepageEnder />
      </main>
    </Layout>
  );
}
