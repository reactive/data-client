import dts from 'rollup-plugin-dts';

function isExternalTypes(id) {
  if (id.startsWith('@rest-hooks/core')) return true;
  if (id.startsWith('@rest-hooks') || id.startsWith('rest-hooks')) return false;
  if (id.startsWith('.')) return false;
  if (id.includes('rest-hooks/packages')) return false;
  return true;
}
export const typeConfig = {
  input: './lib/index.d.ts',
  output: [{ file: 'index.d.ts', format: 'es' }],
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
