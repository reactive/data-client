import { Temporal as PolyTemporal, Intl as PolyIntl } from 'temporal-polyfill';

export const Temporal = globalThis.Temporal ?? PolyTemporal;

export const Intl =
  globalThis.Temporal ? globalThis.Intl : { ...globalThis.Intl, ...PolyIntl };

export const DateTimeFormat =
  globalThis.Temporal ?
    globalThis.Intl.DateTimeFormat
  : PolyIntl.DateTimeFormat;
