export default function paramsToString(
  searchParams: Readonly<Record<string, string | number>>,
) {
  const params = new URLSearchParams(searchParams as any);
  try {
    params.sort();
    // eslint-disable-next-line no-empty
  } catch {}
  return params.toString();
}
