/** A WebSocket that reconnects after drops, going offline and silence */
export class ReconnectingSocket {
  onopen = () => {};
  onmessage = (message: any) => {};
  /** Whether silence means a dead connection */
  expectsMessages = () => true;

  declare protected socket: WebSocket;
  protected attempts = 0;
  /** When the current socket opened */
  declare protected openedAt: number | undefined;
  /** Pending reconnect, or the watchdog while connected */
  declare protected timer: ReturnType<typeof setTimeout>;

  constructor(protected url: string) {}

  open() {
    this.connect();
    addEventListener('online', this.reconnect);
    // a socket can take minutes to notice the network is gone
    addEventListener('offline', this.stop);
  }

  close() {
    removeEventListener('online', this.reconnect);
    removeEventListener('offline', this.stop);
    this.stop();
  }

  /** Dropped until open; onopen is the place to (re)send state */
  send(message: object) {
    if (this.socket?.readyState === WebSocket.OPEN)
      this.socket.send(JSON.stringify(message));
  }

  protected connect() {
    this.stop();
    this.socket = new WebSocket(this.url);
    this.openedAt = undefined;
    this.socket.onopen = () => {
      this.openedAt = Date.now();
      this.onopen();
    };
    this.socket.onmessage = event => {
      this.watch();
      this.onmessage(JSON.parse(event.data));
    };
    // after a failed connect, an error or a server close
    this.socket.onclose = () => this.retry();
    this.watch();
  }

  /** A socket can stay open on a dead network (like after sleep),
   * so reconnect when messages stop arriving */
  protected watch() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (this.expectsMessages()) this.retry();
      else this.watch();
    }, 30_000);
  }

  /** Reconnects after a delay that doubles with each attempt, until a
   * socket stays up long enough to count as working */
  protected retry() {
    this.stop();
    if (
      this.openedAt !== undefined &&
      Date.now() - this.openedAt > 10_000
    )
      this.attempts = 0;
    const delay = Math.min(30_000, 1000 * 2 ** this.attempts);
    this.attempts++;
    this.timer = setTimeout(this.reconnect, delay);
  }

  protected reconnect = () => {
    if (this.socket.readyState !== WebSocket.OPEN) this.connect();
  };

  /** Stops the socket without waiting for it to finish closing,
   * which it can't do offline */
  protected stop = () => {
    clearTimeout(this.timer);
    if (!this.socket) return;
    this.socket.onmessage = this.socket.onclose = null;
    this.socket.close();
  };
}
