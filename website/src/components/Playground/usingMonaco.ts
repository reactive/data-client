const usingMonaco =
  // React 18: perhaps this causes hydration problems.
  typeof window !== 'undefined' &&
  // crawler or mobile browser
  !/bot|googlebot|crawler|spider|robot|crawling|Mobile|Android|BlackBerry/i.test(
    navigator.userAgent,
  );
export default usingMonaco;
