import { useEffect } from 'react';

import { TrackRow } from './TrackRow';
import { fetchAlbum, selectAlbumById } from './tracksSlice';
import { useAppDispatch, useAppSelector } from '../../app/hooks';

export function AlbumPage({ id }: { id: string }) {
  const dispatch = useAppDispatch();
  const album = useAppSelector(s => selectAlbumById(s, id));
  const trackIds = useAppSelector(s => s.tracks.albumTrackIds[id]);
  useEffect(() => {
    dispatch(fetchAlbum(id));
  }, [dispatch, id]);
  if (!album || !trackIds) return <p>Loading…</p>;
  return (
    <section>
      <h1>{album.title}</h1>
      <h2>{album.artist}</h2>
      <ol>
        {trackIds.map(t => (
          <TrackRow key={t} id={t} />
        ))}
      </ol>
    </section>
  );
}
