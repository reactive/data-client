// Jest maps CSS imports to a mock (@anansi/jest-preset), but ts-jest still
// type-checks them; website code otherwise gets this from Docusaurus types.
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
