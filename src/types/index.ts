export type RacerStatus = 'active' | 'injured' | 'finished';
export type Strategy = 'aggressive' | 'conservative' | 'balanced';
export type Surface = 'asphalt' | 'dirt' | 'grass';

export interface Racer {
  id: string;
  name: string;
  color: string;
  baseSpeed: number; // 70-90
  currentSpeed: number;
  progress: number; // 0.0 to 1.0 per lap
  totalDistance: number; // Cumulative distance
  laps: number;
  status: RacerStatus;
  strategy: Strategy;
  trackPreference: Surface;
  
  // New attributes (0-100)
  acceleration: number;
  endurance: number;
  consistency: number;
  staminaRecovery: number;
  
  // Race state
  health: number;
  lane: number;
  finishTime?: number;
}

export interface RaceState {
  racers: Racer[];
  isRacing: boolean;
  winnerId: string | null;
}