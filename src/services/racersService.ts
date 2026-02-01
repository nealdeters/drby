import { API_URL, headers } from './apiClient';
import { Racer } from '../gameTypes';

export const racersService = {
  async getAll(): Promise<Racer[]> {
    const response = await fetch(`${API_URL}/racers`, { headers });
    if (!response.ok) throw new Error('Failed to fetch racers');
    return response.json();
  },

  async create(racer: Racer): Promise<Racer> {
    const response = await fetch(`${API_URL}/racers`, {
      method: 'POST',
      headers,
      body: JSON.stringify(racer),
    });
    if (!response.ok) throw new Error('Failed to create racer');
    return response.json();
  },
  
  async update(id: string, racer: Partial<Racer>): Promise<Racer> {
    const response = await fetch(`${API_URL}/racers/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(racer),
    });
    if (!response.ok) throw new Error('Failed to update racer');
    return response.json();
  }
};
