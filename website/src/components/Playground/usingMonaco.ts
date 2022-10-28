const usingMonaco =
  typeof window !== 'undefined' &&
  // crawler or mobile browser
  !/bot|googlebot|crawler|spider|robot|crawling|Mobile|Android|BlackBerry/i.test(
    navigator.userAgent,
  );
export default usingMonaco;
