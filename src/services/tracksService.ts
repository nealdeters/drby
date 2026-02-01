import { API_URL, headers } from './apiClient';
import { Track } from '../gameTypes';

export const tracksService = {
  async getAll(): Promise<Track[]> {
    const response = await fetch(`${API_URL}/tracks`, { headers });
    if (!response.ok) throw new Error('Failed to fetch tracks');
    return response.json();
  },

  async create(track: Track): Promise<Track> {
    const response = await fetch(`${API_URL}/tracks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(track),
    });
    if (!response.ok) throw new Error('Failed to create track');
    return response.json();
  }
};
