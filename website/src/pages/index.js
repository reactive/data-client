import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import ThemedImage from '@theme/ThemedImage';
import clsx from 'clsx';
import React from 'react';

import styles from './index.module.css';
import Demo from '../components/Demo/index';
import HomepageFeatures from '../components/HomepageFeatures';
import StackBlitz from '../components/StackBlitz';

const ProjectTitle = () => {
  const sources = {
    light: useBaseUrl('img/rest_hooks_logo_and_text_subtitle--light.svg'),
    dark: useBaseUrl('img/rest_hooks_logo_and_text_subtitle--dark.svg'),
  };
  const { siteConfig } = useDocusaurusContext();

  return (
    <React.Fragment>
      {/* <div className={styles.logoWrapper}>
        <ThemedImage
          sources={sources}
          alt="Reactive Data Client - The Relational Data Client for React"
          height={90}
          width={416}
        />
      </div> */}

      <h1 style={{ marginBottom: '0.0', fontWeight: '600' }}>
        {siteConfig.title}
      </h1>
      <p style={{ marginTop: '0.0', fontWeight: '500', fontSize: '18px' }}>
        Async State <strike>Management</strike> without the Management
      </p>
    </React.Fragment>
  );
};

function HomepageHeader() {
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <ProjectTitle />
        <div className={styles.buttons}>
          <Link
            className="button button--primary"
            to="/docs/getting-started/installation"
          >
            Get Started
          </Link>

          <span className={styles.GitHubButtonWrapper}>
            <iframe
              className={styles.GitHubButton}
              src="https://ghbtns.com/github-btn.html?user=reactive&amp;repo=data-client&amp;type=star&amp;count=true&amp;size=large"
              width={160}
              height={30}
              title="GitHub Stars"
            />
          </span>
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
    <Layout
      title={`The Reactive Data Client`}
      description="Async State Management without the Management."
    >
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
