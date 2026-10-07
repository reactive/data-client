/**
 * Damped harmonic oscillator (mass 1) described the way people perceive it:
 * how long the motion takes and how much it bounces. Same model as SwiftUI's
 * and Motion's `visualDuration`/`bounce` springs.
 */
export interface Spring {
  /** Seconds to (visually) reach the target, ignoring the bounce tail */
  readonly duration: number;
  /** 0 = no overshoot (critically damped), towards 1 = springier */
  readonly bounce: number;
}

/** Offset from the target and velocity (units per second) */
export interface SpringState {
  offset: number;
  velocity: number;
}

/** Position and velocity `t` seconds after starting at `offset` with `velocity` */
export function springAt(
  { duration, bounce }: Spring,
  { offset, velocity }: SpringState,
  t: number,
): SpringState {
  const omega = (2 * Math.PI) / duration;
  const zeta = 1 - bounce;
  const decay = Math.exp(-zeta * omega * t);
  if (zeta >= 1) {
    const b = velocity + omega * offset;
    return {
      offset: decay * (offset + b * t),
      velocity: decay * (b - omega * (offset + b * t)),
    };
  }
  const omegaD = omega * Math.sqrt(1 - zeta * zeta);
  const b = (velocity + zeta * omega * offset) / omegaD;
  const cos = Math.cos(omegaD * t);
  const sin = Math.sin(omegaD * t);
  return {
    offset: decay * (offset * cos + b * sin),
    velocity:
      decay *
      ((b * omegaD - zeta * omega * offset) * cos -
        (offset * omegaD + zeta * omega * b) * sin),
  };
}

/** Frame rate keyframes and `linear()` easings are sampled at */
export const SAMPLE_RATE = 60;
const MAX_SECONDS = 3;

/**
 * Offsets sampled at SAMPLE_RATE until the spring rests within `precision`
 * of the target; the last sample is exactly 0.
 */
export function sampleSpring(
  spring: Spring,
  start: SpringState,
  precision: number,
): number[] {
  const samples = [start.offset];
  for (let frame = 1; frame < MAX_SECONDS * SAMPLE_RATE; frame++) {
    const { offset, velocity } = springAt(spring, start, frame / SAMPLE_RATE);
    if (
      Math.abs(offset) < precision &&
      Math.abs(velocity) < precision * SAMPLE_RATE
    )
      break;
    samples.push(offset);
  }
  samples.push(0);
  return samples;
}

/** CSS `linear()` easing that plays `spring` from rest, and its duration */
export function springEasing(spring: Spring) {
  const samples = sampleSpring(spring, { offset: 1, velocity: 0 }, 0.001);
  return {
    easing: `linear(${samples.map(offset => round(1 - offset)).join(', ')})`,
    duration: Math.round(((samples.length - 1) / SAMPLE_RATE) * 1000),
  };
}

function round(n: number) {
  return Math.round(n * 1e4) / 1e4;
}
