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
