import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://public@sentry.example.com/1',
  // captures uncaught errors and unhandled promise rejections
  integrations: [Sentry.globalHandlersIntegration()],
});
