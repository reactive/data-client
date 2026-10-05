import type * as Monaco from 'monaco-editor';

/**
 * Type definitions for editor intellisense. Each is a separate webpack chunk
 * (raw text) fetched in parallel with Monaco's CDN bootstrap; a failed fetch
 * degrades to an empty lib rather than breaking the editor.
 */

type RawModule = Promise<{ default: string }>;

/** `declare module "<name>"` libs, mounted at file:///node_modules/<file> */
const MODULE_LIBS: readonly [
  name: string,
  file: string,
  load: () => RawModule,
][] = [
  [
    'react',
    '@types/react/index.d.ts',
    () =>
      import(
        /* webpackChunkName: 'reactDTS' */ '!!raw-loader?esModule=false!../editor-types/react.d.ts'
      ),
  ],
  [
    'csstype',
    'csstype/index.d.ts',
    () =>
      import(
        /* webpackChunkName: 'csstypeDTS' */ '!!raw-loader?esModule=false!../editor-types/csstype.d.ts'
      ),
  ],
  [
    'react/jsx-runtime',
    '@types/react/jsx-runtime.d.ts',
    () =>
      import(
        /* webpackChunkName: 'reactJsxRuntimeDTS' */ '!!raw-loader?esModule=false!../editor-types/react-jsx-runtime.d.ts'
      ),
  ],
  [
    'bignumber.js',
    'bignumber.js/index.d.ts',
    () =>
      import(
        /* webpackChunkName: 'bignumberDTS' */ '!!raw-loader?esModule=false!../editor-types/bignumber.d.ts'
      ),
  ],
  [
    '@number-flow/react',
    '@number-flow/react/index.d.ts',
    () =>
      import(
        /* webpackChunkName: 'numberflowDTS' */ '!!raw-loader?esModule=false!../editor-types/@number-flow/react.d.ts'
      ),
  ],
  [
    'temporal-polyfill',
    'temporal-polyfill/index.d.ts',
    () =>
      import(
        /* webpackChunkName: 'temporalDTS' */ '!!raw-loader?esModule=false!../editor-types/temporal.d.ts'
      ),
  ],
  [
    'uuid',
    '@types/uuid/index.d.ts',
    () =>
      import(
        /* webpackChunkName: 'uuidDTS' */ '!!raw-loader?esModule=false!../editor-types/uuid.d.ts'
      ),
  ],
  [
    'qs',
    '@types/qs/index.d.ts',
    () =>
      import(
        /* webpackChunkName: 'qsDTS' */ '!!raw-loader?esModule=false!../editor-types/qs.d.ts'
      ),
  ],
  [
    'path-to-regexp',
    'path-to-regexp/index.d.ts',
    () =>
      import(
        /* webpackChunkName: 'pathToRegexpDTS' */ '!!raw-loader?esModule=false!../editor-types/path-to-regexp.d.ts'
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

/** Module name for editor-types/globals.d.ts; only globalScopeLib() imports it. */
const GLOBALS_MODULE = 'playground-globals';

/**
 * Exports not aliased as globals: `default`, and names that would redeclare a
 * built-in global (those keep built-in types; use `schema.Array`, `schema.Object`).
 */
const SKIP_NAMES = new Set(['default', 'Array', 'Object']);

/** Top-level `export { … };` lists (not `export { … } from '…'` re-exports) */
const EXPORT_LIST = /^export\s*\{([^}]*)\}\s*;/gm;

/** Ambient declarations for names the preview injects via react-live scope (see ../preview/scope.ts). */
const PREVIEW_SCOPE_DECLARATIONS = `declare function render(component:JSX.Element):void;
        declare function uuid(): string;
        declare function CurrentTime(props: {}):JSX.Element;
        declare function CancelButton(props: { onClick?: () => void }):JSX.Element;
        declare function Avatar(props: { src: string }):JSX.Element;
        declare function Formatted({ downColor, formatter, formatterFn, timeout, transition, transitionLength, upColor, value, stylePrefix, }: NumberProps):JSX.Element
        declare function ResetableErrorBoundary(props: { children: React.ReactNode }):JSX.Element;
        declare function TextInput(props:Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & { label?: React.ReactNode; loading?: boolean; size?: 'large' | 'medium' | 'small'; }):JSX.Element;
        declare function TextArea(props:React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: React.ReactNode;}):JSX.Element;
        declare function SearchIcon():JSX.Element;
        declare function Loading():JSX.Element;
        declare function randomFloatInRange(min: number, max: number, decimals?: number): number;
        declare function mockFetch<T>(getResponse: (...args: any[]) => T, name?: string, delay?: number): (...args: any[]) => Promise<T>;
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
          formatterFn?: (value: number) => string;
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

  typescriptDefaults.addExtraLib(
    `declare module 'react' {
      namespace JSX {
        interface IntrinsicElements {
          strike: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        }
      }
    }
    export {};`,
    'file:///node_modules/@types/react/more.d.ts',
  );
  typescriptDefaults.addExtraLib(PREVIEW_SCOPE_DECLARATIONS);

  MODULE_LIBS.forEach(([name, file], i) => {
    typescriptDefaults.addExtraLib(
      `declare module "${name}" { ${modules[i]} }`,
      `file:///node_modules/${file}`,
    );
  });

  DATA_CLIENT_ENTRIES.forEach((entry, i) => {
    typescriptDefaults.addExtraLib(
      `declare module "@data-client/${entry}" { ${dataClient[i]} }`,
      `file:///node_modules/@data-client/${entry}/index.d.ts`,
    );
  });

  const { source, names } = parseGlobalsLib(globals);
  typescriptDefaults.addExtraLib(
    `declare module "${GLOBALS_MODULE}" { ${source} }`,
    `file:///node_modules/${GLOBALS_MODULE}/index.d.ts`,
  );
  typescriptDefaults.addExtraLib(
    globalScopeLib(names),
    'file:///node_modules/@types/playground-scope/index.d.ts',
  );
}

