/** Streams Coinbase prices as Server-Sent Events, for the homepage's SSE demo.
 *
 * `GET /api/ticker-stream?product_ids=BTC-USD,ETH-USD` sends a
 * `data: [Ticker]` event as each product's price changes (at most every 5
 * seconds per product), in the shape of Coinbase's REST `/products/:id/ticker`.
 * Every 5 seconds it also sends `data: []`, so clients can tell the stream is
 * alive.
 *
 * Each request holds one Coinbase websocket. The stream ends before the
 * function times out; clients then reconnect.
 */

const COINBASE_FEED = 'wss://ws-feed.exchange.coinbase.com';
const PRODUCT_ID = /^[A-Z0-9]{1,10}-[A-Z]{2,5}$/;
const MAX_PRODUCTS = 10;
const KEEPALIVE_MS = 5000;
/** Under `maxDuration`, so the stream ends cleanly */
const LIFETIME_MS = 280_000;

export const config = { maxDuration: 300 };

export function GET(request: Request): Response {
  const productIds = parseProductIds(
    new URL(request.url).searchParams.get('product_ids'),
  );
  if (!productIds.length)
    return new Response('product_ids must list products like BTC-USD', {
      status: 400,
    });

  const encoder = new TextEncoder();
  const socket = new WebSocket(COINBASE_FEED);
  let keepalive: ReturnType<typeof setInterval>;
  let lifetime: ReturnType<typeof setTimeout>;
  const stop = () => {
    clearInterval(keepalive);
    clearTimeout(lifetime);
    // a late message would write to the closed stream
    socket.onmessage = null;
    socket.close();
  };

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (tickers: ReturnType<typeof toTicker>[]) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(tickers)}\n\n`),
        );
      };
      const end = () => {
        stop();
        try {
          controller.close();
        } catch {
          // already closed, or the client went away
        }
      };

      // one product per subscribe, so an unknown one fails alone
      socket.onopen = () => {
        for (const productId of productIds)
          socket.send(
            JSON.stringify({
              type: 'subscribe',
              product_ids: [productId],
              channels: ['ticker_batch'],
            }),
          );
      };
      socket.onmessage = event => {
        const message = JSON.parse(event.data);
        if (message.type === 'ticker') send([toTicker(message)]);
      };
      socket.onclose = end;

      // lets clients tell a quiet market from a dead stream
      keepalive = setInterval(() => send([]), KEEPALIVE_MS);
      lifetime = setTimeout(end, LIFETIME_MS);
      request.signal.addEventListener('abort', end);
    },
    cancel: stop,
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}

/** The well-formed `product_ids`, up to MAX_PRODUCTS, so one bad id
 * (like a symbol being typed) doesn't end everyone's stream */
function parseProductIds(param: string | null): string[] {
  return [...new Set(param?.split(',') ?? [])]
    .filter(id => PRODUCT_ID.test(id))
    .slice(0, MAX_PRODUCTS);
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
