import React, { useCallback, useReducer } from 'react';

export interface CodeDocument {
  value: string;
  path: string;
  title?: string;
  collapsed: boolean;
  col?: boolean;
  highlights?: string;
  language: string;
  autoFocus?: boolean;
}

export interface CodeModel {
  documents: readonly CodeDocument[];
  update: (index: number, value: string) => void;
}

/** `key="value"`, `key='value'` or bare `key=value` from a fence metastring */
function metaValue(metastring: string, key: string): string | undefined {
  return new RegExp(`\\b${key}=(?:(["'])(.*?)\\1|([^\\s"']+))`)
    .exec(metastring)
    ?.slice(2)
    .find(value => value !== undefined);
}

export function parseCodeDocuments(
  children: string | React.ReactNode | React.ReactNode[],
  defaultTab?: string,
): CodeDocument[] {
  if (typeof children === 'string') {
    return [
      {
        value: trimFinalNewline(children),
        collapsed: false,
        path: 'default.tsx',
        language: 'tsx',
      },
    ];
  }

  return (Array.isArray(children) ? children : [children])
    .filter((child): child is React.ReactElement<any> =>
      React.isValidElement(child),
    )
    .filter(child => child.props.children)
    .map(child =>
      typeof child.props.children === 'string' ?
        child.props
      : child.props.children.props,
    )
    .map(({ children: code, metastring = '', ...rest }) => {
      const title = metaValue(metastring, 'title') ?? '';
      const language =
        /\blanguage-(?<language>[\w-]+)/.exec(rest.className ?? '')?.groups
          ?.language ?? 'tsx';
      const extension = language === 'typescript' ? 'ts' : language;
      const fileBase = title || 'default';

      return {
        value: trimFinalNewline(code),
        title,
        collapsed:
          defaultTab ?
            // Vue SFC tabs are titled `Name.vue`; match them by component name
            title?.replace(/\.vue$/, '') !== defaultTab
          : /\bcollapsed\b/.test(metastring),
        col: /\bcolumn\b/.test(metastring),
        path:
          metaValue(metastring, 'path') ||
          (fileBase.includes('.') ? fileBase : `${fileBase}.${extension}`),
        highlights: /\{([\d\-,.]+)\}/.exec(metastring)?.[1],
        language,
        // Direct element props (title, path, collapsed, autoFocus) override
        // metastring-derived values — Demo/CodeEditor relies on this.
        ...rest,
      };
    });
}

export function updateDocument(
  documents: readonly CodeDocument[],
  index: number,
  value: string,
): readonly CodeDocument[] {
  return documents.map((document, documentIndex) =>
    documentIndex === index ? { ...document, value } : document,
  );
}

export function useCodeDocuments(
  children: string | React.ReactNode | React.ReactNode[],
  defaultTab?: string,
): CodeModel {
  const [documents, dispatch] = useReducer(
    (
      state: readonly CodeDocument[],
      action: { index: number; value: string },
    ) => updateDocument(state, action.index, action.value),
    { children, defaultTab },
    input => parseCodeDocuments(input.children, input.defaultTab),
  );
  const update = useCallback((index: number, value: string) => {
    dispatch({ index, value });
  }, []);

  return { documents, update };
}

function trimFinalNewline(code: string) {
  return code.replace(/\n$/, '');
}
