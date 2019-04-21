/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');

const MarkdownBlock = CompLibrary.MarkdownBlock; /* Used to read markdown */
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

class HomeSplash extends React.Component {
  render() {
    const { siteConfig, language = '' } = this.props;
    const { baseUrl, docsUrl } = siteConfig;
    const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
    const langPart = `${language ? `${language}/` : ''}`;
    const docUrl = doc => `${baseUrl}${docsPart}${langPart}${doc}`;

    const SplashContainer = props => (
      <div className="homeContainer">
        <div className="homeSplashFade">
          <div className="wrapper homeWrapper">{props.children}</div>
        </div>
      </div>
    );

    const Logo = props => (
      <div className="projectLogo">
        <img src={props.img_src} alt="Project Logo" />
      </div>
    );

    const ProjectTitle = () => (
      <React.Fragment>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/*<img src={"img/rest-hooks.svg"} alt="Rest Hooks logo" width={100} height={100}/>*/}
          <h1 className="projectTitle">{siteConfig.title}</h1>
        </div>

        <h2 style={{ marginTop: '0.0', fontWeight: '500' }}>{siteConfig.tagline}</h2>
      </React.Fragment>
    );

    const PromoSection = props => (
      <div className="section promoSection">
        <div className="promoRow">
          <div className="pluginRowBlock">{props.children}</div>
        </div>
      </div>
    );

    const Button = props => (
      <div className="pluginWrapper buttonWrapper">
        <a className="button hero" href={props.href} target={props.target}>
          {props.children}
        </a>
      </div>
    );

    return (
      <SplashContainer>
        {/*<Logo img_src={`${baseUrl}img/docusaurus.svg`} />*/}
        <div className="inner">
          <ProjectTitle siteConfig={siteConfig} />
          <PromoSection>
            <Button href={docUrl('getting-started/installation')}>
              Get Started
            </Button>
          </PromoSection>
        </div>
      </SplashContainer>
    );
  }
}

class Index extends React.Component {
  render() {
    const { config: siteConfig, language = '' } = this.props;
    const { baseUrl } = siteConfig;
    const imgUrl = img => `${baseUrl}img/${img}`;

    const Block = props => (
      <Container
        padding={['bottom', 'top']}
        id={props.id}
        background={props.background}
      >
        <GridBlock
          align="center"
          contents={props.children}
          layout={props.layout}
        />
      </Container>
    );

    const Features = props => (
      <Block layout="fourColumn" background="light">
        {[
          {
            content: "Rest hooks' TypeScript definitions will infer **specific** and **accurate** types based on your definition of the data. Predictable results means **no surprises** at runtime.",
            //image: imgUrl('icon/time.png'),
            image : imgUrl("typescript.svg"),
            imageAlign: 'top',
            title: "Strongly Typed"
          },
          {
            content: "Normalized cache means data is often **ready before** it is even needed. Automatic **request deduplication** means less data to send over the network.",
            image: imgUrl('space-shuttle-solid.svg'),
            imageAlign: 'top',
            title: "Fast"
          },
          {
            content: `**Declare** what you need **where** you need it, while maintaining optimal efficiency. Say goodbye to unnecessary tight couplings.`,
            image: imgUrl('dice-d6-solid.svg'),
            imageAlign: 'top',
            title: "Simple"
          },
          {
            content: "Rest hooks is **protocol agnostic**. REST out of the box, with GraphQL, GRPC, and websockets all possible.",
            image: imgUrl('spa-solid.svg'),
            imageAlign: 'top',
            title: "Flexible"
          },
        ]}
      </Block>
    );

    const Showcase = () => {
      if ((siteConfig.users || []).length === 0) {
        return null;
      }

      const showcase = siteConfig.users
        .filter(user => user.pinned)
        .map(user => (
          <a href={user.infoLink} key={user.infoLink}>
            <img src={user.image} alt={user.caption} title={user.caption} />
          </a>
        ));

      const pageUrl = page => baseUrl + (language ? `${language}/` : '') + page;

      return (
        <div className="productShowcaseSection paddingBottom">
          <h2>Who is Using This?</h2>
          <p>This project is used by all these people</p>
          <div className="logos">{showcase}</div>
          <div className="more-users">
            <a className="button" href={pageUrl('users.html')}>
              More {siteConfig.title} Users
            </a>
          </div>
        </div>
      );
    };

    return (
      <div>
        <HomeSplash siteConfig={siteConfig} language={language} />
        <div className="mainContainer">
          <Features />
          <Showcase />
        </div>
      </div>
    );
  }
}

module.exports = Index;
