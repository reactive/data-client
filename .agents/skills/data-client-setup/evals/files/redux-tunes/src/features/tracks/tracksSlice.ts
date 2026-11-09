import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { Track, Album } from 'tunes-sdk';

import { client } from '../../api/client';
import type { RootState } from '../../app/store';
import { signedOut } from '../auth/authSlice';

const tracksAdapter = createEntityAdapter<Track>();
const albumsAdapter = createEntityAdapter<Album>();

export const fetchTrack = createAsyncThunk(
  'tracks/fetch',
  (id: string) => client.getTrack({ id }),
  {
    condition: (id, { getState }) =>
      !(getState() as RootState).tracks.tracks.entities[id],
  },
);
export const fetchAlbum = createAsyncThunk('tracks/fetchAlbum', (id: string) =>
  client.getAlbum({ id }),
);

const tracksSlice = createSlice({
  name: 'tracks',
  initialState: {
    tracks: tracksAdapter.getInitialState(),
    albums: albumsAdapter.getInitialState(),
    albumTrackIds: {} as Record<string, string[]>,
    status: 'idle' as 'idle' | 'loading' | 'failed',
  },
  reducers: {
    tracksReceived(state, action: PayloadAction<Track[]>) {
      tracksAdapter.upsertMany(state.tracks, action.payload);
    },
    albumsReceived(state, action: PayloadAction<Album[]>) {
      albumsAdapter.upsertMany(state.albums, action.payload);
    },
    trackUpdated(state, action: PayloadAction<Track>) {
      tracksAdapter.upsertOne(state.tracks, action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchTrack.pending, state => {
        state.status = 'loading';
      })
      .addCase(fetchTrack.fulfilled, (state, action) => {
        state.status = 'idle';
        tracksAdapter.upsertOne(state.tracks, action.payload);
      })
      .addCase(fetchTrack.rejected, state => {
        state.status = 'failed';
      })
      .addCase(fetchAlbum.fulfilled, (state, action) => {
        albumsAdapter.upsertOne(state.albums, action.payload.album);
        tracksAdapter.upsertMany(state.tracks, action.payload.tracks);
        state.albumTrackIds[action.payload.album.id] =
          action.payload.tracks.map(t => t.id);
      })
      .addCase(signedOut, () => tracksSlice.getInitialState());
  },
});

export const { tracksReceived, albumsReceived, trackUpdated } =
  tracksSlice.actions;
export default tracksSlice.reducer;
export const selectTrackById = (state: RootState, id: string) =>
  state.tracks.tracks.entities[id];
export const selectAlbumById = (state: RootState, id: string) =>
  state.tracks.albums.entities[id];
