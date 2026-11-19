import { cleared } from './queueSlice';
import { useAppDispatch, useAppSelector } from '../../app/hooks';

export function QueueBar() {
  const dispatch = useAppDispatch();
  const { trackIds, totalMs } = useAppSelector(s => s.queue);
  return (
    <footer>
      {trackIds.length} queued · {Math.round(totalMs / 60000)} min
      <button onClick={() => dispatch(cleared())}>Clear</button>
    </footer>
  );
}
