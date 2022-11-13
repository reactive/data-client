import ReactDOM from 'react-dom';

import App from './App';
import RootProvider from './RootProvider';

const content = (
  <RootProvider>
    <App />
  </RootProvider>
);

ReactDOM.createRoot(document.getElementById('react') || document.body).render(
  content,
);
