import { selectTrackLiked, selectTrackLikes, toggleLike } from './likesSlice';
import { selectTrackById } from './tracksSlice';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addToQueue } from '../queue/queueSlice';

export function TrackRow({ id }: { id: string }) {
  const dispatch = useAppDispatch();
  const track = useAppSelector(s => selectTrackById(s, id))!;
  const liked = useAppSelector(s => selectTrackLiked(s, id));
  const likes = useAppSelector(s => selectTrackLikes(s, id));
  return (
    <li>
      {track.title} · {track.plays} plays
      <button
        aria-pressed={liked}
        onClick={() => dispatch(toggleLike({ id, liked: !liked }))}
      >
        ♥ {likes}
      </button>
      <button onClick={() => dispatch(addToQueue(id))}>Queue</button>
    </li>
  );
}
