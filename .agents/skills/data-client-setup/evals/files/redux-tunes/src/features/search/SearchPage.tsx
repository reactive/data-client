import { useState } from 'react';

import { runSearch } from './searchSlice';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { TrackRow } from '../tracks/TrackRow';

export function SearchPage({
  onOpenAlbum,
}: {
  onOpenAlbum: (id: string) => void;
}) {
  const dispatch = useAppDispatch();
  const [q, setQ] = useState('');
  const { trackIds, albumIds, loading } = useAppSelector(s => s.search);
  const albums = useAppSelector(s =>
    albumIds.map(id => s.tracks.albums.entities[id]!),
  );
  return (
    <div>
      <form
        onSubmit={e => {
          e.preventDefault();
          dispatch(runSearch(q));
        }}
      >
        <input value={q} onChange={e => setQ(e.target.value)} />
      </form>
      {loading ?
        <p>Searching…</p>
      : <>
          <ul>
            {albums.map(a => (
              <li key={a.id}>
                <button onClick={() => onOpenAlbum(a.id)}>{a.title}</button>
              </li>
            ))}
          </ul>
          <ol>
            {trackIds.map(id => (
              <TrackRow key={id} id={id} />
            ))}
          </ol>
        </>
      }
    </div>
  );
}
