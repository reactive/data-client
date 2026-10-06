import Controller from '../../controller/Controller';
import { MockController } from '../MockController';

describe('MockController', () => {
  it('accepts a Controller subclass with its own members', () => {
    class MyController extends Controller {
      doSomething = () => 'hi';
    }
    const Mocked = MockController(MyController, {});
    const controller = new Mocked();

    expect(controller).toBeInstanceOf(MyController);
    expect(controller.doSomething()).toBe('hi');
  });
});
