import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { RootState } from '../../app/store';
import { fetchTrack, selectTrackById } from '../tracks/tracksSlice';

// Client state: what plays next. Persisted by redux-persist.
const queueSlice = createSlice({
  name: 'queue',
  initialState: { trackIds: [] as string[], totalMs: 0 },
  reducers: {
    enqueued(state, action: { payload: { id: string; durationMs: number } }) {
      state.trackIds.push(action.payload.id);
      state.totalMs += action.payload.durationMs;
    },
    cleared: () => ({ trackIds: [], totalMs: 0 }),
  },
});
export const { enqueued, cleared } = queueSlice.actions;
export default queueSlice.reducer;

// Called from track rows, album pages and a keyboard shortcut handler
export const addToQueue = createAsyncThunk(
  'queue/add',
  async (id: string, { dispatch, getState }) => {
    await dispatch(fetchTrack(id));
    const track = selectTrackById(getState() as RootState, id)!;
    dispatch(enqueued({ id, durationMs: track.durationMs }));
  },
);
