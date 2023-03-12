import { RestHooksDocument } from '@rest-hooks/ssr/nextjs';
import type { DocumentContext } from 'next/document.js';

export default class MyDocument extends RestHooksDocument {
  static getNonce(ctx: DocumentContext & { res: { nonce?: string } }) {
    // this assumes nonce has been added here - customize as you need
    return ctx?.res?.nonce;
  }
}
