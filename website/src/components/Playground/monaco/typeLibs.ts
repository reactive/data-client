import type * as Monaco from 'monaco-editor';

/**
 * Type definitions for editor intellisense. Each is a separate webpack chunk
 * (raw text) fetched in parallel with Monaco's CDN bootstrap; a failed fetch
 * degrades to an empty lib rather than breaking the editor.
 */

type RawModule = Promise<{ default: string }>;

/** `declare module "<name>"` libs, mounted at file:///node_modules/<dir>/index.d.ts */
const MODULE_LIBS: readonly [
  name: string,
  dir: string,
  load: () => RawModule,
][] = [
  [
    'react',
    '@types/react',
    () =>
      import(
        /* webpackChunkName: 'reactDTS' */ '!!raw-loader?esModule=false!../editor-types/react.d.ts'
      ),
  ],
  [
    'bignumber.js',
    'bignumber.js',
    () =>
      import(
        /* webpackChunkName: 'bignumberDTS' */ '!!raw-loader?esModule=false!../editor-types/bignumber.d.ts'
      ),
  ],
  [
    '@number-flow/react',
    '@number-flow/react',
    () =>
      import(
        /* webpackChunkName: 'numberflowDTS' */ '!!raw-loader?esModule=false!../editor-types/@number-flow/react.d.ts'
      ),
  ],
  [
    'temporal-polyfill',
    'temporal-polyfill',
    () =>
      import(
        /* webpackChunkName: 'temporalDTS' */ '!!raw-loader?esModule=false!../editor-types/temporal.d.ts'
      ),
  ],
  [
    'uuid',
    '@types/uuid',
    () =>
      import(
        /* webpackChunkName: 'uuidDTS' */ '!!raw-loader?esModule=false!../editor-types/uuid.d.ts'
      ),
  ],
  [
    'qs',
    '@types/qs',
    () =>
      import(
        /* webpackChunkName: 'qsDTS' */ '!!raw-loader?esModule=false!../editor-types/qs.d.ts'
      ),
  ],
];

/** `@data-client/<entry>` libs; one lazy-once chunk for the whole directory */
const DATA_CLIENT_ENTRIES = [
  'rest',
  'rest/next',
  'react/next',
  'core/next',
  'core',
  'react',
  'endpoint',
  'normalizr',
  'graphql',
] as const;

/** Playground-only globals (editor-types/globals.d.ts) */
const loadGlobals = (): RawModule =>
  import(
    /* webpackChunkName: 'globalsDTS' */ '!!raw-loader?esModule=false!../editor-types/globals.d.ts'
  );

/** Ambient declarations for names the preview injects via react-live scope (see ../preview/scope.ts). */
const PREVIEW_SCOPE_DECLARATIONS = `declare function render(component:JSX.Element):void;
        declare function uuid(): string;
        declare function CurrentTime(props: {}):JSX.Element;
        declare function CancelButton(props: { onClick?: () => void }):JSX.Element;
        declare function Avatar(props: { src: string }):JSX.Element;
        declare function Formatted({ downColor, formatter, formatterFn, timeout, transition, transitionLength, upColor, value, stylePrefix, }: NumberProps):JSX.Element
        declare function ResetableErrorBoundary(props: { children: React.ReactNode }):JSX.Element;
        declare function TextInput(props:Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & { label?: React.ReactNode; loading?: boolean; size?: 'large' | 'medium' | 'small'; }):JSX.Element;
        declare function TextArea(props:InputHTMLAttributes<HTMLTextAreaElement> & { label?: React.ReactNode;}):JSX.Element;
        declare function SearchIcon():JSX.Element;
        declare function Loading():JSX.Element;
        declare function randomFloatInRange(min: number, max: number, decimals?: number): number;
        declare interface NumberProps {
          /**
           * Color value when the component flashes 'down'.
           */
          downColor?: string;
          /**
           * One of the built in formatters.
           */
          formatter?: 'currency' | 'percentage' | 'number';
          /**
           * Pass your own formatter function.
           */
          formatterFn?: Formatter;
          /**
           * Prefix for the CSS selectors in the DOM.
           */
          stylePrefix?: string;
          /**
           * Amount of time the flashed state is visible for, in milliseconds.
           */
          timeout?: number;
          /**
           * Custom CSS transition property.
           */
          transition?: string;
          /**
           * Transition length, in milliseconds.
           */
          transitionLength?: number;
          /**
           * Color value when the component flashes 'up'.
           */
          upColor?: string;
          /**
           * Value to display. The only required prop.
           */
          value: number;
        }`;

export interface TypeLibs {
  modules: string[];
  dataClient: string[];
  globals: string;
}

/** Start every type-lib download now; resolves once all have settled. */
export function fetchTypeLibs(): Promise<TypeLibs> {
  const settled = (promises: RawModule[]) =>
    Promise.allSettled(promises).then(results =>
      results.map(result =>
        result.status === 'fulfilled' ? result.value.default : '',
      ),
    );

  return Promise.all([
    settled(MODULE_LIBS.map(([, , load]) => load())),
    settled([loadGlobals()]),
    settled(
      DATA_CLIENT_ENTRIES.map(
        entry =>
          import(
            /* webpackChunkName: '[request]', webpackMode: "lazy-once" */ `!!raw-loader?esModule=false!../editor-types/@data-client/${entry}.d.ts`
          ),
      ),
    ),
  ]).then(([modules, [globals], dataClient]) => ({
    modules,
    dataClient,
    globals,
  }));
}

export function addTypeLibs(
  monaco: typeof Monaco,
  { modules, dataClient, globals }: TypeLibs,
) {
  const { typescriptDefaults } = monaco.typescript;
  const react = modules[0];

  typescriptDefaults.addExtraLib(
    `declare module "react/jsx-runtime" {
        import './';
      }`,
    'file:///node_modules/@types/react/jsx-runtime.d.ts',
  );
  typescriptDefaults.addExtraLib(
    `import * as React from 'react'

    declare global {
      namespace JSX {
        interface IntrinsicElements {
          strike: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        }
      }
    }`,
    'file:///node_modules/@types/react/more.d.ts',
  );
  typescriptDefaults.addExtraLib(PREVIEW_SCOPE_DECLARATIONS);

  MODULE_LIBS.forEach(([name, dir], i) => {
    typescriptDefaults.addExtraLib(
      `declare module "${name}" { ${modules[i]} }`,
      `file:///node_modules/${dir}/index.d.ts`,
    );
  });

  // React, NumberFlow and Temporal are also globals in the preview scope
  typescriptDefaults.addExtraLib(`declare globals { ${react} }`);
  typescriptDefaults.addExtraLib(
    `declare globals { export { default as NumberFlow } from '@number-flow/react'; }`,
  );
  typescriptDefaults.addExtraLib(
    `declare globals { export { Temporal, DateTimeFormat } from 'temporal-polyfill'; }`,
  );

  DATA_CLIENT_ENTRIES.forEach((entry, i) => {
    typescriptDefaults.addExtraLib(
      `declare module "@data-client/${entry}" { ${dataClient[i]} }`,
      `file:///node_modules/@data-client/${entry}/index.d.ts`,
    );
  });

  typescriptDefaults.addExtraLib(`declare globals { ${globals} }`);
}
