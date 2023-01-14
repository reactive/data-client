import { StrictMode } from 'react';
import ReactDOM from 'react-dom';

import App from './App';
import RootProvider from './RootProvider';

const content = (
  <StrictMode>
    <RootProvider>
      <App />
    </RootProvider>
  </StrictMode>
);

ReactDOM.createRoot(document.getElementById('react') || document.body).render(
  content,
);
