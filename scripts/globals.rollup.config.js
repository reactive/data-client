import { typeConfig } from './rollup-utils';

export default [
  {
    ...typeConfig,
    input: './scripts/globals.ts',
    output: [
      {
        file: './website/src/components/Playground/editor-types/globals.d.ts',
        format: 'es',
      },
    ],
  },
];
