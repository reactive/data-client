import type { Props } from '../Formatted';

export type Formatter = (value: Props['value']) => string;

type Formatters = {
  [K in Extract<Props['formatter'], string>]: (value: Props['value']) => string;
} & {
  default: Formatter;
};

const numberFormatter = (value: number) =>
  Intl.NumberFormat('en').format(value);

const currencyFormatter = (value: number) =>
  Intl.NumberFormat('en', { style: 'currency', currency: 'USD' }).format(value);

const percentageFormatter = (value: number) =>
  Intl.NumberFormat('en', {
    style: 'percent',
    signDisplay: 'exceptZero',
  }).format(value);

const defaultFormatter = (value: number) => `${value}`;

export const formatters: Formatters = {
  default: defaultFormatter,
  number: numberFormatter,
  currency: currencyFormatter,
  percentage: percentageFormatter,
};
