import { Temporal } from '@js-temporal/polyfill';

const REL = new Intl.RelativeTimeFormat(navigator.language || 'en-US', {
  localeMatcher: 'best fit',
  numeric: 'auto',
  style: 'long',
});

export function humanTime(date: Temporal.Instant) {
  const duration = date.until(Temporal.Now.instant(), {
    largestUnit: 'second',
  });
  const seconds = duration.seconds;
  if (Math.abs(seconds) < 60) return REL.format(seconds, 'second');
  const minutes = Math.floor(seconds / 60);
  if (Math.abs(minutes) < 60) return REL.format(minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (Math.abs(hours) < 24) return REL.format(hours, 'hour');
  const days = Math.floor(hours / 24);
  if (Math.abs(days) < 31) return REL.format(days, 'day');
  if (Math.abs(days) >= 365) return REL.format(Math.floor(days / 365), 'year');
  return REL.format(Math.floor(days / 30), 'months');
}
