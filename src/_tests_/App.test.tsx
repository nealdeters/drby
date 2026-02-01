import '../nativewind-env.js'; // Ensure types are loaded
import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

// Mock child components to isolate App testing
jest.mock('../components/RaceTrack', () => ({
  RaceTrack: () => null
}));

// Mock the custom hook
jest.mock('../hooks/useRace', () => ({
  useRace: () => ({
    racers: [],
    startRace: jest.fn(),
    stopRace: jest.fn(),
    isRacing: false,
    progressMap: {}
  })
}));

describe('App', () => {
  it('renders correctly', () => {
    const { getByText } = render(<App />);
    expect(getByText('Drby Racing')).toBeTruthy();
  });
});