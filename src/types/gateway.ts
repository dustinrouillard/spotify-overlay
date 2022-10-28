export interface SpotifyPlayingData {
  playing: boolean;
  id: string;
  type: string;
  name: string;
  artists: Artist[];
  length: number;
  progress: number;
  image: string;
  device: Device;
}

export interface Artist {
  name: string;
}

export interface Device {
  name: string;
  type: string;
}
