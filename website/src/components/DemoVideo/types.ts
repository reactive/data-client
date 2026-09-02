export interface DemoPoster {
  light: string;
  dark?: string;
}

/**
 * Recorded facade assets and their intrinsic presentation viewport.
 *
 * Site-root paths are resolved internally — authors never call `useBaseUrl`.
 *
 * Asset convention:
 * - videos: `/videos/demos/<id>.mp4` (optional `/videos/demos/<id>.webm`)
 * - posters: `/img/demos/<id>.jpg` (optional `/img/demos/<id>.dark.jpg`)
 */
export interface DemoSource {
  id: string;
  /** Required universal fallback. Site-root path. */
  mp4: string;
  /** Optional preferred encoding. */
  webm?: string;
  poster: DemoPoster;
  /**
   * Intrinsic dimensions; aspect ratio is derived, never separately
   * configured. Required so SSR reserves space and activation causes zero
   * container-size change.
   */
  width: number;
  height: number;
}

/** Sizing subset of DemoSource keeping the live preview stable vs the recording. */
export type DemoViewport = Pick<DemoSource, 'width' | 'height'>;

export interface DemoVideoProps {
  source: DemoSource;
  /** Omit for a standalone video without live handoff. */
  onActivate?: () => void;
}

/** Media status only; activation is owned by the playground. */
export type DemoPlaybackState =
  | { status: 'dormant' | 'loading' | 'playing' }
  | { status: 'paused'; reason: 'user' | 'out-of-view' }
  | { status: 'blocked' | 'error' };

export type PlaybackEvent =
  | { type: 'visibility'; inView: boolean }
  | { type: 'user-play' }
  | { type: 'user-pause' }
  | { type: 'playing' }
  | { type: 'waiting' }
  | { type: 'blocked' }
  | { type: 'error' };

export interface AutoplayInViewOptions {
  enabled: boolean;
  threshold?: number;
}

export interface AutoplayInViewController {
  state: DemoPlaybackState;
  /** Explicit user action may override reduced-data/motion autoplay policy. */
  play(): Promise<void>;
  pause(): void;
}
