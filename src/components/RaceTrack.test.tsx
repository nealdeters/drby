import React from 'react';
import { render } from '@testing-library/react-native';
import { RaceTrack } from './RaceTrack';
import { makeMutable } from 'react-native-reanimated';
import { Track } from '../gameTypes';

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return {
    ...Reanimated,
    useAnimatedProps: (cb: any) => cb(),
    createAnimatedComponent: (component: any) => component,
  };
});

describe('RaceTrack', () => {
  // Create 12 mock racers
  const mockRacers = Array.from({ length: 12 }, (_, i) => ({
    id: `${i}`, name: `R${i}`, color: 'red', baseSpeed: 10, progress: 0, totalDistance: 0, laps: 0, status: 'active' as const, currentSpeed: 10,
    health: 100, strategy: 'balanced' as const, trackPreference: 'asphalt' as const, lane: i
  }));
  
  const mockProgressMap: any = {};
  mockRacers.forEach(r => mockProgressMap[r.id] = makeMutable(0));

  const mockTrack: Track = { id: 't1', name: 'Test', surface: 'asphalt', length: 1000, laps: 1 };

  it('renders without crashing', () => {
    const { UNSAFE_getByType } = render(
      <RaceTrack racers={mockRacers} track={mockTrack} progressMap={mockProgressMap} />
    );
    // Should find the Svg component (which might be mocked or rendered as RNSVG*)
    expect(UNSAFE_getByType('RNSVGSvg')).toBeTruthy();
  });
});