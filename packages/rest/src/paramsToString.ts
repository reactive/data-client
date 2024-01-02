export default function paramsToString(
  searchParams?:
    | string
    | URLSearchParams
    | Record<string, string>
    | string[][]
    | undefined,
) {
  const params = new URLSearchParams(searchParams);
  params.sort();
  return params.toString();
}
