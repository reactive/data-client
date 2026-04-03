import { Entity } from '@data-client/endpoint';

import ProgressEndpoint from '../ProgressEndpoint';
import type { DownloadProgress } from '../ProgressEndpoint';
import resource from '../resource';
import RestEndpoint from '../RestEndpoint';

function makeStreamResponse(
  body: string,
  {
    status = 200,
    statusText = 'OK',
    headers = {} as Record<string, string>,
    url = 'http://test.com/data',
    chunkSize = 10,
  } = {},
): Response {
  const encoded = new TextEncoder().encode(body);
  let offset = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (offset >= encoded.byteLength) {
        controller.close();
        return;
      }
      const end = Math.min(offset + chunkSize, encoded.byteLength);
      controller.enqueue(encoded.slice(offset, end));
      offset = end;
    },
  });
  const response = new Response(stream, {
    status,
    statusText,
    headers: { 'content-type': 'application/json', ...headers },
  });
  Object.defineProperty(response, 'url', { value: url });
  return response;
}

describe('ProgressEndpoint', () => {
  // Save and restore RestEndpoint.prototype.fetchResponse
  const originalFetchResponse = RestEndpoint.prototype.fetchResponse;

  afterEach(() => {
    RestEndpoint.prototype.fetchResponse = originalFetchResponse;
  });

  describe('onDownloadProgress', () => {
    it('should call progress callback with correct loaded/total', async () => {
      const data = JSON.stringify({ id: 1, title: 'Test' });
      const encoded = new TextEncoder().encode(data);
      const events: DownloadProgress[] = [];

      const ep = new ProgressEndpoint({ path: '/items/:id' });
      (ep as any).onDownloadProgress = (event: DownloadProgress) => {
        events.push({ ...event });
      };
      RestEndpoint.prototype.fetchResponse = () =>
        Promise.resolve(
          makeStreamResponse(data, {
            headers: { 'content-length': String(encoded.byteLength) },
            chunkSize: 5,
          }),
        );

      const result = await ep({ id: 1 });
      expect(result).toEqual({ id: 1, title: 'Test' });

      expect(events.length).toBeGreaterThan(0);
      const lastEvent = events[events.length - 1];
      expect(lastEvent.loaded).toBe(encoded.byteLength);
      expect(lastEvent.total).toBe(encoded.byteLength);
      expect(lastEvent.lengthComputable).toBe(true);

      for (const event of events) {
        expect(event.lengthComputable).toBe(true);
        expect(event.total).toBe(encoded.byteLength);
        expect(event.loaded).toBeGreaterThan(0);
        expect(event.loaded).toBeLessThanOrEqual(encoded.byteLength);
      }

      for (let i = 1; i < events.length; i++) {
        expect(events[i].loaded).toBeGreaterThan(events[i - 1].loaded);
      }
    });

    it('should set lengthComputable false when Content-Length missing', async () => {
      const data = JSON.stringify({ id: 2, title: 'No Length' });
      const events: DownloadProgress[] = [];

      const ep = new ProgressEndpoint({ path: '/items/:id' });
      (ep as any).onDownloadProgress = (event: DownloadProgress) => {
        events.push({ ...event });
      };
      RestEndpoint.prototype.fetchResponse = () =>
        Promise.resolve(makeStreamResponse(data, { headers: {} }));

      const result = await ep({ id: 2 });
      expect(result).toEqual({ id: 2, title: 'No Length' });

      expect(events.length).toBeGreaterThan(0);
      for (const event of events) {
        expect(event.lengthComputable).toBe(false);
        expect(event.total).toBeUndefined();
        expect(event.loaded).toBeGreaterThan(0);
      }
    });

    it('should set lengthComputable false when Content-Encoding present', async () => {
      const data = JSON.stringify({ id: 3 });
      const encoded = new TextEncoder().encode(data);
      const events: DownloadProgress[] = [];

      const ep = new ProgressEndpoint({ path: '/items/:id' });
      (ep as any).onDownloadProgress = (event: DownloadProgress) => {
        events.push({ ...event });
      };
      RestEndpoint.prototype.fetchResponse = () =>
        Promise.resolve(
          makeStreamResponse(data, {
            headers: {
              'content-encoding': 'gzip',
              'content-length': String(encoded.byteLength),
            },
          }),
        );

      await ep({ id: 3 });

      expect(events.length).toBeGreaterThan(0);
      for (const event of events) {
        expect(event.lengthComputable).toBe(false);
        expect(event.total).toBeUndefined();
      }
    });

    it('should behave like RestEndpoint when onDownloadProgress not set', async () => {
      const data = JSON.stringify({ id: 4, title: 'Plain' });

      const ep = new ProgressEndpoint({ path: '/items/:id' });
      RestEndpoint.prototype.fetchResponse = () =>
        Promise.resolve(makeStreamResponse(data));

      const result = await ep({ id: 4 });
      expect(result).toEqual({ id: 4, title: 'Plain' });
    });

    it('should skip progress when response.body is falsy', async () => {
      const events: DownloadProgress[] = [];

      const bodylessResponse = new Response(JSON.stringify({ id: 5 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
      Object.defineProperty(bodylessResponse, 'body', { value: null });

      const ep = new ProgressEndpoint({ path: '/items/:id' });
      (ep as any).onDownloadProgress = (event: DownloadProgress) => {
        events.push({ ...event });
      };
      RestEndpoint.prototype.fetchResponse = () =>
        Promise.resolve(bodylessResponse);

      const result = await ep({ id: 5 });
      expect(result).toEqual({ id: 5 });
      expect(events).toHaveLength(0);
    });

    it('should preserve response.url through reconstruction', async () => {
      const data = JSON.stringify({ id: 6 });
      let capturedResponse: Response | undefined;

      const ep = new ProgressEndpoint({ path: '/items/:id' });
      (ep as any).onDownloadProgress = () => {};
      RestEndpoint.prototype.fetchResponse = () =>
        Promise.resolve(
          makeStreamResponse(data, { url: 'http://example.com/items/6' }),
        );
      ep.parseResponse = (response: Response) => {
        capturedResponse = response;
        return response.json();
      };

      await ep({ id: 6 });
      expect(capturedResponse!.url).toBe('http://example.com/items/6');
    });

    it('should tag mid-stream TypeError with status 500', async () => {
      const stream = new ReadableStream({
        pull() {
          throw new TypeError('network error');
        },
      });

      const ep = new ProgressEndpoint({ path: '/items/:id' });
      (ep as any).onDownloadProgress = () => {};
      RestEndpoint.prototype.fetchResponse = () =>
        Promise.resolve(
          new Response(stream, {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        );

      let error: any;
      try {
        await ep({ id: 7 });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(TypeError);
      expect(error.status).toBe(500);
    });

    it('should work with .extend()', async () => {
      const data = JSON.stringify({ id: 8, title: 'Extended' });
      const encoded = new TextEncoder().encode(data);
      const events: DownloadProgress[] = [];

      const base = new ProgressEndpoint({ path: '/items/:id' });
      RestEndpoint.prototype.fetchResponse = () =>
        Promise.resolve(
          makeStreamResponse(data, {
            headers: { 'content-length': String(encoded.byteLength) },
          }),
        );

      const extended = base.extend({
        onDownloadProgress(event: {
          loaded: number;
          total: number | undefined;
          lengthComputable: boolean;
        }) {
          events.push({ ...event });
        },
      });

      const result = await (extended as any)({ id: 8 });
      expect(result).toEqual({ id: 8, title: 'Extended' });
      expect(events.length).toBeGreaterThan(0);
      expect(events[events.length - 1].loaded).toBe(encoded.byteLength);
    });

    it('should work with resource({ Endpoint: ProgressEndpoint })', () => {
      class Item extends Entity {
        id = 0;
        title = '';
        static key = 'Item';
      }

      const ItemResource = resource({
        path: '/items/:id',
        schema: Item,
        Endpoint: ProgressEndpoint,
      });

      expect(ItemResource.get).toBeDefined();
      expect(ItemResource.getList).toBeDefined();

      const withProgress = ItemResource.get.extend({
        onDownloadProgress(event: {
          loaded: number;
          total: number | undefined;
          lengthComputable: boolean;
        }) {},
      });
      expect(withProgress).toBeDefined();
      expect(withProgress.path).toBe('/items/:id');
    });

    it('should handle 204 No Content without errors', async () => {
      const events: DownloadProgress[] = [];

      const ep = new ProgressEndpoint({ path: '/items/:id', method: 'DELETE' });
      (ep as any).onDownloadProgress = (event: DownloadProgress) => {
        events.push({ ...event });
      };
      RestEndpoint.prototype.fetchResponse = () =>
        Promise.resolve(
          new Response(null, {
            status: 204,
            statusText: 'No Content',
            headers: {},
          }),
        );

      const result = await ep({ id: 9 });
      expect(result).toBeNull();
      expect(events).toHaveLength(0);
    });

    it('should handle text/non-JSON responses with progress', async () => {
      const text = 'plain text response';
      const events: DownloadProgress[] = [];

      const ep = new ProgressEndpoint({
        path: '/items/:id',
        schema: undefined,
      });
      (ep as any).onDownloadProgress = (event: DownloadProgress) => {
        events.push({ ...event });
      };
      RestEndpoint.prototype.fetchResponse = () =>
        Promise.resolve(
          makeStreamResponse(text, {
            headers: { 'content-type': 'text/plain' },
          }),
        );

      const result = await ep({ id: 10 });
      expect(result).toBe(text);
      expect(events.length).toBeGreaterThan(0);
    });

    it('should let callback exceptions propagate', async () => {
      const callbackError = new Error('callback bug');

      const ep = new ProgressEndpoint({ path: '/items/:id' });
      (ep as any).onDownloadProgress = () => {
        throw callbackError;
      };
      RestEndpoint.prototype.fetchResponse = () =>
        Promise.resolve(makeStreamResponse(JSON.stringify({ id: 11 })));

      await expect(ep({ id: 11 })).rejects.toBe(callbackError);
    });
  });
});
