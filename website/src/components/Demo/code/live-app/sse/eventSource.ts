/** An EventSource that reconnects after errors, going offline and silence,
 * and pauses while the page is hidden */
export class ReconnectingEventSource {
  onmessage = (data: any) => {};

  declare protected source: EventSource | undefined;
  declare protected url: string | undefined;
  protected isOpen = false;
  protected attempts = 0;
  declare protected openedAt: number | undefined;
  /** Pending reconnect, or the watchdog while connected */
  declare protected timer: ReturnType<typeof setTimeout>;

  open() {
    this.isOpen = true;
    if (!document.hidden) this.connect();
    addEventListener('online', this.reconnect);
    // a stream can take minutes to notice the network is gone
    addEventListener('offline', this.stop);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  close() {
    this.isOpen = false;
    removeEventListener('online', this.reconnect);
    removeEventListener('offline', this.stop);
    document.removeEventListener(
      'visibilitychange',
      this.onVisibility,
    );
    this.stop();
  }

  /** Streams from `url` in place of the current stream;
   * undefined stops streaming */
  setUrl(url: string | undefined) {
    if (url === this.url) return;
    this.url = url;
    this.attempts = 0;
    if (this.isOpen && !document.hidden) this.connect();
  }

  protected connect() {
    this.stop();
    if (!this.url) return;
    const source = new EventSource(this.url);
    this.source = source;
    this.openedAt = undefined;
    source.onopen = () => {
      this.openedAt = Date.now();
    };
    source.onmessage = event => {
      this.watch();
      this.onmessage(JSON.parse(event.data));
    };
    // after a failed connect, an error or the server ending the stream;
    // replaces EventSource's own retry, which doesn't back off
    source.onerror = () => this.retry();
    this.watch();
  }

  /** A stream can stay open on a dead network (like after sleep),
   * so reconnect when messages stop arriving */
  protected watch() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.retry(), 30_000);
  }

  /** Reconnects after a delay that doubles with each attempt, until a
   * stream stays up long enough to count as working */
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
    if (
      !document.hidden &&
      this.source?.readyState !== EventSource.OPEN
    )
      this.connect();
  };

  /** Background tabs don't need prices */
  protected onVisibility = () => {
    if (document.hidden) this.stop();
    else this.reconnect();
  };

  protected stop = () => {
    clearTimeout(this.timer);
    if (!this.source) return;
    this.source.onmessage = this.source.onerror = null;
    this.source.close();
  };
}
