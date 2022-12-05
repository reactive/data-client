import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import ThemedImage from '@theme/ThemedImage';
import clsx from 'clsx';
import React from 'react';

import Demo from '../components/Demo/index';
import HomepageFeatures from '../components/HomepageFeatures';
import styles from './index.module.css';

const ProjectTitle = () => {
  const sources = {
    light: useBaseUrl('img/rest_hooks_logo_and_text_subtitle--light.svg'),
    dark: useBaseUrl('img/rest_hooks_logo_and_text_subtitle--dark.svg'),
  };
  return (
    <React.Fragment>
      <div className={styles.logoWrapper}>
        <ThemedImage
          sources={sources}
          alt="Rest Hooks - The Object Protocol Mapper for React"
          height={90}
          width={416}
        />
      </div>

      {/*<h2 style={{ marginTop: '0.0', fontWeight: '500' }}>
        {siteConfig.tagline}
      </h2>*/}
    </React.Fragment>
  );
};

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
          <span className={styles.GitHubButtonWrapper}>
            <iframe
              className={styles.GitHubButton}
              src="https://ghbtns.com/github-btn.html?user=coinbase&amp;repo=rest-hooks&amp;type=star&amp;count=true&amp;size=large"
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

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`The Relational Data Client (for React)`}
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
