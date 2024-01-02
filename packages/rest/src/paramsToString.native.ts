export default function paramsToString(
  searchParams?:
    | string
    | URLSearchParams
    | Record<string, string>
    | string[][]
    | undefined,
) {
  const params = new URLSearchParams(searchParams as any);
  try {
    params.sort();
    // eslint-disable-next-line no-empty
  } catch {}
  return params.toString();
}
