import App from './App';
import RootProvider, { getManagers } from './RootProvider';

export const app = (
  <RootProvider>
    <App />
  </RootProvider>
);

export default app;
export { RootProvider, App, getManagers };
