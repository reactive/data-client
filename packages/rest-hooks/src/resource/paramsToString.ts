/* istanbul ignore file */

export default function paramsToString(
  searchParams: Readonly<Record<string, string | number | boolean>>,
) {
  const params = new URLSearchParams(searchParams as any);
  params.sort();
  return params.toString();
}
