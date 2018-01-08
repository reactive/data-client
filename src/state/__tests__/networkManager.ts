import { cleanup } from 'react-testing-library';
import NetworkManager from '../NetworkManager';

afterEach(cleanup);

describe('NetworkManager', () => {
  const manager = new NetworkManager();
  describe('getMiddleware()', () => {
    it('should return the same value every call', () => {
      const a = manager.getMiddleware();
      expect(a).toBe(manager.getMiddleware());
      expect(a).toBe(manager.getMiddleware());
    });
  });
  describe('cleanup()', () => {
    it('should reject current promises', async () => {
      let rejection: any;
      let promise = (manager as any).throttle(
        'a',
        () => new Promise(resolve => {
          setTimeout(resolve, 1000);
        })
      ).catch((e: any) => { rejection = e });;
      manager.cleanup();
      await promise;
      expect(rejection).toBeDefined();
    });
  });
});