/**
 * globals.d.ts is a rollup-generated module that exports its declarations
 * through a top-level `export { … };` list. Returns those names, and the source
 * with `type` markers removed from the list so `import X = M.X` can alias
 * type-only exports too.
 */
function parseGlobalsLib(globals: string): {
  source: string;
  names: string[];
} {
  const names: string[] = [];
  const source = globals.replace(EXPORT_LIST, (_, list: string) => {
    const specifiers = list
      .split(',')
      .map(specifier => specifier.trim().replace(/^type\s+/, ''))
      .filter(Boolean);
    names.push(
      ...specifiers.map(specifier => specifier.split(/\s+as\s+/).pop()!),
    );
    return `export { ${specifiers.join(', ')} };`;
  });
  if (globals && !names.length)
    console.warn('Playground: no exports found in globals.d.ts');
  return {
    source,
    names: names.filter(name => !SKIP_NAMES.has(name)),
  };
}

/**
 * Declares the preview scope's library exports (../preview/scope.ts) as
 * globals, so playground code can use them without imports.
 */
function globalScopeLib(scopeNames: string[]): string {
  return `import * as _React from 'react';
import _NumberFlow from '@number-flow/react';
import { Temporal as _Temporal, Intl as _Intl } from 'temporal-polyfill';
import _BigNumber from 'bignumber.js';
import type { ActionTypes, Manager as _Manager } from '@data-client/core';
import * as _globals from '${GLOBALS_MODULE}';

declare global {
  export import React = _React;
  export import JSX = _React.JSX;
  export import use = _React.use;
  const NumberFlow: typeof _NumberFlow;
  export import Temporal = _Temporal;
  export import DateTimeFormat = _Intl.DateTimeFormat;
  export import BigNumber = _BigNumber;
  // type-only re-export in globals.d.ts, which \`import =\` can't alias
  interface Manager<Actions = ActionTypes> extends _Manager<Actions> {}
${scopeNames.map(name => `  export import ${name} = _globals.${name};`).join('\n')}
}`;
}
