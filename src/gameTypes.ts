export type Surface = 'asphalt' | 'dirt' | 'grass';
export type Strategy = 'aggressive' | 'conservative' | 'balanced';
export type RacerStatus = 'active' | 'finished' | 'injured' | 'waiting' | 'dnf';

export interface Racer {
  id: string;
  name: string;
  color: string;
  baseSpeed: number; // 70-90 (roughly m/s)
  health: number; // 0-100
  strategy: Strategy;
  trackPreference: Surface;
  
  // New attributes (0-100)
  acceleration: number; // Higher = faster burst at start
  endurance: number; // Higher = slower health decay
  consistency: number; // Higher = less speed variance
  staminaRecovery: number; // Higher = more health recovered between races
  
  // Race State
  lane: number;
  progress: number; // 0-1 (current lap fraction)
  laps: number; // completed laps
  totalDistance: number; // meters
  status: RacerStatus;
  currentSpeed: number;
  finishTime?: number; // ms
}

export interface Track {
  id: string;
  name: string;
  surface: Surface;
  length: number; // meters
  laps: number;
}

export interface RaceEvent {
  id: string;
  startTime: number; // timestamp
  seed: number; // Deterministic seed for this race
  track: Track;
  racerIds: string[];
  completed: boolean;
  results?: string[]; // racerIds in order of finish
  finishTimes?: Record<string, number>; // racerId -> finish time in ms
}

export type ViewState = 'race' | 'roster' | 'standings' | 'season' | 'seasons' | 'schedule' | 'profile' | 'tracks' | 'historical-standings' | 'historical-racer-profile';