import dts from 'rollup-plugin-dts';

function isExternalTypes(id) {
  if (id.startsWith('@data-client/core')) return true;
  if (id.startsWith('@data-client') || id.startsWith('data-client'))
    return false;
  if (id.startsWith('.')) return false;
  if (id.includes('data-client/packages')) return false;
  return true;
}
export const typeConfig = {
  input: './lib/index.d.ts',
  output: [{ file: 'index.d.ts', format: 'es' }],
  external: isExternalTypes,
  plugins: [dts({ respectExternal: true })],
};
export const typeConfigNext = {
  input: './lib/next/index.d.ts',
  output: [{ file: 'next.d.ts', format: 'es' }],
  external: isExternalTypes,
  plugins: [dts({ respectExternal: true })],
};

export const esnextConfig = {
  input: '../../node_modules/typescript/lib/lib.es2022.array.d.ts',
  output: [{ file: 'lib.esnext.d.ts', format: 'es' }],
  external: id => {
    console.log(id);
    return false;
  },
  plugins: [dts({ respectExternal: true })],
};
