// frontend/src/services/racesService.ts
import { API_URL, headers } from './apiClient';
import { RaceEvent } from '../gameTypes';

export interface Race {
  id?: string;
  name: string;
  date?: string;
  trackId?: string;
  [key: string]: any;
}

export const racesService = {
  async getAll(): Promise<Race[]> {
    const response = await fetch(`${API_URL}/races`, { headers });
    if (!response.ok) throw new Error('Failed to fetch races');
    return response.json();
  },

  async getById(id: string): Promise<Race> {
    const response = await fetch(`${API_URL}/races/${id}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch race');
    return response.json();
  },

  async create(race: Race): Promise<Race> {
    const response = await fetch(`${API_URL}/races`, {
      method: 'POST',
      headers,
      body: JSON.stringify(race),
    });
    if (!response.ok) throw new Error('Failed to create race');
    return response.json();
  },

  async update(id: string, race: Partial<Race>): Promise<Race> {
    const response = await fetch(`${API_URL}/races/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(race),
    });
    if (!response.ok) throw new Error('Failed to update race');
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/races/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to delete race');
  },

  // Schedule persistence methods
  async getSeasonSchedule(): Promise<RaceEvent[]> {
    const response = await fetch(`${API_URL}/races/schedule`, { headers });
    if (!response.ok) throw new Error('Failed to fetch schedule');
    return response.json();
  },

  async saveSeasonSchedule(schedule: RaceEvent[]): Promise<void> {
    const response = await fetch(`${API_URL}/races/schedule`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ schedule }),
    });
    if (!response.ok) throw new Error('Failed to save schedule');
  },

  // Standings persistence methods
  async getStandings(): Promise<Record<string, number>> {
    const response = await fetch(`${API_URL}/races/standings`, { headers });
    if (!response.ok) throw new Error('Failed to fetch standings');
    return response.json();
  },

  async saveStandings(standings: Record<string, number>): Promise<void> {
    const response = await fetch(`${API_URL}/races/standings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ standings }),
    });
    if (!response.ok) throw new Error('Failed to save standings');
  }
};
