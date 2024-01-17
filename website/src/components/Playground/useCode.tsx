import { parseCodeBlockTitle } from '@docusaurus/theme-common/internal';
import { useMemo, useReducer } from 'react';

export function useCode(children) {
  const codeTabs: {
    code: string;
    path?: string;
    title?: string;
    collapsed: boolean;
    [k: string]: any;
  }[] = useMemo(() => {
    if (typeof children === 'string')
      return [{ code: children.replace(/\n$/, ''), collapsed: false }];
    return (Array.isArray(children) ? children : [children])
      .filter(child => child.props.children)
      .map(child =>
        typeof child.props.children === 'string' ?
          child.props
        : child.props.children.props,
      )
      .map(({ children, metastring = '', ...rest }) => {
        const title = parseCodeBlockTitle(metastring) ?? '';
        const collapsed = parseCodeBlockCollapsed(metastring) ?? false;
        const col = parseCodeBlockCol(metastring) ?? false;
        const path = parseCodeBlockPath(metastring);
        const highlights = /\{([\d\-,.]+)\}/.exec(metastring)?.[1];
        return {
          code: children.replace(/\n$/, ''),
          title,
          collapsed,
          col,
          path,
          highlights,
          ...rest,
        };
      });
  }, [children]);

  const [codes, dispatch] = useReducer(reduceCodes, undefined, () =>
    codeTabs.map(({ code }) => code),
  );
  //const [ready, setReady] = useState(() => codeTabs.map(() => false));
  const handleCodeChange = useMemo(
    () =>
      codeTabs.map((_, i) => v => {
        /*setReady(readies => {
      const ret = [...readies];
      ret[i] = true;
      return ret;
    });*/
        dispatch({ i, code: v });
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [codeTabs.length],
  );
  return { handleCodeChange, codes, codeTabs };
}
function reduceCodes(state: string[], action: { i: number; code: string }) {
  const newstate = [...state];
  newstate[action.i] = action.code;
  return newstate;
}

const codeBlockCollapsedRegex = /collapsed(?=)(?<collapsed>\S*?)\1/;
const codeBlockColRegex = /column(?=)(?<column>\S*?)\1/;
const codeBlockPathRegex = /path=(?<quote>["'])(?<path>.*?)\1/;
export function parseCodeBlockCollapsed(metastring?: string): boolean {
  return (
      metastring?.match(codeBlockCollapsedRegex)?.groups!.collapsed !==
        undefined
    ) ?
      true
    : false;
}
export function parseCodeBlockCol(metastring?: string): boolean {
  return metastring?.match(codeBlockColRegex)?.groups!.column !== undefined ?
      true
    : false;
}
export function parseCodeBlockPath(metastring?: string): string {
  return metastring?.match(codeBlockPathRegex)?.groups!.title ?? '';
}
