import { createAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { client, setClientToken } from '../../api/client';

export const signedOut = createAction('auth/signedOut');
export const signIn = createAsyncThunk(
  'auth/signIn',
  async (body: { username: string; password: string }) => {
    const { token, user } = await client.signIn(body);
    setClientToken(token);
    return user;
  },
);
export const signOut = () => (dispatch: (a: unknown) => void) => {
  setClientToken(undefined);
  dispatch(signedOut());
};

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null as null | { id: string; name: string } },
  reducers: {},
  extraReducers: b => {
    b.addCase(signIn.fulfilled, (s, a) => {
      s.user = a.payload;
    });
    b.addCase(signedOut, s => {
      s.user = null;
    });
  },
});
export default authSlice.reducer;
