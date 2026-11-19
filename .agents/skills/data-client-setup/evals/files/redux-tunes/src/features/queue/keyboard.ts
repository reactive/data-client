import { addToQueue } from './queueSlice';
import { store } from '../../app/store';

// "q" queues the focused track row
document.addEventListener('keydown', e => {
  const id = (document.activeElement as HTMLElement | null)?.dataset.trackId;
  if (e.key === 'q' && id) store.dispatch(addToQueue(id));
});
