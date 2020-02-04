export default function paramsToString(
  searchParams: Readonly<Record<string, string | number>>,
) {
  const params = new URLSearchParams(searchParams as any);
  params.sort();
  return params.toString();
}
