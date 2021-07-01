import ReactDOM from 'react-dom';

import RootProvider from './RootProvider';
import App from './App';

const content = (
  <RootProvider>
    <App />
  </RootProvider>
);

ReactDOM.createRoot(document.getElementById('react') || document.body).render(
  content,
);
