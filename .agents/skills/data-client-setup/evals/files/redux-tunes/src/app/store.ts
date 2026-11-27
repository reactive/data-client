import { configureStore } from '@reduxjs/toolkit';

import { client } from '../api/client';
import auth from '../features/auth/authSlice';
import queue from '../features/queue/queueSlice';
import search from '../features/search/searchSlice';
import likes from '../features/tracks/likesSlice';
import tracks, { trackUpdated } from '../features/tracks/tracksSlice';

export const store = configureStore({
  reducer: { auth, queue, search, likes, tracks },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// live play counts
client.onTrackUpdated(track => store.dispatch(trackUpdated(track)));
