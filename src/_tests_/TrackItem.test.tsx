import React from 'react';
import { render } from '@testing-library/react';
import { TrackItem } from '../components/TrackItem';
import { Track } from '../gameTypes';

describe('TrackItem', () => {
  const mockTrack: Track = { id: 't1', name: 'Test Track', surface: 'asphalt', length: 1000, laps: 3 };

  it('renders correctly', () => {
    const { getByText } = render(<TrackItem track={mockTrack} />);
    expect(getByText(/Test Track/i)).toBeTruthy();
    expect(getByText(/1000m/i)).toBeTruthy();
  });
});