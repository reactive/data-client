try {
  if (typeof window !== 'undefined') {
    const { worker } = require('./browser');
    worker
      .start({
        onUnhandledRequest: ({ method, url }) => {
          if (url.pathname.startsWith('/api')) {
            console.warn(`Unhandled ${method} request to ${url}`);
          }
        },
      })
      .then(reg => {
        if (reg.installing) {
          const sw = reg.installing || reg.waiting;
          sw.onstatechange = function () {
            if (sw.state === 'installed') {
              // SW installed.  Refresh page so SW can respond with SW-enabled page.
              window.location.reload();
            }
          };
        } else if (reg.active) {
          console.info('MSW service worker already installed');
        }
      })
      .catch(reason => {
        console.info('MSW failed setup', reason);
      });
  } else {
    const { server } = require('./server');
    server.listen({
      onUnhandledRequest: ({ method, url }) => {
        if (url.pathname.startsWith('/api')) {
          console.warn(`Unhandled ${method} request to ${url}`);
        }
      },
    });
  }
} catch (e) {
  console.info('MSW failed setup');
}
