import { AppType } from 'next/app.js';
import Document, {
  DocumentContext,
  DocumentInitialProps,
} from 'next/document.js';

import { DType } from './docType.cjs';
import createPersistedStore from '../createPersistedStore.js';
import createServerDataComponent from '../createServerDataComponent.js';

// nextjs oddly breaks their exports here
// we conditionally check this just in case they fix it
const Doc: typeof DType = Object.hasOwn(Document, 'default')
  ? ((Document as any).default as any)
  : Document;

export default class DataClientDocument extends Doc {
  static async getInitialProps(
    ctx: DocumentContext,
  ): Promise<DocumentInitialProps> {
    const originalRenderPage = ctx.renderPage;

    const [ServerCacheProvider, useReadyCacheState] = createPersistedStore();
    const ServerDataComponent = createServerDataComponent(useReadyCacheState);

    // Run the React rendering logic synchronously
    ctx.renderPage = () => {
      return originalRenderPage({
        // Useful for wrapping the whole react tree
        enhanceApp: (App: AppType) => (props: any) =>
          (
            <ServerCacheProvider>
              <App {...props} />
            </ServerCacheProvider>
          ),
      });
    };
    // Run the parent `getInitialProps`, it now includes the custom `renderPage`
    const initialProps = await super.getInitialProps(ctx);

    initialProps.head = [
      ...(initialProps.head as any),
      <ServerDataComponent key="data-client" nonce={this.getNonce(ctx)} />,
    ];

    return initialProps;
  }

  static getNonce(ctx: DocumentContext): undefined | string {
    return undefined;
  }
}
