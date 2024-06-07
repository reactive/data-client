import type { Props } from "../Formatted";

export type Formatter = (value: Props["value"]) => string;

type Formatters = {
  [K in Extract<Props["formatter"], string>]: (value: Props["value"]) => string;
} & {
  default: Formatter;
};

// Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
export const formatPrice = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});
export const formatLargePrice = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumSignificantDigits: 4,
  minimumSignificantDigits: 4,
});

const numberFormatter = (value: number) =>
  Intl.NumberFormat("en").format(value);

const currencyFormatter = (value: number) =>
  formatPrice.format(value);

const percentageFormatter = (value: number) =>
  Intl.NumberFormat("en", {
    style: "percent",
    // See: https://github.com/microsoft/TypeScript/issues/36533
    // @ts-ignore
    signDisplay: "exceptZero",
  }).format(value);

const defaultFormatter = (value: number) => `${value}`;

export const formatters: Formatters = {
  default: defaultFormatter,
  number: numberFormatter,
  currency: currencyFormatter,
  percentage: percentageFormatter,
};

