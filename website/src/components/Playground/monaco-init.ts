import loader from '@monaco-editor/loader';

export let monacoMaster;

if (
  typeof window !== 'undefined' &&
  !/bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent)
) {
  const rhDeps = [
    'rest',
    'core',
    'endpoint',
    'normalizr',
    'graphql',
    'hooks',
  ] as const;

  const dependencies = [
    'react',
    'rest-hooks',
    '@rest-hooks/rest',
    '@rest-hooks/graphql',
    '@rest-hooks/hooks',
    'bignumber.js',
  ];

  if (!monacoMaster) {
    const monacoPromise = loader.init();
    monacoPromise.then(monaco => {
      // or make sure that it exists by other ways
      if (!monaco) return;
      monacoMaster = monaco;
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        allowNonTsExtensions: true,
        target: monaco.languages.typescript.ScriptTarget.ES2017,
        jsx: monaco.languages.typescript.JsxEmit.React,
        strict: true,
        strictNullChecks: true,
        exactOptionalPropertyTypes: true,
        lib: ['dom', 'esnext'],
        module: monaco.languages.typescript.ModuleKind.ESNext,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        typeRoots: ['node_modules/@types'],
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        noImplicitAny: false,
      });
      // TODO: load theme from docusaurus config
      // see https://microsoft.github.io/monaco-editor/playground.html for full options
      monaco.editor.defineTheme('prism', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'number', foreground: 'f78c6c' },
          { token: 'string', foreground: 'b6d986' },
          {
            token: 'keyword',
            fontStyle: 'italic',
            foreground: '7da4f6',
          },
          // type definitions variables like const X or class X
          { token: 'type', foreground: 'ffcb6b' },
          { token: 'delimiter', foreground: 'C792EA' },

          { token: 'tag', foreground: 'FF5590' },
        ],
        colors: {
          //'editor.background': '#292d3e',
          'editor.foreground': '#bfc7d5',
          //'editor.lineHighlightBorder': '#33384d',
          'editor.inactiveSelectionBackground': '#484d5b',
        },
      });
      //monaco.languages.typescript.getTypeScriptWorker().then(worker => worker)
      // autocomplete imports
      monaco.languages.registerCompletionItemProvider('typescript', {
        // These characters should trigger our `provideCompletionItems` function
        triggerCharacters: ["'", '"', '.', '/'],
        // Function which returns a list of autocompletion ietems. If we return an empty array, there won't be any autocompletion.
        provideCompletionItems: (model, position) => {
          // Get all the text content before the cursor
          const textUntilPosition = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });
          // Match things like `from "` and `require("`
          if (
            /(([\s|\n]+from\s+)|(\brequire\b\s*\())["|'][^'^"]*$/.test(
              textUntilPosition,
            )
          ) {
            // It's probably a `import` statement or `require` call
            if (
              textUntilPosition.endsWith('.') ||
              textUntilPosition.endsWith('/')
            ) {
              //const thisId = /\/\d+\//g.exec(model.uri.path)?.[0];
              //if (!thisId) return;
              const completions = monaco.editor
                .getModels()
                .map(model => model.uri.path)
                /*.filter(
                  path => path.startsWith(thisId) && path !== model.uri.path,
                )*/
                .map(path => {
                  const candidateId = /\/\d+\//g.exec(path)?.[0] ?? '';
                  const file = path.substring(candidateId.length - 1);
                  return {
                    // Show the full file path for label
                    label: file,
                    // Don't keep extension for JS files
                    insertText: file.replace(/\.tsx?$/, ''),
                    kind: monaco.languages.CompletionItemKind.Module,
                  };
                });
              if (!completions.length) return;
              return { suggestions: completions };
              // User is trying to import a file
              /*return Object.keys(this.props.files)
              .filter(path => path !== this.props.path)
              .map(path => {
                let file = getRelativePath(this.props.path, path);
                // Only show files that match the prefix typed by user
                if (file.startsWith(prefix)) {
                  // Remove typed text from the path so that don't insert it twice
                  file = file.slice(typed.length);
                  return {
                    // Show the full file path for label
                    label: file,
                    // Don't keep extension for JS files
                    insertText: file.replace(/\.js$/, ''),
                    kind: monaco.languages.CompletionItemKind.File,
                  };
                }
                return null;
              })
              .filter(Boolean);*/
            } else {
              // User is trying to import a dependency
              return {
                suggestions: dependencies.map(name => ({
                  label: name,
                  //detail: dependencies[name],
                  kind: monaco.languages.CompletionItemKind.Module,
                  insertText: name,
                })),
              };
            }
          }
        },
      });
    });

    Promise.allSettled([
      monacoPromise,
      import(
        /* webpackChunkName: 'es2022DTS', webpackPreload: true */ '!!raw-loader?esModule=false!./editor-types/lib.es2022.object.d.ts'
      ),
      import(
        /* webpackChunkName: 'reactDTS', webpackPreload: true */ '!!raw-loader?esModule=false!./editor-types/react.d.ts'
      ),
      import(
        /* webpackChunkName: 'bignumberDTS', webpackPreload: true */ '!!raw-loader?esModule=false!./editor-types/bignumber.d.ts'
      ),
      import(
        /* webpackChunkName: 'resthooksDTS', webpackPreload: true */ '!!raw-loader?esModule=false!./editor-types/rest-hooks.d.ts'
      ),
      ...rhDeps.map(
        dep =>
          import(
            /* webpackChunkName: '[request]', webpackPreload: true */ `!!raw-loader?esModule=false!./editor-types/@rest-hooks/${dep}.d.ts`
          ),
      ),
    ]).then(([mPromise, ...settles]) => {
      if (mPromise.status !== 'fulfilled' || !mPromise.value) return;
      const monaco = mPromise.value;
      const [es2022, react, bignumber, restHooks, ...rhLibs] = settles.map(
        result => (result.status === 'fulfilled' ? result.value.default : ''),
      );

      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        `declare module "react/jsx-runtime" {
        import './';
      }`,
        'file:///node_modules/@types/react/jsx-runtime.d.ts',
      );
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
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
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        `declare function render(component:JSX.Element):void;
        declare function CurrentTime(props: {}):JSX.Element;
        declare function ResetableErrorBoundary(props: { children: JSX.ReactChild }):JSX.Element;
        declare function randomFloatInRange(min: number, max: number, decimals?: number): number;`,
      );
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        es2022,
        'es2022',
      );
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        `declare module "react" { ${react} }`,
        'file:///node_modules/@types/react/index.d.ts',
      );
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        `declare module "bignumber.js" { ${bignumber} }`,
        'file:///node_modules/bignumber.js/index.d.ts',
      );
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        `declare module "rest-hooks" { ${restHooks} }`,
        'file:///node_modules/rest-hooks/index.d.ts',
      );
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        `declare globals { ${restHooks} }`,
      );

      rhLibs.forEach((lib, i) => {
        const dep = rhDeps[i];
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          `declare module "@rest-hooks/${dep}" { ${lib} }`,
          `file:///node_modules/@rest-hooks/${lib}/index.d.ts`,
        );
        if (dep === 'rest') {
          monaco.languages.typescript.typescriptDefaults.addExtraLib(
            `declare globals { ${lib} }`,
          );
        }
      });

      monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
      return monaco;
    });
  }
}
