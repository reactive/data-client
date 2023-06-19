import '../styles/globals.css';
import { AppCacheProvider } from '@data-client/ssr/nextjs';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppCacheProvider>
      <Component {...pageProps} />
    </AppCacheProvider>
  );
}
