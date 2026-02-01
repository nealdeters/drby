import { racesService } from '../services/racesService';
import { API_URL } from '../services/apiClient';

// Mock global fetch
global.fetch = jest.fn();

describe('racesService', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('fetches all races', async () => {
    const mockRaces = [{ id: '1', name: 'Derby 1' }];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRaces,
    });

    const races = await racesService.getAll();
    expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/races`, expect.anything());
    expect(races).toEqual(mockRaces);
  });

  it('creates a race', async () => {
    const newRace = { name: 'New Derby' };
    const createdRace = { id: '2', ...newRace };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => createdRace,
    });

    const result = await racesService.create(newRace);
    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/races`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(newRace),
      })
    );
    expect(result).toEqual(createdRace);
  });

  it('handles errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    await expect(racesService.getAll()).rejects.toThrow('Failed to fetch races');
  });
});
