import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import styles from './index.module.css';
import HomepageFeatures from '../components/HomepageFeatures';
import Demo from '../components/Demo';

const ProjectTitle = () => (
  <React.Fragment>
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '30px',
      }}
    >
      <img
        src={'img/rest_hooks_logo_and_text_subtitle.svg'}
        alt="Rest Hooks - Delightful Data Fetching"
        height={140}
      />
    </div>

    {/*<h2 style={{ marginTop: '0.0', fontWeight: '500' }}>{siteConfig.tagline}</h2>*/}
  </React.Fragment>
);

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <ProjectTitle />
        <div className={styles.buttons}>
          <Link
            className="button button--primary "
            to="/docs/getting-started/installation"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Asynchronous Data for React`}
      description="Making dynamic sites performant, scalable, simple to build with any API design. ...all typed ...fast ...and consistent"
    >
      <HomepageHeader />
      <main>
        <Demo />
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
