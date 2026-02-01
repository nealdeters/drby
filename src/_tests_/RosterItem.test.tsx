import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { RosterItem } from '../components/RosterItem';
import { Racer } from '../gameTypes';

describe('RosterItem', () => {
  const mockRacer: Racer = {
    id: '1', name: 'Test Racer', color: 'red', baseSpeed: 10, health: 100, strategy: 'balanced', trackPreference: 'asphalt',
    lane: 0, progress: 0, laps: 0, totalDistance: 0, status: 'active', currentSpeed: 0, finishTime: 0
  };

  it('renders correctly', () => {
    const { getByText } = render(<RosterItem racer={mockRacer} onPress={() => {}} />);
    expect(getByText(/Test Racer/i)).toBeTruthy();
  });

  it('calls onPress when clicked', () => {
    const onPress = jest.fn();
    const { getByText } = render(<RosterItem racer={mockRacer} onPress={onPress} />);
    fireEvent.click(getByText(/Test Racer/i));
    expect(onPress).toHaveBeenCalledWith('1');
  });
});