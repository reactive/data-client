if (typeof window !== 'undefined') {
  const { worker } = require('./browser');
  worker.start({
    onUnhandledRequest: ({ method, url }) => {
      if (url.pathname.startsWith('/api')) {
        console.warn(`Unhandled ${method} request to ${url}`);
      }
    },
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
