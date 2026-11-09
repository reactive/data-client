import { useState } from 'react';

import { useAppDispatch, useAppSelector } from './app/hooks';
import { signOut } from './features/auth/authSlice';
import { QueueBar } from './features/queue/QueueBar';
import { SearchPage } from './features/search/SearchPage';
import { AlbumPage } from './features/tracks/AlbumPage';

export function App() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);
  const [albumId, setAlbumId] = useState<string | null>(null);
  return (
    <div>
      <header>
        {user?.name}{' '}
        <button onClick={() => dispatch(signOut())}>Sign out</button>
      </header>
      {albumId ?
        <AlbumPage id={albumId} />
      : <SearchPage onOpenAlbum={setAlbumId} />}
      <QueueBar />
    </div>
  );
}
