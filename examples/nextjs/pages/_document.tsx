import { DataClientDocument } from '@data-client/ssr/nextjs';
import type { DocumentContext } from 'next/document';

export default class MyDocument extends DataClientDocument {
  static getNonce(ctx: DocumentContext & { res: { nonce?: string } }) {
    // this assumes nonce has been added here - customize as you need
    return ctx?.res?.nonce;
  }
}
