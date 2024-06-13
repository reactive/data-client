// this is not useful in react native
export default function DevToolsButtonNative({
  pos,
}: {
  pos: DevToolsPosition;
}) {
  return null;
}

export type DevToolsPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left';
