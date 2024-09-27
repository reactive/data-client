import Link from '@docusaurus/Link';

// import Refresh from '../../static/img/refresh.svg';

export default function Embed({
  src,
  repo,
  width = '100%',
  height = '400',
  ...props
}: React.IframeHTMLAttributes<HTMLIFrameElement> & { repo?: string }) {
  return (
    <div>
      {/* <Refresh /> */}
      <iframe src={src} width={width} height={height} {...props} />
      <p style={{ textAlign: 'center' }}>
        <Link
          className="button button--secondary button--sm"
          to={src}
          target="_blank"
        >
          Open in new tab
        </Link>
        &nbsp;
        <Link
          className="button button--secondary button--sm"
          to={repo}
          target="_blank"
        >
          Github
        </Link>
      </p>
    </div>
  );
}
