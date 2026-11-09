import { TunesClient } from 'tunes-sdk';

// Recreated on sign-in; see features/auth/authSlice.ts
export let client = new TunesClient({ token: undefined });
export function setClientToken(token: string | undefined) {
  client = new TunesClient({ token });
}

// tunes-sdk types (abridged):
// client.getTrack({ id }): Promise<Track>
// client.getAlbum({ id }): Promise<{ album: Album; tracks: Track[] }>
// client.search({ q, signal? }): Promise<{ tracks: Track[]; albums: Album[] }>
// client.likeTrack({ id, liked }): Promise<Track>
// client.signIn({ username, password }): Promise<{ token: string; user: { id: string; name: string } }>
// client.onTrackUpdated(cb: (track: Track) => void): () => void   // websocket push of play counts
// interface Track { id: string; title: string; albumId: string; durationMs: number; plays: number; liked: boolean; likes: number }
// interface Album { id: string; title: string; artist: string; coverUrl: string }
