import { AsyncBoundary, DataProvider } from '@data-client/react';
import { lazy, useState } from 'react';
import { createRoot } from 'react-dom/client';

// one lazy chunk per page, like a router
const Todos = lazy(() => import('./pages/Todos'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  const [page, setPage] = useState('todos');
  return (
    <DataProvider>
      <button onClick={() => setPage(page === 'todos' ? 'profile' : 'todos')}>
        {page}
      </button>
      <AsyncBoundary>
        {page === 'todos' ?
          <Todos />
        : <Profile />}
      </AsyncBoundary>
    </DataProvider>
  );
}

createRoot(document.getElementById('root') || document.body).render(<App />);
