import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { RacerItem } from '../components/RacerItem';
import { Racer } from '../gameTypes';

describe('RacerItem', () => {
  const mockRacer: Racer = {
    id: '1', name: 'Test Racer', color: 'red', baseSpeed: 10, health: 100, strategy: 'balanced', trackPreference: 'asphalt',
    acceleration: 50, endurance: 50, consistency: 50, staminaRecovery: 50,
    lane: 0, progress: 0, laps: 0, totalDistance: 0, status: 'active', currentSpeed: 0, finishTime: 0
  };

  it('renders correctly', () => {
    const { getByText } = render(<RacerItem racer={mockRacer} index={0} onPress={() => {}} />);
    expect(getByText(/Test Racer/i)).toBeTruthy();
  });

  it('calls onPress when clicked', () => {
    const onPress = jest.fn();
    const { getByText } = render(<RacerItem racer={mockRacer} index={0} onPress={onPress} />);
    fireEvent.click(getByText(/Test Racer/i));
    expect(onPress).toHaveBeenCalledWith('1');
  });
});