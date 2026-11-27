import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { selectTrackById, trackUpdated } from './tracksSlice';
import { client } from '../../api/client';
import type { RootState } from '../../app/store';
import { signedOut } from '../auth/authSlice';

// Local overrides so the heart flips instantly; cleared once the server answers
export const toggleLike = createAsyncThunk(
  'likes/toggle',
  async ({ id, liked }: { id: string; liked: boolean }, { dispatch }) => {
    const track = await client.likeTrack({ id, liked });
    dispatch(trackUpdated(track));
    return track;
  },
);

const likesSlice = createSlice({
  name: 'likes',
  initialState: { likedById: {} as Record<string, boolean> },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(toggleLike.pending, (state, action) => {
        state.likedById[action.meta.arg.id] = action.meta.arg.liked;
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        delete state.likedById[action.meta.arg.id];
      })
      .addCase(toggleLike.rejected, (state, action) => {
        delete state.likedById[action.meta.arg.id];
      })
      .addCase(signedOut, () => ({ likedById: {} }));
  },
});
export default likesSlice.reducer;

export const selectTrackLiked = (state: RootState, id: string) => {
  const override = state.likes.likedById[id];
  const track = selectTrackById(state, id);
  return override ?? track?.liked ?? false;
};
export const selectTrackLikes = (state: RootState, id: string) => {
  const track = selectTrackById(state, id);
  if (!track) return 0;
  const override = state.likes.likedById[id];
  if (override === undefined || override === track.liked) return track.likes;
  return track.likes + (override ? 1 : -1);
};
