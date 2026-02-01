import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { RacerProfile } from '../components/RacerProfile';
import { Racer } from '../gameTypes';

describe('RacerProfile', () => {
  const mockStats = {
    id: '1', name: 'Test Racer', color: 'red', baseSpeed: 10, health: 100, strategy: 'balanced' as const, trackPreference: 'asphalt' as const,
    lane: 0, progress: 0, laps: 0, totalDistance: 0, status: 'active' as const, currentSpeed: 0, finishTime: 0,
    first: 1, second: 2, third: 0, racesRun: 5
  };

  it('renders correctly', () => {
    const { getByText } = render(<RacerProfile stats={mockStats} onBack={() => {}} />);
    expect(getByText(/Test Racer/i)).toBeTruthy();
  });
});