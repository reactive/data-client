import { initialState } from '@rest-hooks/core';
import type { State } from '@rest-hooks/core';

export const ServerDataComponent = ({ data }: { data: State<unknown> }) => {
  return (
    <script
      type="application/json"
      id={`server-data`}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
};

export function getDatafromDOM(): State<unknown> {
  const element = document.querySelector(`#server-data`);
  return element?.innerHTML ? JSON.parse(element?.innerHTML) : initialState;
}

export default ServerDataComponent;
