import type { State } from '@data-client/redux';

export const ServerData = ({
  data,
  nonce,
  id = 'data-client-data',
}: {
  data: State<unknown>;
  id?: string;
  nonce?: string | undefined;
}) => {
  try {
    const encoded = JSON.stringify(data);
    return (
      <script
        id={id}
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: encoded,
        }}
        nonce={nonce}
      />
    );
  } catch (e) {
    console.error(`Error serializing json for ${id}`);
    console.error(e);
    return null;
  }
};

export default ServerData;
