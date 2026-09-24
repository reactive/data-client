export type DemoEventName =
  'demo_play' | 'demo_pause' | 'demo_activate' | 'demo_show_code';

export function trackDemoEvent(action: DemoEventName, id: string) {
  window.gtag?.('event', action, { demo_id: id });
}
