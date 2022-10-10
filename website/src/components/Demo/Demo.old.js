import React from 'react';
import clsx from 'clsx';

import styles from './Demo.module.css';

const Demo = props => (
  <div className="container">
    <div className={clsx('row', styles.gridImageBlock)}>
      <a
        className={clsx('blockElement', styles.blockImageFull)}
        href="https://jsonplaceholder.typicode.com/comments/1"
        target="_blank"
        rel="noreferrer noopener"
      >
        <img src={require(`../../static/img/json.png`).default} />
      </a>
      <a
        className={clsx('blockElement', styles.blockImageFull)}
        href="/docs/rest#define-a-resource"
      >
        <img src={require(`../../static/img/resource.png`).default} />
      </a>
      <a
        className={clsx('blockElement', styles.blockImageFull)}
        href="/docs/rest#use-the-resource"
      >
        <video
          autoPlay
          loop
          muted
          preload="auto"
          style={{ maxWidth: '437px', width: '100%' }}
          poster={require(`../../static/img/component.png`).default}
        >
          <source
            src={require(`../../static/img/code.mp4`).default}
            type="video/mp4"
          />
          <source
            src={require(`../../static/img/code.webm`).default}
            type="video/webm"
          />
          <img src={require(`../../static/img/component.png`).default} />
        </video>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.onload = function() {document.querySelector('video').play()}",
          }}
        ></script>
      </a>
    </div>
  </div>
);
export default Demo;
