/** Streams Coinbase prices as Server-Sent Events, for the homepage's SSE demo.
 *
 * `GET /api/ticker-stream?product_ids=BTC-USD,ETH-USD` sends one
 * `data: [Ticker, …]` event every 5 seconds with the products whose price
 * changed. Tickers have the shape of Coinbase's REST `/products/:id/ticker`.
 *
 * Each request holds one Coinbase websocket (`ticker_batch` channel). The
 * stream ends before the function times out; EventSource then reconnects.
 */

const COINBASE_FEED = 'wss://ws-feed.exchange.coinbase.com';
const PRODUCT_ID = /^[A-Z0-9]{1,10}-[A-Z]{2,5}$/;
const MAX_PRODUCTS = 10;
const FLUSH_MS = 5000;
/** Under `maxDuration`, so the stream ends cleanly */
const LIFETIME_MS = 280_000;

export const config = { maxDuration: 300 };

export function GET(request: Request): Response {
  const productIds = parseProductIds(
    new URL(request.url).searchParams.get('product_ids'),
  );
  if (!productIds)
    return new Response(
      `product_ids must list 1-${MAX_PRODUCTS} products like BTC-USD`,
      { status: 400 },
    );

  const encoder = new TextEncoder();
  const socket = new WebSocket(COINBASE_FEED);
  const changed = new Map<string, ReturnType<typeof toTicker>>();
  let flush: ReturnType<typeof setInterval>;
  let lifetime: ReturnType<typeof setTimeout>;
  const stop = () => {
    clearInterval(flush);
    clearTimeout(lifetime);
    socket.close();
  };

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text));
      const end = () => {
        stop();
        try {
          controller.close();
        } catch {
          // already closed, or the client went away
        }
      };
      // how long EventSource waits before reconnecting
      send('retry: 3000\n\n');
      flush = setInterval(() => {
        if (!changed.size) return;
        send(`data: ${JSON.stringify([...changed.values()])}\n\n`);
        changed.clear();
      }, FLUSH_MS);
      lifetime = setTimeout(end, LIFETIME_MS);
      socket.onclose = end;
      request.signal.addEventListener('abort', end);
    },
    cancel: stop,
  });

  socket.onopen = () =>
    socket.send(
      JSON.stringify({
        type: 'subscribe',
        product_ids: productIds,
        channels: ['ticker_batch'],
      }),
    );
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.type === 'ticker')
      changed.set(message.product_id, toTicker(message));
  };

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}

/** `product_ids` as a list, or undefined when it isn't a valid one */
function parseProductIds(param: string | null): string[] | undefined {
  const productIds = [...new Set(param?.split(',') ?? [])];
  if (
    productIds.length === 0 ||
    productIds.length > MAX_PRODUCTS ||
    !productIds.every(id => PRODUCT_ID.test(id))
  )
    return;
  return productIds;
}

/** A websocket `ticker` message in the REST ticker's shape */
function toTicker(message: Record<string, any>) {
  return {
    product_id: message.product_id,
    trade_id: message.trade_id,
    price: message.price,
    size: message.last_size,
    time: message.time,
    volume: message.volume_24h,
  };
}
