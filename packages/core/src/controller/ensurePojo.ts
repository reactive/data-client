export const ensurePojo =
  // FormData doesn't exist in node
  /* istanbul ignore else we don't run coverage when we test node*/
  typeof FormData !== 'undefined'
    ? (body: any) =>
        body instanceof FormData
          ? Object.fromEntries((body as any).entries())
          : body
    : /* istanbul ignore next */
      (body: any) => body;
export default ensurePojo;
