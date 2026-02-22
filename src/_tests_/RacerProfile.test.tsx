import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { RacerProfile } from '../components/RacerProfile';
import { Racer } from '../gameTypes';

describe('RacerProfile', () => {
  const mockStats = {
    id: '1', name: 'Test Racer', color: 'red', baseSpeed: 10, health: 100, strategy: 'balanced' as const, trackPreference: 'asphalt' as const,
    acceleration: 50, endurance: 50, consistency: 50, staminaRecovery: 50,
    lane: 0, progress: 0, laps: 0, totalDistance: 0, status: 'active' as const, currentSpeed: 0, finishTime: 0,
    first: 1, second: 2, third: 0, racesRun: 5
  };

  it('renders correctly', () => {
    const { getByText } = render(<RacerProfile stats={mockStats} currentSeasonPoints={10} currentSeasonNumber={1} schedule={[]} onBack={() => {}} />);
    expect(getByText(/Test Racer/i)).toBeTruthy();
  });
});