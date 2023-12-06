import { parseCodeBlockTitle } from '@docusaurus/theme-common/internal';
import { useMemo, useReducer } from 'react';

import {
  parseCodeBlockCollapsed,
  parseCodeBlockPath,
} from './PlaygroundTextEdit';

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
        const path = parseCodeBlockPath(metastring);
        const highlights = /\{([\d\-,.]+)\}/.exec(metastring)?.[1];
        return {
          code: children.replace(/\n$/, ''),
          title,
          collapsed,
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
