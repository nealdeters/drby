import React from 'react';
import { render } from '@testing-library/react';
import App from '../App';

// Mock child components to isolate App testing
jest.mock('../components/RaceTrack', () => ({
  RaceTrack: () => <></>
}));

// Mock the custom hooks
jest.mock('../hooks/useRace', () => ({
  useRace: () => ({
    racers: [],
    startRace: jest.fn(),
    stopRace: jest.fn(),
    isRacing: false,
    progressMap: {} // Mocked shared values map
  })
}));

jest.mock('../hooks/useSeason', () => ({
  useSeason: () => ({
    roster: [],
    schedule: [],
    standings: {},
    nextRace: null,
    completeRace: jest.fn(),
    tracks: []
  })
}));

describe('App', () => {
  it('renders correctly', () => {
    const { getByText } = render(<App />);
    // Check for the header text "DRBY."
    expect(getByText('DRBY')).toBeTruthy();
  });
});