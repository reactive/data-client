import { Endpoint, EndpointInstance } from '@rest-hooks/endpoint';

function isNode() {
  return typeof process !== 'undefined' && process.release.name === 'node';
}

const getImage: EndpointInstance<
  (this: EndpointInstance, { src }: { src: string }) => Promise<string>,
  string,
  undefined
> = new Endpoint(
  async function (
    this: EndpointInstance,
    { src }: { src: string },
  ): Promise<string> {
    return new Promise(resolve => {
      // even if we polyfill, on server we don't want to actually wait to resolve the Image
      if (isNode() || !Image) resolve(src);
      const img = new Image();
      img.onload = () => {
        resolve(src);
      };
      img.onerror = error => {
        // in case we fail to load we actually don't want to error out but
        // let the browser display the normal image fallback
        resolve(src);
      };
      img.src = src;
    });
  },
  {
    key(this: EndpointInstance, { src }: { src: string }) {
      return `GET ${src}`;
    },
    schema: '',
  },
);
export default getImage;
