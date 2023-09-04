// this is not useful in react native
export default function DevToolsButton({ pos }: { pos: DevToolsPosition }) {
  return null;
}

export type DevToolsPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left';
