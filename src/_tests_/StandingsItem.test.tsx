import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { StandingsItem } from '../components/StandingsItem';
import { Racer } from '../gameTypes';

describe('StandingsItem', () => {
  const mockRacer: Racer = {
    id: '1', name: 'Test Racer', color: 'red', baseSpeed: 10, health: 100, strategy: 'balanced', trackPreference: 'asphalt',
    lane: 0, progress: 0, laps: 0, totalDistance: 0, status: 'active', currentSpeed: 0, finishTime: 0
  };
  const mockStats = { first: 1, second: 2, third: 0 };

  it('renders correctly', () => {
    const { getByText } = render(<StandingsItem racer={mockRacer} index={0} points={10} stats={mockStats} onPress={() => {}} />);
    expect(getByText(/Test Racer/i)).toBeTruthy();
  });

  it('calls onPress when clicked', () => {
    const onPress = jest.fn();
    const { getByText } = render(<StandingsItem racer={mockRacer} index={0} points={10} stats={mockStats} onPress={onPress} />);
    fireEvent.click(getByText(/Test Racer/i));
    expect(onPress).toHaveBeenCalledWith('1');
  });
});