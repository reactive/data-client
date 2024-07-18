import Controller from '../../controller/Controller';
import applyManager from '../applyManager';
import NetworkManager from '../NetworkManager';

function onError(e: any) {
  e.preventDefault();
}
beforeEach(() => {
  if (typeof addEventListener === 'function')
    addEventListener('error', onError);
});
afterEach(() => {
  if (typeof removeEventListener === 'function')
    removeEventListener('error', onError);
});

it('applyManagers should console.warn() when no NetworkManager is provided', () => {
  const warnspy = jest
    .spyOn(global.console, 'warn')
    .mockImplementation(() => {});
  try {
    applyManager([], new Controller());
    expect(warnspy.mock.calls.length).toBe(2);
  } finally {
    warnspy.mockRestore();
  }
});
it('applyManagers should not console.warn() when NetworkManager is provided', () => {
  const warnspy = jest
    .spyOn(global.console, 'warn')
    .mockImplementation(() => {});
  try {
    applyManager([new NetworkManager()], new Controller());
    expect(warnspy.mock.calls.length).toBe(0);
  } finally {
    warnspy.mockRestore();
  }
});
