import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { client } from '../../api/client';
import type { RootState } from '../../app/store';
import { albumsReceived, tracksReceived } from '../tracks/tracksSlice';

export const runSearch = createAsyncThunk(
  'search/run',
  async (q: string, { dispatch, signal }) => {
    const { tracks, albums } = await client.search({ q, signal });
    dispatch(tracksReceived(tracks));
    dispatch(albumsReceived(albums));
    return { trackIds: tracks.map(t => t.id), albumIds: albums.map(a => a.id) };
  },
);

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    query: '',
    trackIds: [] as string[],
    albumIds: [] as string[],
    loading: false,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(runSearch.pending, (state, action) => {
        state.query = action.meta.arg;
        state.loading = true;
      })
      .addCase(runSearch.fulfilled, (state, action) => {
        state.loading = false;
        state.trackIds = action.payload.trackIds;
        state.albumIds = action.payload.albumIds;
      });
  },
});
export default searchSlice.reducer;
export const selectSearchTracks = (state: RootState) =>
  state.search.trackIds.map(id => state.tracks.tracks.entities[id]!);
