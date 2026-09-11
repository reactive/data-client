export type ViewportStatus = 'unknown' | 'visible' | 'hidden';
export type UserIntent = 'automatic' | 'requested' | 'paused';

export interface PlaybackPolicy {
  enabled: boolean;
  documentVisible: boolean;
  viewport: ViewportStatus;
  userIntent: UserIntent;
}

export function shouldPlay({
  enabled,
  documentVisible,
  viewport,
  userIntent,
}: PlaybackPolicy): boolean {
  return (
    documentVisible &&
    userIntent !== 'paused' &&
    ((enabled && viewport === 'visible') ||
      (userIntent === 'requested' && viewport !== 'hidden'))
  );
}

export function viewportFromEntry(
  entry: Pick<
    IntersectionObserverEntry,
    'isIntersecting' | 'intersectionRatio'
  >,
  threshold: number,
): Exclude<ViewportStatus, 'unknown'> {
  return entry.isIntersecting && entry.intersectionRatio >= threshold ?
      'visible'
    : 'hidden';
}
